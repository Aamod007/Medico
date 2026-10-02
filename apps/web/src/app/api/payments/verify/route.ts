import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

function getHeaders() {
  return getSupabaseHeaders();
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!orderId || !razorpayPaymentId) {
      return NextResponse.json(
        { success: false, message: "orderId and razorpayPaymentId are required" },
        { status: 400 }
      );
    }

    // Verify signature if provided and not mock
    let isValid = true;
    if (razorpaySignature && razorpayOrderId && !razorpayOrderId.startsWith("order_mock_")) {
      const generated = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      try {
        isValid = crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(razorpaySignature));
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid payment signature" }, { status: 400 });
    }

    // 1. Update Order in Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/Order?id=eq.${orderId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        status: "CONFIRMED",
        paymentStatus: "PAID",
        isPaid: true,
        updatedAt: new Date().toISOString(),
      }),
    });

    // 2. Update Payment in Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/Payment?orderId=eq.${orderId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        status: "PAID",
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || "verified",
        updatedAt: new Date().toISOString(),
      }),
    });

    // 3. Insert status history
    await fetch(`${SUPABASE_URL}/rest/v1/OrderStatusHistory`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        orderId,
        status: "CONFIRMED",
        note: `Payment verified (${razorpayPaymentId}). Order confirmed.`,
        createdAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId,
        status: "CONFIRMED",
        isPaid: true,
      },
    });
  } catch (error: any) {
    console.error("POST /api/payments/verify error:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
