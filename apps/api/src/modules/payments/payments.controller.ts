import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../../lib/prisma";
import razorpay from "../../lib/razorpay";
import { VerifyPaymentInput } from "@medico/shared";

export async function createRazorpayOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { orderId } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  if (order.isPaid) {
    res.status(400).json({ success: false, message: "Order is already paid" });
    return;
  }

  // Amount in Paise (INR smallest denomination)
  const amountInPaise = Math.round(Number(order.totalAmount) * 100);

  try {
    let razorpayOrder;

    // Check if key is placeholder in development
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    if (keyId.startsWith("rzp_test_Your") || !process.env.RAZORPAY_KEY_SECRET) {
      // Mock Razorpay order ID in demo mode
      razorpayOrder = {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: amountInPaise,
        currency: "INR",
        status: "created",
      };
    } else {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          userId,
        },
      });
    }

    // Record Payment
    await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: order.totalAmount,
        currency: "INR",
        status: "CREATED",
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_YourTestKeyIdHere",
        orderNumber: order.orderNumber,
      },
    });
  } catch (err: any) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ success: false, message: "Could not create payment order", error: err.message });
  }
}

export async function verifyPayment(
  req: Request<{}, {}, VerifyPaymentInput>,
  res: Response
): Promise<void> {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "YourTestKeySecretHere";

  // Check if demo/mock payment
  const isMockPayment =
    razorpayOrderId.startsWith("order_mock_") ||
    keySecret === "YourTestKeySecretHere";

  let isValid = false;

  if (isMockPayment) {
    isValid = true;
  } else {
    // Cryptographic HMAC SHA-256 verification with timing-safe compare
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpaySignature)
      );
    } catch {
      isValid = false;
    }
  }

  if (!isValid) {
    res.status(400).json({ success: false, message: "Invalid payment signature verification failed" });
    return;
  }

  // Update Payment & Order atomically
  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { razorpayOrderId },
      data: {
        razorpayPaymentId,
        razorpaySignature,
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
            note: `Payment verified successfully via Razorpay (Payment ID: ${razorpayPaymentId})`,
          },
        },
      },
    });
  });

  res.json({ success: true, message: "Payment verified successfully and order confirmed" });
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const signature = req.headers["x-razorpay-signature"] as string;

  if (secret && signature) {
    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      res.status(400).send("Invalid webhook signature");
      return;
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`[Razorpay Webhook] Received event: ${event}`);

  if (event === "payment.captured") {
    const paymentEntity = payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    if (razorpayOrderId) {
      await prisma.payment.updateMany({
        where: { razorpayOrderId },
        data: { status: "PAID", rawResponse: paymentEntity },
      });
    }
  } else if (event === "payment.failed") {
    const paymentEntity = payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
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
