import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_r00XNR7sSTTpzUEk6_R69Q_0sJo3-ag";

    const res = await fetch(
      `${supabaseUrl}/rest/v1/Category?isActive=eq.true&order=sortOrder.asc&select=*,products:Product(count)`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase returned status ${res.status}`);
    }

    const rawData = await res.json();
    const data = Array.isArray(rawData)
      ? rawData.map((cat: any) => ({
          ...cat,
          _count: {
            products: cat.products?.[0]?.count ?? 0,
          },
        }))
      : [];

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in /api/catalog/categories:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
