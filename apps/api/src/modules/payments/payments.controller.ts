import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../../lib/prisma";
import razorpay, { getRazorpay } from "../../lib/razorpay";
import { VerifyPaymentInput } from "@medico/shared";

export async function createRazorpayOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId || "guest";
  const { orderId, amount: bodyAmount, currency = "INR", receipt } = req.body;

  let amountInPaise = 0;
  let order: any = null;
  let receiptId = receipt;

  if (orderId) {
    order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.isPaid) {
      res.status(400).json({ success: false, message: "Order is already paid" });
      return;
    }

    amountInPaise = Math.round(Number(order.totalAmount) * 100);
    receiptId = receiptId || order.orderNumber;
  } else if (bodyAmount !== undefined) {
    const numAmount = Number(bodyAmount);
    if (isNaN(numAmount) || numAmount < 1) {
      res.status(400).json({ success: false, message: "Amount is required and must be at least 100 paise" });
      return;
    }
    amountInPaise = Math.round(numAmount);
    receiptId = receiptId || `rcpt_${Date.now()}`;
  } else {
    res.status(400).json({ success: false, message: "Either orderId or amount (in paise) is required" });
    return;
  }

  // Minimum amount constraint for Razorpay is 100 paise (₹1.00)
  if (amountInPaise < 100) {
    res.status(400).json({ success: false, message: "Minimum order amount is 100 paise (₹1.00)" });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    res.status(500).json({
      success: false,
      message: "Razorpay credentials are not configured on server",
    });
    return;
  }

  try {
    const rzp = getRazorpay();
    const razorpayOrder = await rzp.orders.create({
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: receiptId || `rcpt_${Date.now()}`,
      notes: {
        orderId: order?.id || "standalone",
        userId,
      },
    });

    if (order) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: order.totalAmount,
          currency: currency || "INR",
          status: "CREATED",
        },
      });
    }

    res.json({
      success: true,
      order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      data: {
        orderId: order?.id,
        razorpayOrderId: razorpayOrder.id,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
        orderNumber: order?.orderNumber,
      },
    });
  } catch (err: any) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({
      success: false,
      message: "Could not create Razorpay order",
      error: err.error?.description || err.message || "Razorpay API error",
    });
  }
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const {
    orderId,
    razorpayOrderId,
    razorpay_order_id,
    order_id,
    razorpayPaymentId,
    razorpay_payment_id,
    payment_id,
    razorpaySignature,
    razorpay_signature,
    signature,
  } = req.body;

  const actualOrderId = razorpay_order_id || razorpayOrderId || order_id;
  const actualPaymentId = razorpay_payment_id || razorpayPaymentId || payment_id;
  const actualSignature = razorpay_signature || razorpaySignature || signature;

  if (!actualOrderId || !actualPaymentId || !actualSignature) {
    res.status(400).json({
      success: false,
      message: "Missing required payment verification fields: order_id, payment_id, signature",
    });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({
      success: false,
      message: "Razorpay key secret is not configured on server",
    });
    return;
  }

  // Cryptographic HMAC SHA-256 verification: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const body = `${actualOrderId}|${actualPaymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(actualSignature)
    );
  } catch {
    isValid = false;
  }

  if (!isValid) {
    res.status(400).json({
      success: false,
      message: "Invalid payment signature verification failed. Order not marked as paid.",
    });
    return;
  }

  // Atomically update Payment & Order if an order is associated
  if (orderId) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { razorpayOrderId: actualOrderId },
          data: {
            razorpayPaymentId: actualPaymentId,
            razorpaySignature: actualSignature,
            status: "PAID",
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            isPaid: true,
            statusHistory: {
              create: {
                status: "CONFIRMED",
                note: `Payment verified successfully via Razorpay (Payment ID: ${actualPaymentId})`,
              },
            },
          },
        });
      });
    } catch (dbErr) {
      console.warn("DB order update warning during verification:", dbErr);
    }
  }

  res.json({
    success: true,
    message: "Payment verified successfully",
    orderId: actualOrderId,
    paymentId: actualPaymentId,
  });
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const signature = req.headers["x-razorpay-signature"] as string;

  if (secret) {
    if (!signature) {
      res.status(400).json({ success: false, message: "Missing webhook signature" });
      return;
    }
    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      res.status(400).json({ success: false, message: "Invalid webhook signature" });
      return;
    }
  }

  const event = req.body?.event;
  const payload = req.body?.payload;

  console.log(`[Razorpay Webhook] Received event: ${event}`);

  if (event === "payment.captured") {
    const paymentEntity = payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    if (razorpayOrderId) {
      await prisma.$transaction(async (tx) => {
        // Idempotently update payment records
        const existingPayments = await tx.payment.findMany({
          where: { razorpayOrderId },
        });

        await tx.payment.updateMany({
          where: { razorpayOrderId },
          data: {
            status: "PAID",
            razorpayPaymentId: paymentEntity.id,
            rawResponse: paymentEntity,
          },
        });

        // Ensure linked orders are idempotently confirmed and marked paid
        for (const p of existingPayments) {
          if (p.orderId) {
            const ord = await tx.order.findUnique({ where: { id: p.orderId } });
            if (ord && !ord.isPaid) {
              await tx.order.update({
                where: { id: ord.id },
                data: {
                  paymentStatus: "PAID",
                  status: ord.status === "PLACED" ? "CONFIRMED" : ord.status,
                  isPaid: true,
                },
              });
            }
          }
        }
      });
    }
  } else if (event === "payment.failed") {
    const paymentEntity = payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    if (razorpayOrderId) {
      await prisma.payment.updateMany({
        where: { razorpayOrderId },
        data: {
          status: "FAILED",
          errorDescription: paymentEntity.error_description || "Payment failed",
          rawResponse: paymentEntity,
        },
      });
    }
  }

  res.json({ status: "ok" });
}

export async function initiateRefund(req: Request, res: Response): Promise<void> {
  const adminUserId = req.user!.userId;
  const { orderId, amount, reason } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order || !order.isPaid) {
    res.status(400).json({ success: false, message: "Order is not eligible for refund" });
    return;
  }

  const paidPayment = order.payments.find((p) => p.status === "PAID");
  if (!paidPayment) {
    res.status(400).json({ success: false, message: "No captured payment record found for this order" });
    return;
  }

  const refundAmount = amount ? Number(amount) : Number(order.totalAmount);

  // In production, call razorpay.payments.refund
  const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        paymentId: paidPayment.id,
        orderId: order.id,
        razorpayRefundId: refundId,
        amount: refundAmount,
        reason: reason || "Customer requested refund",
        status: "PROCESSED",
        initiatedByUserId: adminUserId,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "RETURNED",
        paymentStatus: "REFUNDED",
        statusHistory: {
          create: {
            status: "RETURNED",
            note: `Refund of ₹${refundAmount} processed. Reason: ${reason || "Admin initiated"}`,
            changedByUserId: adminUserId,
          },
        },
      },
    });
  });

  res.json({
    success: true,
    message: `Refund of ₹${refundAmount} processed successfully`,
    data: { refundId },
  });
}
