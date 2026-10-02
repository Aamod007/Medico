import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

function getHeaders() {
  return getSupabaseHeaders();
}

/**
 * GET /api/wishlist?ids=id1,id2,id3
 * Returns product details for the given product IDs (used by wishlist page to display items).
 * Wishlist IDs are stored client-side in localStorage; this just fetches product data.
 */
export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ success: true, data: [] });
    }

    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch products by IDs with their default variant
    const idFilter = ids.map(id => `"${id}"`).join(",");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Product?id=in.(${idFilter})&select=id,name,slug,images,composition,brand:Brand(name),category:Category(name),variants:ProductVariant(id,name,packSize,price,mrp,sku)&isActive=eq.true`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const products = await res.json();

    // Transform to match what the wishlist page expects
    const data = products.map((p: any) => {
      const defVariant = p.variants?.[0];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        images: p.images || [],
        composition: p.composition,
        brand: p.brand,
        category: p.category,
        defaultVariant: defVariant ? {
          id: defVariant.id,
          name: defVariant.name,
          packSize: defVariant.packSize,
          price: Number(defVariant.price),
          mrp: Number(defVariant.mrp || defVariant.price),
          sku: defVariant.sku,
        } : null,
        variants: p.variants?.map((v: any) => ({
          id: v.id,
          name: v.name,
          packSize: v.packSize,
          price: Number(v.price),
          mrp: Number(v.mrp || v.price),
          sku: v.sku,
        })) || [],
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Wishlist GET error:", error?.message);
    return NextResponse.json({ success: true, data: [] });
  }
}
