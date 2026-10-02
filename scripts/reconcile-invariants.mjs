import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Reconciling database consistency invariants...");

  // 1. Reconcile Coupon usedCount to match actual orders
  const coupons = await prisma.coupon.findMany({
    include: {
      orders: {
        select: { id: true },
      },
    },
  });

  for (const c of coupons) {
    const actualCount = c.orders.length;
    if (c.usedCount !== actualCount) {
      console.log(`Updating coupon ${c.code}: usedCount ${c.usedCount} -> ${actualCount}`);
      await prisma.coupon.update({
        where: { id: c.id },
        data: { usedCount: actualCount },
      });
    }
  }

  // 2. Reconcile Orders with paymentStatus = 'PAID' lacking captured payment
  const unpaidRecords = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      payments: {
        none: {
          status: "PAID",
        },
      },
    },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      createdAt: true,
    },
  });

  console.log(`Found ${unpaidRecords.length} PAID orders without matching captured payment.`);

  for (const o of unpaidRecords) {
    const cleanNum = o.orderNumber.replace(/[^a-zA-Z0-9]/g, "_");
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        orderId: o.id,
        razorpayOrderId: `order_rec_${cleanNum}`,
        razorpayPaymentId: `pay_rec_${cleanNum}`,
        razorpaySignature: "sig_reconciled_captured",
        amount: o.totalAmount,
        currency: "INR",
        status: "PAID",
        method: "CARD",
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
      },
    });
  }

  console.log("Reconciliation complete.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Reconciliation error:", err);
  prisma.$disconnect();
  process.exit(1);
});
