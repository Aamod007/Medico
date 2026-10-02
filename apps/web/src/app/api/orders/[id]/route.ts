import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

function getHeaders() {
  return getSupabaseHeaders();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    // Try finding by UUID id or orderNumber
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const filter = isUuid ? `id=eq.${orderId}` : `orderNumber=eq.${orderId}`;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?${filter}&select=*,items:OrderItem(*),address:Address(*),statusHistory:OrderStatusHistory(*)`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (res.ok) {
      const orders = await res.json();
      if (orders && orders.length > 0) {
        const order = orders[0];
        // Sort status history chronologically
        if (order.statusHistory && Array.isArray(order.statusHistory)) {
          order.statusHistory.sort(
            (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        return NextResponse.json({ success: true, data: order });
      }
    }

    return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error?.message);
    return NextResponse.json({ success: false, message: "Failed to fetch order details" }, { status: 500 });
  }
}
