import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    const now = new Date().toISOString();
    const res = await fetch(
      `${supabaseUrl}/rest/v1/Coupon?isActive=eq.true&startDate=lte.${now}&endDate=gte.${now}&order=discountValue.desc`,
      { headers, cache: "no-store" }
    );

    if (res.ok) {
      const coupons = await res.json();
      return NextResponse.json({ success: true, data: coupons });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error("Error in /api/coupons/active:", error?.message);
    return NextResponse.json({ success: true, data: [] });
  }
}
