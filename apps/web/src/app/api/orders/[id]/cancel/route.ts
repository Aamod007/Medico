import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
    Prefer: "return=representation",
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const { reason = "Customer request" } = await req.json().catch(() => ({}));

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const filter = isUuid ? `id=eq.${orderId}` : `orderNumber=eq.${orderId}`;

    // Update Order status
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/Order?${filter}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        status: "CANCELLED",
        cancelReason: reason,
        updatedAt: new Date().toISOString(),
      }),
    });

    if (updateRes.ok) {
      const updated = await updateRes.json();
      const actualOrderId = updated?.[0]?.id || orderId;

      // Add status history entry
      await fetch(`${SUPABASE_URL}/rest/v1/OrderStatusHistory`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          orderId: actualOrderId,
          status: "CANCELLED",
          note: `Order cancelled by customer: ${reason}`,
          createdAt: new Date().toISOString(),
        }),
      });

      return NextResponse.json({
        success: true,
        message: "Order cancelled successfully",
        data: updated?.[0] || { id: orderId, status: "CANCELLED" },
      });
    }

    return NextResponse.json({ success: false, message: "Could not cancel order" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/orders/[id]/cancel error:", error?.message);
    return NextResponse.json({ success: false, message: "Failed to cancel order" }, { status: 500 });
  }
}
