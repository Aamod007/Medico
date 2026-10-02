import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const rawParams = context?.params ? await context.params : {};
    const urlSlug = req.nextUrl?.pathname ? req.nextUrl.pathname.split("/").filter(Boolean).pop() : "";
    const slug = rawParams?.slug || urlSlug || "";

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

    const { url: supabaseUrl } = getSupabaseConfig();
        const headers = getSupabaseHeaders();

    const res = await fetch(
      `${supabaseUrl}/rest/v1/Product?slug=eq.${encodeURIComponent(slug)}&isActive=eq.true&deletedAt=is.null&select=*,category:Category(*),brand:Brand(*),variants:ProductVariant(*,batches:InventoryBatch(*)),reviews:Review(*,user:User(id,name,avatar))`,
      { headers, cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Supabase returned status ${res.status}`);
    }

    const list = await res.json();
    if (!list || list.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const product = list[0];

    // Fetch related products in the same category
    let relatedProducts: any[] = [];
    if (product.categoryId) {
      const relRes = await fetch(
        `${supabaseUrl}/rest/v1/Product?categoryId=eq.${product.categoryId}&id=neq.${product.id}&isActive=eq.true&deletedAt=is.null&select=*,brand:Brand(*),variants:ProductVariant(*)&limit=6`,
        { headers, cache: "no-store" }
      );
      if (relRes.ok) {
        relatedProducts = await relRes.json();
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        relatedProducts,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/catalog/products/[slug]:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}
