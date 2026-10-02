import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      orderNumber: { in: ["MED-2026-100002", "MED-2026-100003", "MED-2026-100004", "MED-2026-100005"] },
    },
    include: {
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  for (const o of orders) {
    console.log(`Order ${o.orderNumber} (Current Status: ${o.status}):`);
    o.statusHistory.forEach((h, i) => {
      console.log(`  [${i}] ${h.status} at ${h.createdAt.toISOString()} - ${h.note}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
