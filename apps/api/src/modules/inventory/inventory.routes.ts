import { Router, Request, Response } from "express";
import prisma from "../../lib/prisma";
import { authenticate, requireRole } from "../../middlewares/auth";

const router = Router();

// Only PHARMACIST and ADMIN can inspect batches and expiry warnings
router.get("/batches/expiring", authenticate, requireRole("PHARMACIST", "ADMIN"), async (_req: Request, res: Response) => {
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const expiringBatches = await prisma.inventoryBatch.findMany({
    where: {
      expiryDate: { lte: ninetyDaysFromNow },
      quantity: { gt: 0 },
    },
    include: {
      variant: {
        include: { product: true },
      },
    },
    orderBy: { expiryDate: "asc" },
  });

  res.json({ success: true, data: expiringBatches });
});

router.get("/low-stock", authenticate, requireRole("PHARMACIST", "ADMIN"), async (_req: Request, res: Response) => {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
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
  });

  const lowStock = variants
    .map((v) => {
      const stock = v.batches.reduce((sum, b) => sum + b.quantity, 0);
      return {
        variantId: v.id,
        sku: v.sku,
        name: `${v.product.name} - ${v.name}`,
        currentStock: stock,
      };
    })
    .filter((v) => v.currentStock <= 20);

  res.json({ success: true, data: lowStock });
});

export default router;
