import { PrismaClient, PaymentStatus, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Reconciling historical orders, payments, and status history...");

  // 1. Reconcile MED-2026-100003 (SHIPPED, PAID)
  const order3 = await prisma.order.findUnique({
    where: { orderNumber: "MED-2026-100003" },
    include: { payments: true, statusHistory: true },
  });

  if (order3) {
    if (order3.payments.length === 0) {
      await prisma.payment.create({
        data: {
          orderId: order3.id,
          razorpayOrderId: "order_test_rzp_100003",
          razorpayPaymentId: "pay_test_rzp_100003",
          razorpaySignature: "sig_test_valid_100003",
          amount: order3.totalAmount,
          currency: "INR",
          status: PaymentStatus.PAID,
          method: "UPI",
        },
      });
      console.log("Created Payment for MED-2026-100003");
    }

    const hasShippedHistory = order3.statusHistory.some((h) => h.status === OrderStatus.SHIPPED);
    if (!hasShippedHistory) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order3.id,
          status: OrderStatus.SHIPPED,
          note: "Dispatched via BlueDart AWB #94810294",
        },
      });
      console.log("Added SHIPPED status history for MED-2026-100003");
    }
  }

  // 2. Reconcile MED-2026-100004 (DELIVERED, PAID)
  const order4 = await prisma.order.findUnique({
    where: { orderNumber: "MED-2026-100004" },
    include: { payments: true, statusHistory: true },
  });

  if (order4) {
    if (order4.payments.length === 0) {
      await prisma.payment.create({
        data: {
          orderId: order4.id,
          razorpayOrderId: "order_test_rzp_100004",
          razorpayPaymentId: "pay_test_rzp_100004",
          razorpaySignature: "sig_test_valid_100004",
          amount: order4.totalAmount,
          currency: "INR",
          status: PaymentStatus.PAID,
          method: "CARD",
        },
      });
      console.log("Created Payment for MED-2026-100004");
    }

    const existingStatuses = new Set(order4.statusHistory.map((h) => h.status));
    const statusesToAdd = [
      { status: OrderStatus.PACKED, note: "Packed in temperature safe container" },
      { status: OrderStatus.SHIPPED, note: "Dispatched via local delivery hub" },
      { status: OrderStatus.OUT_FOR_DELIVERY, note: "Out for delivery with courier" },
      { status: OrderStatus.DELIVERED, note: "Delivered to customer" },
    ];

    for (const s of statusesToAdd) {
      if (!existingStatuses.has(s.status)) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order4.id,
            status: s.status,
            note: s.note,
          },
        });
        console.log(`Added ${s.status} status history for MED-2026-100004`);
      }
    }
  }

  // 3. Reconcile MED-2026-100005 (CANCELLED)
  const order5 = await prisma.order.findUnique({
    where: { orderNumber: "MED-2026-100005" },
    include: { statusHistory: true },
  });

  if (order5) {
    const hasCancelledHistory = order5.statusHistory.some((h) => h.status === OrderStatus.CANCELLED);
    if (!hasCancelledHistory) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order5.id,
          status: OrderStatus.CANCELLED,
          note: "Order cancelled by customer before dispatch",
        },
      });
      console.log("Added CANCELLED status history for MED-2026-100005");
    }
  }

  console.log("✅ Reconciliation complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
