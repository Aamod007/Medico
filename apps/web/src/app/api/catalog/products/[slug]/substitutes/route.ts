import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

function getHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;

    // 1. Fetch current product
    const productRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Product?slug=eq.${encodeURIComponent(slug)}&select=id,composition,categoryId&limit=1`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (!productRes.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const products = await productRes.json();
    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const current = products[0];

    // 2. Fetch substitutes matching composition or category
    let filter = `id=neq.${current.id}&isActive=eq.true`;
    if (current.composition) {
      filter += `&composition=eq.${encodeURIComponent(current.composition)}`;
    } else if (current.categoryId) {
      filter += `&categoryId=eq.${current.categoryId}`;
    }

    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Product?${filter}&select=id,name,slug,composition,manufacturer,images,category:Category(name),brand:Brand(name),variants:ProductVariant(id,sku,name,packSize,price,mrp,isDefault)&limit=6`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (subRes.ok) {
      const subs = await subRes.json();
      return NextResponse.json({ success: true, data: subs || [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error("GET /api/catalog/products/[slug]/substitutes error:", error?.message);
    return NextResponse.json({ success: true, data: [] });
  }
}
