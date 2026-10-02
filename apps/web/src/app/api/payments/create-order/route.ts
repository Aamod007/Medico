import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TiWDGQAMVvys6R";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

function getHeaders() {
  return getSupabaseHeaders();
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    // Fetch order from Supabase
    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/Order?id=eq.${orderId}&select=*`, {
      headers: getHeaders(),
      cache: "no-store",
    });

    if (!orderRes.ok) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const orders = await orderRes.json();
    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const order = orders[0];
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    let razorpayOrderId = `order_mock_${Date.now()}`;

    // Attempt real Razorpay order creation in test mode
    try {
      const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: order.orderNumber,
        }),
      });

      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        razorpayOrderId = rzpData.id;
      }
    } catch (rzpErr) {
      console.warn("Razorpay API fetch warning, falling back to test order ID:", rzpErr);
    }

    // Create payment entry in Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/Payment`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        orderId: order.id,
        razorpayOrderId,
        amount: order.totalAmount,
        currency: "INR",
        status: "CREATED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: RAZORPAY_KEY_ID,
      },
    });
  } catch (error: any) {
    console.error("POST /api/payments/create-order error:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
