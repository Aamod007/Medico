import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface DbSnapshot {
  cartItemCount: number;
  orderCount: number;
  batchQuantities: { id: string; quantity: number }[];
  couponUsedCounts: { id: string; usedCount: number }[];
}

let activeSnapshot: DbSnapshot | null = null;

/**
 * Captures a baseline snapshot of critical mutable data before test runs.
 */
export async function takeDbSnapshot(): Promise<DbSnapshot> {
  const [cartItemCount, orderCount, batches, coupons] = await Promise.all([
    prisma.cartItem.count(),
    prisma.order.count(),
    prisma.inventoryBatch.findMany({ select: { id: true, quantity: true } }),
    prisma.coupon.findMany({ select: { id: true, usedCount: true } }),
  ]);

  activeSnapshot = {
    cartItemCount,
    orderCount,
    batchQuantities: batches,
    couponUsedCounts: coupons,
  };

  return activeSnapshot;
}

/**
 * Restores inventory batches and coupon counters to baseline snapshot values.
 */
export async function restoreDbSnapshot(): Promise<void> {
  if (!activeSnapshot) return;

  // Restore inventory quantities
  for (const b of activeSnapshot.batchQuantities) {
    await prisma.inventoryBatch.update({
      where: { id: b.id },
      data: { quantity: b.quantity },
    });
  }

  // Restore coupon used counts
  for (const c of activeSnapshot.couponUsedCounts) {
    await prisma.coupon.update({
      where: { id: c.id },
      data: { usedCount: c.usedCount },
    });
  }
}

/**
 * Resets a specific user's cart for deterministic testing.
 */
export async function clearUserCart(userId: string): Promise<void> {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

/**
 * Resets the race-test variant inventory back to exactly 5 units.
 */
export async function resetRaceTestBatch(): Promise<void> {
  const raceVariant = await prisma.productVariant.findUnique({
    where: { sku: "RACE-TEST-SKU-5" },
  });
  if (raceVariant) {
    await prisma.inventoryBatch.deleteMany({ where: { variantId: raceVariant.id } });
    await prisma.inventoryBatch.create({
      data: {
        variantId: raceVariant.id,
        batchNumber: "RACE-5-UNITS-ONLY",
        mfgDate: new Date("2024-06-01"),
        expiryDate: new Date("2027-06-01"),
        quantity: 5,
        costPrice: 18,
        isBlocked: false,
      },
    });
  }
}

export { prisma };
