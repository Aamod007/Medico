import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import cache from "../../lib/redis";
import { ProductQueryInput } from "@medico/shared";
import { Prisma } from "@prisma/client";

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const cacheKey = "catalog:categories";
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }
  } catch {
    // Cache miss fallback
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  try {
    await cache.set(cacheKey, JSON.stringify(categories), "EX", 120);
  } catch {
    // Cache write error fallback
  }

  res.json({ success: true, data: categories });
}

export async function getBrands(_req: Request, res: Response): Promise<void> {
  const cacheKey = "catalog:brands";
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }
  } catch {
    // Cache miss fallback
  }

  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  try {
    await cache.set(cacheKey, JSON.stringify(brands), "EX", 120);
  } catch {
    // Cache write error fallback
  }

  res.json({ success: true, data: brands });
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  const {
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page = 1,
    limit = 20,
  } = (req.query as unknown) as ProductQueryInput;

  const cacheKey = `catalog:products:${JSON.stringify(req.query)}`;
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }
  } catch {
    // Cache miss fallback
  }

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

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  if (sort === "price_asc" || sort === "price_desc") {
    // True global sorting by variant price across the entire matching catalog
    const products = await prisma.product.findMany({
      where,
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
    });

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

    if (sort === "price_asc") {
      data.sort((a, b) => Number(a.defaultVariant?.price || 0) - Number(b.defaultVariant?.price || 0));
    } else {
      data.sort((a, b) => Number(b.defaultVariant?.price || 0) - Number(a.defaultVariant?.price || 0));
    }

    const paginated = data.slice(skip, skip + take);

    const result = {
      success: true,
      data: paginated,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: data.length,
        totalPages: Math.ceil(data.length / Number(limit)),
      },
    };

    try {
      await cache.set(cacheKey, JSON.stringify(result), "EX", 60);
    } catch {}

    res.json(result);
    return;
  }

  // Non-price sorting (database level)
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "newest") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "featured") {
    orderBy = { isFeatured: "desc" };
  }

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

  const result = {
    success: true,
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };

  try {
    await cache.set(cacheKey, JSON.stringify(result), "EX", 60);
  } catch {}

  res.json(result);
}

export async function getProductBySlug(req: Request<{ slug: string }>, res: Response): Promise<void> {
  const { slug } = req.params;
  const cacheKey = `catalog:product:${slug}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }
  } catch {}

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

  const result = {
    success: true,
    data: {
      ...product,
      relatedProducts,
    },
  };

  try {
    await cache.set(cacheKey, JSON.stringify(result), "EX", 60);
  } catch {}

  res.json(result);
}

export async function searchAutocomplete(req: Request, res: Response): Promise<void> {
  const query = (req.query.q as string) || "";
  if (!query || query.trim().length < 2) {
    res.json({ success: true, data: { products: [], categories: [], brands: [] } });
    return;
  }

  const cacheKey = `catalog:autocomplete:${query.toLowerCase().trim()}`;
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }
  } catch {}

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

  const result = {
    success: true,
    data: { products, categories, brands },
  };

  try {
    await cache.set(cacheKey, JSON.stringify(result), "EX", 60);
  } catch {}

  res.json(result);
}

export async function getProductSubstitutes(req: Request<{ slug: string }>, res: Response): Promise<void> {
  const { slug } = req.params;
  const cacheKey = `catalog:substitutes:${slug}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }
  } catch {}

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, composition: true, name: true },
  });

  if (!product) {
    res.status(404).json({ success: false, message: "Product not found" });
    return;
  }

  if (!product.composition) {
    res.json({ success: true, data: [] });
    return;
  }

  // Extract primary salt/ingredient before dosage or comma
  const primarySalt = product.composition.split(/[,+]/)[0].trim().replace(/\d+\s*(mg|g|mcg|ml|%)/gi, "").trim();

  const substitutes = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      isActive: true,
      deletedAt: null,
      composition: { contains: primarySalt, mode: "insensitive" },
    },
    take: 6,
    include: {
      brand: true,
      category: true,
      variants: {
        where: { isActive: true },
        take: 1,
      },
      reviews: {
        where: { isApproved: true },
        select: { rating: true },
      },
    },
  });

  const formatted = substitutes.map((s) => {
    const defaultVariant = s.variants[0];
    const avgRating = s.reviews.length ? s.reviews.reduce((acc, r) => acc + r.rating, 0) / s.reviews.length : 4.5;
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      composition: s.composition,
      brand: s.brand,
      category: s.category,
      defaultVariant,
      rating: Number(avgRating.toFixed(1)),
      reviewCount: s.reviews.length,
      sameSalt: true,
    };
  });

  const result = { success: true, data: formatted };

  try {
    await cache.set(cacheKey, JSON.stringify(result), "EX", 120);
  } catch {}

  res.json(result);
}
