import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cartSessionId")?.value;

    if (!sessionId) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          itemCount: 0,
          subtotal: 0,
          mrpTotal: 0,
          discount: 0,
          deliveryFee: 0,
          totalAmount: 0,
        },
      });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Cart?sessionId=eq.${sessionId}&select=id,items:CartItem(id,quantity,variant:ProductVariant(id,sku,name,packSize,price,mrp,product:Product(name,slug,images)))`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          itemCount: 0,
          subtotal: 0,
          mrpTotal: 0,
          discount: 0,
          deliveryFee: 0,
          totalAmount: 0,
        },
      });
    }

    const carts = await res.json();
    const cart = carts?.[0];
    const rawItems = cart?.items || [];

    const items = rawItems.map((it: any) => ({
      id: it.id,
      variantId: it.variant?.id,
      quantity: it.quantity,
      productName: it.variant?.product?.name || it.variant?.name || "Healthcare Essential",
      name: it.variant?.product?.name || it.variant?.name || "Healthcare Essential",
      productSlug: it.variant?.product?.slug || "",
      image: it.variant?.product?.images?.[0] || "",
      packSize: it.variant?.packSize || "Standard Pack",
      price: Number(it.variant?.price || 0),
      mrp: Number(it.variant?.mrp || it.variant?.price || 0),
      subtotal: Number(it.variant?.price || 0) * it.quantity,
      itemSubtotal: Number(it.variant?.price || 0) * it.quantity,
    }));

    const itemCount = items.reduce((acc: number, it: any) => acc + it.quantity, 0);
    const subtotal = items.reduce((acc: number, it: any) => acc + it.subtotal, 0);
    const mrpTotal = items.reduce((acc: number, it: any) => acc + it.mrp * it.quantity, 0);
    const discount = Math.max(0, mrpTotal - subtotal);
    const deliveryFee = subtotal >= 500 || items.length === 0 ? 0 : 40;
    const totalAmount = subtotal + deliveryFee;

    return NextResponse.json({
      success: true,
      data: {
        id: cart?.id || "guest",
        items,
        itemCount,
        subtotal,
        mrpTotal,
        discount,
        deliveryFee,
        totalAmount,
      },
    });
  } catch (error: any) {
    console.error("Cart GET error:", error?.message);
    return NextResponse.json({
      success: true,
      data: {
        items: [],
        itemCount: 0,
        subtotal: 0,
        mrpTotal: 0,
        discount: 0,
        deliveryFee: 0,
        totalAmount: 0,
      },
    });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cartSessionId")?.value;

    if (sessionId) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Cart?sessionId=eq.${sessionId}`, {
        headers: getHeaders(),
      });
      const carts = await res.json();
      if (carts?.[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/CartItem?cartId=eq.${carts[0].id}`, {
          method: "DELETE",
          headers: getHeaders(),
        });
      }
    }

    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (err: any) {
    return NextResponse.json({ success: true, message: "Cart cleared" });
  }
}
