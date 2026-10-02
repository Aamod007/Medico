import { PrismaClient, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const maxOrders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: "MED-PAST-MAX-" } },
    include: { payments: true },
  });

  for (const o of maxOrders) {
    if (o.payments.length === 0) {
      await prisma.payment.create({
        data: {
          orderId: o.id,
          razorpayOrderId: `order_test_${o.orderNumber.toLowerCase()}`,
          razorpayPaymentId: `pay_test_${o.orderNumber.toLowerCase()}`,
          razorpaySignature: `sig_test_${o.orderNumber.toLowerCase()}`,
          amount: o.totalAmount,
          currency: "INR",
          status: PaymentStatus.PAID,
          method: "UPI",
        },
      });
      console.log(`Created payment for ${o.orderNumber}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
