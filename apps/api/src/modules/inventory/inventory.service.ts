import prisma from "../../lib/prisma";
import { Prisma } from "@prisma/client";

export class InventoryService {
  /**
   * Deducts quantity from batches in FEFO order (First Expiry First Out).
   * Executes within the provided Prisma transaction client.
   */
  static async deductStockFEFO(
    tx: Prisma.TransactionClient,
    variantId: string,
    quantityToDeduct: number
  ): Promise<void> {
    const batches = await tx.inventoryBatch.findMany({
      where: {
        variantId,
        quantity: { gt: 0 },
        expiryDate: { gt: new Date() },
        isBlocked: false,
      },
      orderBy: { expiryDate: "asc" }, // FEFO principle
    });

    const totalAvailable = batches.reduce((acc, b) => acc + b.quantity, 0);
    if (totalAvailable < quantityToDeduct) {
      throw new Error(`Insufficient stock for variant ${variantId}. Available: ${totalAvailable}, Requested: ${quantityToDeduct}`);
    }

    let remaining = quantityToDeduct;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const deduction = Math.min(batch.quantity, remaining);
      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          quantity: { decrement: deduction },
        },
      });

      remaining -= deduction;
    }
  }

  /**
   * Restores stock back to the closest-expiry active batch upon cancellation/failure.
   */
  static async restoreStock(
    tx: Prisma.TransactionClient,
    variantId: string,
    quantityToRestore: number
  ): Promise<void> {
    const batch = await tx.inventoryBatch.findFirst({
      where: {
        variantId,
        expiryDate: { gt: new Date() },
        isBlocked: false,
      },
      orderBy: { expiryDate: "asc" },
    });

    if (batch) {
      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          quantity: { increment: quantityToRestore },
        },
      });
    }
  }

  /**
   * Checks current sellable stock across all active, non-expired batches for a variant.
   */
  static async getSellableStock(variantId: string): Promise<number> {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        variantId,
        quantity: { gt: 0 },
        expiryDate: { gt: new Date() },
        isBlocked: false,
      },
    });

    return batches.reduce((sum, b) => sum + b.quantity, 0);
  }
}
