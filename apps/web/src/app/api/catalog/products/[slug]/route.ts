import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: any }
) {
  let slug = "";
  try {
    const rawParams = context?.params ? await context.params : {};
    const urlSlug = req.nextUrl?.pathname ? req.nextUrl.pathname.split("/").filter(Boolean).pop() : "";
    slug = rawParams?.slug || urlSlug || "";

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

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
              orderBy: { expiryDate: "asc" },
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
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        relatedProducts,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/catalog/products/[slug]:", error?.message);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
      const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
      const res = await fetch(
        `${supabaseUrl}/rest/v1/Product?slug=eq.${encodeURIComponent(slug)}&select=*,category:Category(*),brand:Brand(*),variants:ProductVariant(*)`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: "no-store",
        }
      );

      if (res.ok) {
        const list = await res.json();
        if (list.length > 0) {
          return NextResponse.json({
            success: true,
            data: { ...list[0], relatedProducts: [] },
          });
        }
      }
    } catch (fallbackError) {
      console.error("Supabase REST fallback failed:", fallbackError);
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}
