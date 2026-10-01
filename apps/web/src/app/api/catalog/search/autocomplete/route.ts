import { NextRequest, NextResponse } from "next/server";

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    const [prodRes, catRes, brandRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/Product?or=(name.ilike.*${trimmed}*,composition.ilike.*${trimmed}*)&isActive=eq.true&deletedAt=is.null&select=id,name,slug,images,composition,prescriptionRequired,variants:ProductVariant(price,mrp)&limit=6`,
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
