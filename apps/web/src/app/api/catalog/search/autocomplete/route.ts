import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: { products: [], categories: [], brands: [] },
      });
    }

    const trimmed = encodeURIComponent(query.trim());
    const { url: supabaseUrl } = getSupabaseConfig();
        const headers = getSupabaseHeaders();

    const [prodRes, catRes, brandRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/Product?or=(name.ilike.*${trimmed}*,composition.ilike.*${trimmed}*)&isActive=eq.true&deletedAt=is.null&select=id,name,slug,images,composition,variants:ProductVariant(price,mrp)&limit=6`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/Category?name=ilike.*${trimmed}*&isActive=eq.true&select=id,name,slug,image&limit=3`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/Brand?name=ilike.*${trimmed}*&isActive=eq.true&select=id,name,slug,logo&limit=3`,
        { headers, cache: "no-store" }
      ),
    ]);

    const [products, categories, brands] = await Promise.all([
      prodRes.ok ? prodRes.json() : [],
      catRes.ok ? catRes.json() : [],
      brandRes.ok ? brandRes.json() : [],
    ]);

    return NextResponse.json({
      success: true,
      data: { products, categories, brands },
    });
  } catch (error: any) {
    console.error("Error in /api/catalog/search/autocomplete:", error?.message);
    return NextResponse.json({
      success: true,
      data: { products: [], categories: [], brands: [] },
    });
  }
}
