import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { CreateOrderInput, CURRENCY_CONFIG } from "@medico/shared";
import { InventoryService } from "../inventory/inventory.service";
import { InvoiceService } from "./invoice.service";

export async function createOrder(
  req: Request<{}, {}, CreateOrderInput>,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const { addressId, paymentMethod, prescriptionId, couponCode, deliverySlot, notes } = req.body;

  // 1. Validate delivery address
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) {
    res.status(404).json({ success: false, message: "Delivery address not found" });
    return;
  }

  // 2. Fetch User's Cart
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              batches: {
                where: {
                  quantity: { gt: 0 },
                  expiryDate: { gt: new Date() },
                  isBlocked: false,
                },
              },
            },
          },
        },
      },
    },
  });

  const sessionId = (req.headers["x-session-id"] as string) || req.cookies?.cartSessionId;
  if ((!cart || cart.items.length === 0) && sessionId) {
    const sessionCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                batches: {
                  where: {
                    quantity: { gt: 0 },
                    expiryDate: { gt: new Date() },
                    isBlocked: false,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (sessionCart && sessionCart.items.length > 0) {
      cart = sessionCart;
    }
  }

  if (!cart || cart.items.length === 0) {
    res.status(400).json({ success: false, message: "Your cart is empty" });
    return;
  }

  // 3. Optional prescription attachment (non-blocking)


  if (prescriptionId) {
    const rx = await prisma.prescription.findFirst({
      where: { id: prescriptionId, userId },
    });
    if (!rx) {
      res.status(404).json({ success: false, message: "Specified prescription not found" });
      return;
    }
  }

  // 4. Server-Side Price & Tax Recomputation (Never trust client prices)
  let subtotal = 0;
  let totalGst = 0;

  for (const item of cart.items) {
    const price = Number(item.variant.price);
    const itemTotal = price * item.quantity;
    const gstRate = Number(item.variant.product.gstRate) || 12;

    const baseAmount = itemTotal / (1 + gstRate / 100);
    const itemGst = itemTotal - baseAmount;

    subtotal += itemTotal;
    totalGst += itemGst;

    const availableStock = item.variant.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (availableStock < item.quantity) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock for '${item.variant.product.name} (${item.variant.packSize})'. Only ${availableStock} available.`,
      });
      return;
    }
  }

  // 5. Coupon discount calculation
  let discountAmount = 0;
  let appliedCouponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase(), isActive: true },
    });

    if (coupon && new Date() >= coupon.startDate && new Date() <= coupon.endDate && subtotal >= Number(coupon.minOrderValue)) {
      appliedCouponId = coupon.id;
      const discountVal = Number(coupon.discountValue);
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (subtotal * discountVal) / 100;
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
        }
      } else {
        discountAmount = discountVal;
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const deliveryFee = subtotal >= CURRENCY_CONFIG.freeShippingThreshold ? 0 : CURRENCY_CONFIG.defaultDeliveryFee;
  const totalAmount = subtotal - discountAmount + deliveryFee;
  const orderNumber = `MED-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // 6. DB Transaction: Create Order, Reserve Stock (FEFO), Record Status & History, Clear Cart
  const order = await prisma.$transaction(async (tx) => {
    // Deduct stock in FEFO order
    for (const item of cart.items) {
      await InventoryService.deductStockFEFO(tx, item.variantId, item.quantity);
    }

    // Increment coupon used count if used
    if (appliedCouponId) {
      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        status: "PLACED",
        subtotal,
        discount: discountAmount,
        gstAmount: totalGst,
        deliveryFee,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
        prescriptionId: prescriptionId || undefined,
        couponId: appliedCouponId || undefined,
        deliverySlot,
        notes,
        isPaid: false,
        items: {
          create: cart.items.map((it) => ({
            variantId: it.variantId,
            productName: it.variant.product.name,
            packSize: it.variant.packSize,
            sku: it.variant.sku,
            price: it.variant.price,
            mrp: it.variant.mrp,
            gstRate: it.variant.product.gstRate,
            gstAmount: Number(it.variant.price) * it.quantity - (Number(it.variant.price) * it.quantity) / (1 + Number(it.variant.product.gstRate) / 100),
            quantity: it.quantity,
            subtotal: Number(it.variant.price) * it.quantity,
          })),
        },
        statusHistory: {
          create: {
            status: "PLACED",
            note: "Order placed successfully.",
            changedByUserId: userId,
          },
        },
      },
      include: {
        items: true,
        address: true,
      },
    });

    // Clear cart items
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: order,
  });
}

export async function getUserOrders(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        address: true,
        prescription: { select: { id: true, fileUrl: true, status: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: orders,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getOrderById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const orderId = req.params.id;

  const whereClause: any = {
    OR: [{ id: orderId }, { orderNumber: orderId }],
  };
  if (userRole === "CUSTOMER" && userId) {
    whereClause.userId = userId;
  }

  const order = await prisma.order.findFirst({
    where: whereClause,
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
      address: true,
      prescription: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
      payments: true,
      refunds: true,
    },
  });

  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  res.json({ success: true, data: order });
}

export async function cancelOrder(req: Request<{ id: string }, {}, { reason: string }>, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const orderId = req.params.id;
  const { reason } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  if (order.status !== "PLACED" && order.status !== "CONFIRMED") {
    res.status(400).json({
      success: false,
      message: `Cannot cancel an order with status '${order.status}'. Please contact customer support.`,
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Restore inventory stock
    for (const item of order.items) {
      await InventoryService.restoreStock(tx, item.variantId, item.quantity);
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        statusHistory: {
          create: {
            status: "CANCELLED",
            note: `Cancelled by customer. Reason: ${reason}`,
            changedByUserId: userId,
          },
        },
      },
    });
  });

  res.json({ success: true, message: "Order cancelled successfully and stock restored." });
}

export async function downloadInvoice(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const orderId = req.params.id;

  const whereClause: any = {
    OR: [{ id: orderId }, { orderNumber: orderId }],
  };
  if (userRole === "CUSTOMER" && userId) {
    whereClause.userId = userId;
  }

  const order = await prisma.order.findFirst({
    where: whereClause,
    include: {
      items: true,
      address: true,
      user: true,
    },
  });

  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  InvoiceService.generateGSTInvoicePDF(
    {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customerName: order.address.fullName,
      customerPhone: order.address.phone,
      customerAddress: `${order.address.addressLine1}, ${order.address.addressLine2 ? order.address.addressLine2 + ", " : ""}${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
      items: order.items.map((i) => ({
        productName: i.productName,
        packSize: i.packSize,
        sku: i.sku,
        quantity: i.quantity,
        price: Number(i.price),
        mrp: Number(i.mrp),
        gstRate: Number(i.gstRate),
        subtotal: Number(i.subtotal),
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      gstAmount: Number(order.gstAmount),
      deliveryFee: Number(order.deliveryFee),
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    },
    res
  );
}
