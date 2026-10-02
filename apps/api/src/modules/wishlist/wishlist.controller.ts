import { Request, Response, NextFunction } from "express";
import prisma from "../../lib/prisma";

// Transform product to match frontend expected structure with defaultVariant and stock
function formatProduct(p: any) {
  const defaultVariant = p.variants?.find((v: any) => v.isDefault) || p.variants?.[0];
  const totalStock = p.variants?.reduce(
    (acc: number, v: any) =>
      acc + (v.batches?.reduce((bAcc: number, b: any) => bAcc + b.quantity, 0) || 0),
    0
  ) || 0;
  const avgRating =
    p.reviews && p.reviews.length > 0
      ? p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length
      : 4.8;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    composition: p.composition,
    images: p.images,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    brand: p.brand,
    category: p.category,
    defaultVariant,
    variants: p.variants,
    totalStock,
    inStock: totalStock > 0,
    rating: Number(avgRating.toFixed(1)),
    reviewCount: p.reviews?.length || 0,
  };
}

export async function getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { ids } = req.query;

    let productIds: string[] = [];

    if (userId) {
      const items = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
      });
      productIds = items.map((i) => i.productId);
    } else if (typeof ids === "string" && ids.trim().length > 0) {
      productIds = ids.split(",").map((id) => id.trim()).filter(Boolean);
    }

    if (productIds.length === 0) {
      res.json({ success: true, data: [], count: 0 });
      return;
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        deletedAt: null,
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { isActive: true },
          include: {
            batches: {
              where: {
                quantity: { gt: 0 },
                expiryDate: { gt: new Date() },
                isBlocked: false,
              },
            },
          },
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    });

    const formatted = products.map(formatProduct);
    res.json({ success: true, data: formatted, count: formatted.length });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, message: "productId is required" });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    if (userId) {
      await prisma.wishlist.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        create: { userId, productId },
        update: {},
      });
    }

    res.json({
      success: true,
      message: "Medicine saved to wishlist",
      productId,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (userId && productId) {
      await prisma.wishlist.deleteMany({
        where: { userId, productId },
      });
    }

    res.json({
      success: true,
      message: "Medicine removed from wishlist",
      productId,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, message: "productId is required" });
      return;
    }

    let isWishlisted = false;

    if (userId) {
      const existing = await prisma.wishlist.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
      });

      if (existing) {
        await prisma.wishlist.delete({
          where: { id: existing.id },
        });
        isWishlisted = false;
      } else {
        await prisma.wishlist.create({
          data: { userId, productId },
        });
        isWishlisted = true;
      }
    }

    res.json({
      success: true,
      isWishlisted,
      productId,
      message: isWishlisted ? "Medicine saved to wishlist" : "Medicine removed from wishlist",
    });
  } catch (error) {
    next(error);
  }
}
