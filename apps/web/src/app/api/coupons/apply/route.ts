import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_r00XNR7sSTTpzUEk6_R69Q_0sJo3-ag";

function getHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { code, cartSubtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, message: "Coupon code is required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Fetch the coupon by code
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Coupon?code=eq.${encodeURIComponent(code.toUpperCase())}&isActive=eq.true&startDate=lte.${now}&endDate=gte.${now}&limit=1`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Unable to validate coupon. Please try again." });
    }

    const coupons = await res.json();
    if (!coupons || coupons.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid or expired coupon code" });
    }

    const coupon = coupons[0];
    const minOrder = Number(coupon.minOrderValue || 0);
    const orderSubtotal = Number(cartSubtotal || 0);

    if (orderSubtotal < minOrder) {
      return NextResponse.json({
        success: false,
        message: `Minimum order of ₹${minOrder} required for this coupon`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (orderSubtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
    } else {
      // FLAT
      discountAmount = Number(coupon.discountValue);
    }

    discountAmount = Math.min(discountAmount, orderSubtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountAmount,
        discountType: coupon.discountType,
      },
    });
  } catch (error: any) {
    console.error("Coupon apply error:", error?.message);
    return NextResponse.json({ success: false, message: "Failed to apply coupon. Please try again." });
  }
}
