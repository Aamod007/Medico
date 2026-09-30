import prisma from "../lib/prisma";
import { InventoryService } from "../modules/inventory/inventory.service";

export async function runInventoryCleanup(): Promise<void> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // 1. Release stock for unpaid, abandoned online orders
  const abandonedOrders = await prisma.order.findMany({
    where: {
      paymentMethod: "RAZORPAY",
      paymentStatus: "PENDING",
      status: "PLACED",
      createdAt: { lte: fifteenMinutesAgo },
    },
    include: { items: true },
  });

  for (const order of abandonedOrders) {
    console.log(`[Job] Releasing stock for abandoned order ${order.orderNumber}`);

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await InventoryService.restoreStock(tx, item.variantId, item.quantity);
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelReason: "Payment timeout: abandoned after 15 minutes",
          statusHistory: {
            create: {
              status: "CANCELLED",
              note: "Auto-cancelled due to payment timeout. Reserved stock released back to inventory.",
            },
          },
        },
      });
    });
  }

  // 2. Block expired batches from being dispensed
  const expiredBatches = await prisma.inventoryBatch.updateMany({
    where: {
      expiryDate: { lte: new Date() },
      isBlocked: false,
    },
    data: {
      isBlocked: true,
    },
  });

  if (expiredBatches.count > 0) {
    console.log(`[Job] Blocked ${expiredBatches.count} expired inventory batches from sale.`);
  }
}

// Start periodic interval (runs every 5 minutes)
export function startBackgroundJobs(): NodeJS.Timeout {
  console.log("⏱️ Background inventory cleanup job initialized (5m interval)");
  return setInterval(runInventoryCleanup, 5 * 60 * 1000);
}
