import { NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { url: supabaseUrl } = getSupabaseConfig();
        const headers = getSupabaseHeaders();

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
