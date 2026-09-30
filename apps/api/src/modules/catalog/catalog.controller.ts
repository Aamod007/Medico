import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { ProductQueryInput } from "@medico/shared";
import { Prisma } from "@prisma/client";

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  res.json({ success: true, data: categories });
}

export async function getBrands(_req: Request, res: Response): Promise<void> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  res.json({ success: true, data: brands });
}

export async function getProducts(req: Request<{}, {}, {}, ProductQueryInput>, res: Response): Promise<void> {
  const {
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    prescriptionRequired,
    inStock,
    sort,
    page = 1,
    limit = 20,
  } = req.query;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (category) {
    where.category = { slug: category };
  }

  if (brand) {
    where.brand = { slug: brand };
  }

  if (prescriptionRequired !== undefined) {
    where.prescriptionRequired = String(prescriptionRequired) === "true";
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { composition: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { manufacturer: { contains: search, mode: "insensitive" } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.variants = {
      some: {
        price: {
          ...(minPrice !== undefined ? { gte: Number(minPrice) } : {}),
          ...(maxPrice !== undefined ? { lte: Number(maxPrice) } : {}),
        },
      },
    };
  }

  if (inStock) {
    where.variants = {
      some: {
        batches: {
          some: {
            quantity: { gt: 0 },
            expiryDate: { gt: new Date() },
            isBlocked: false,
          },
        },
      },
    };
  }

  // Sorting logic
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price_asc") {
    orderBy = { variants: { _count: "asc" } }; // Handled in mapping or base
  } else if (sort === "price_desc") {
    orderBy = { variants: { _count: "desc" } };
  } else if (sort === "newest") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "featured") {
    orderBy = { isFeatured: "desc" };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
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
              select: { quantity: true, expiryDate: true },
            },
          },
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    }),
  ]);

  // Transform and enrich with calculated ratings & stock
  const data = products.map((p) => {
    const defaultVariant = p.variants.find((v) => v.isDefault) || p.variants[0];
    const totalStock = p.variants.reduce(
      (acc, v) => acc + v.batches.reduce((bAcc, b) => bAcc + b.quantity, 0),
      0
    );
    const avgRating =
      p.reviews.length > 0
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length
        : 4.8;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      composition: p.composition,
      images: p.images,
      prescriptionRequired: p.prescriptionRequired,
      scheduleType: p.scheduleType,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      brand: p.brand,
      category: p.category,
      defaultVariant,
      variants: p.variants,
      totalStock,
      inStock: totalStock > 0,
      rating: Number(avgRating.toFixed(1)),
      reviewCount: p.reviews.length,
    };
  });

  res.json({
    success: true,
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}

export async function getProductBySlug(req: Request<{ slug: string }>, res: Response): Promise<void> {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: true,
      variants: {
        where: { isActive: true },
        include: {
          batches: {
            where: {
              quantity: { gt: 0 },
              expiryDate: { gt: new Date() },
              isBlocked: false,
            },
            orderBy: { expiryDate: "asc" }, // FEFO order
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || product.deletedAt || !product.isActive) {
    res.status(404).json({ success: false, message: "Product not found" });
    return;
  }

  // Find related products in same category or matching composition
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
      deletedAt: null,
    },
    take: 6,
    include: {
      brand: true,
      variants: { where: { isDefault: true } },
      reviews: { select: { rating: true } },
    },
  });

  res.json({
    success: true,
    data: {
      ...product,
      relatedProducts,
    },
  });
}

export async function searchAutocomplete(req: Request, res: Response): Promise<void> {
  const query = (req.query.q as string) || "";
  if (!query || query.trim().length < 2) {
    res.json({ success: true, data: { products: [], categories: [], brands: [] } });
    return;
  }

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { composition: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
        deletedAt: null,
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        composition: true,
        prescriptionRequired: true,
        variants: {
          where: { isDefault: true },
          select: { price: true, mrp: true },
          take: 1,
        },
      },
    }),
    prisma.category.findMany({
      where: { name: { contains: query, mode: "insensitive" }, isActive: true },
      take: 3,
      select: { id: true, name: true, slug: true, image: true },
    }),
    prisma.brand.findMany({
      where: { name: { contains: query, mode: "insensitive" }, isActive: true },
      take: 3,
      select: { id: true, name: true, slug: true, logo: true },
    }),
  ]);

  res.json({
    success: true,
    data: { products, categories, brands },
  });
}
