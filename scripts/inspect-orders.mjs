import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      payments: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  console.log(
    orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentsCount: o.payments.length,
      latestHistory: o.statusHistory[0]?.status,
      totalAmount: Number(o.totalAmount),
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      deliveryFee: Number(o.deliveryFee),
      gstAmount: Number(o.gstAmount),
    }))
  );
}

main().finally(() => prisma.$disconnect());
