import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const sort = searchParams.get("sort") || "featured";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || "24")));

    const { url: supabaseUrl } = getSupabaseConfig();
    
    const headers = getSupabaseHeaders({
      Prefer: "count=exact",
    });

    // Build PostgREST query parameters
    const queryParts: string[] = [
      "isActive=eq.true",
      "deletedAt=is.null",
      `select=*,category:Category${category ? "!inner" : ""}(id,name,slug),brand:Brand${brand ? "!inner" : ""}(id,name,slug),variants:ProductVariant(*,batches:InventoryBatch(*)),reviews:Review(rating)`,
    ];

    if (category) {
      queryParts.push(`category.slug=eq.${encodeURIComponent(category)}`);
    }

    if (brand) {
      queryParts.push(`brand.slug=eq.${encodeURIComponent(brand)}`);
    }

    if (search && search.trim()) {
      const q = encodeURIComponent(search.trim());
      queryParts.push(`or=(name.ilike.*${q}*,composition.ilike.*${q}*,description.ilike.*${q}*,manufacturer.ilike.*${q}*)`);
    }

    if (sort === "featured") {
      queryParts.push("order=isFeatured.desc,createdAt.desc");
    } else if (sort === "newest") {
      queryParts.push("order=createdAt.desc");
    } else {
      queryParts.push("order=createdAt.desc");
    }

    const offset = (page - 1) * limit;
    queryParts.push(`limit=${limit}`);
    queryParts.push(`offset=${offset}`);

    const url = `${supabaseUrl}/rest/v1/Product?${queryParts.join("&")}`;
    const res = await fetch(url, { headers, cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Supabase returned status ${res.status}`);
    }

    const totalHeader = res.headers.get("content-range");
    let total = 0;
    if (totalHeader) {
      const match = totalHeader.match(/\/(\d+)/);
      if (match) total = Number(match[1]);
    }

    const rawProducts: any[] = await res.json();

    let data = rawProducts.map((p) => {
      const variants = p.variants || [];
      const defaultVariant = variants.find((v: any) => v.isDefault) || variants[0];
      const totalStock = variants.reduce(
        (acc: number, v: any) =>
          acc +
          (v.batches || []).reduce((bAcc: number, b: any) => {
            const isNonExpired = !b.expiryDate || new Date(b.expiryDate) > new Date();
            return isNonExpired && !b.isBlocked ? bAcc + (b.quantity || 0) : bAcc;
          }, 0),
        0
      );

      const reviews = p.reviews || [];
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length
          : 4.8;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        composition: p.composition,
        images: p.images || [],
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        brand: p.brand,
        category: p.category,
        defaultVariant,
        variants,
        totalStock,
        inStock: totalStock > 0,
        rating: Number(avgRating.toFixed(1)),
        reviewCount: reviews.length || 12,
      };
    });

    // In-memory filter for price and inStock if requested
    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      data = data.filter((p) => {
        const price = p.defaultVariant?.price || 0;
        return price >= min && price <= max;
      });
    }

    if (inStock === "true") {
      data = data.filter((p) => p.inStock);
    }

    // Client-requested price sorting
    if (sort === "price_asc") {
      data.sort((a, b) => (a.defaultVariant?.price || 0) - (b.defaultVariant?.price || 0));
    } else if (sort === "price_desc") {
      data.sort((a, b) => (b.defaultVariant?.price || 0) - (a.defaultVariant?.price || 0));
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total: total || data.length,
        totalPages: Math.ceil((total || data.length) / limit),
      },
    });
  } catch (error: any) {
    console.error("Error in /api/catalog/products:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
