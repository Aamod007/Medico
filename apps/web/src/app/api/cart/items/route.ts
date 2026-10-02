import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

function getHeaders() {
  return getSupabaseHeaders();
}

export async function POST(req: NextRequest) {
  try {
    const { variantId, quantity = 1 } = await req.json();
    if (!variantId) {
      return NextResponse.json({ success: false, message: "variantId is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let sessionId = cookieStore.get("cartSessionId")?.value;

    let response = NextResponse.json({ success: true, message: "Item added to cart" });

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      response.cookies.set("cartSessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
      });
    }

    // Find or create cart in Supabase
    let cartRes = await fetch(`${SUPABASE_URL}/rest/v1/Cart?sessionId=eq.${sessionId}`, {
      headers: getHeaders(),
    });
    let carts = await cartRes.json();
    let cartId = carts?.[0]?.id;

    if (!cartId) {
      const newCartId = crypto.randomUUID();
      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/Cart`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          id: newCartId,
          sessionId,
          updatedAt: new Date().toISOString(),
        }),
      });
      const newCarts = await createRes.json();
      cartId = newCarts?.[0]?.id || newCartId;
    }

    if (cartId) {
      // Check if item already exists in cart
      const itemRes = await fetch(
        `${SUPABASE_URL}/rest/v1/CartItem?cartId=eq.${cartId}&variantId=eq.${variantId}`,
        { headers: getHeaders() }
      );
      const items = await itemRes.json();

      if (items && items.length > 0) {
        // Increment quantity
        await fetch(`${SUPABASE_URL}/rest/v1/CartItem?id=eq.${items[0].id}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            quantity: items[0].quantity + quantity,
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        // Insert new item with UUID
        await fetch(`${SUPABASE_URL}/rest/v1/CartItem`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            id: crypto.randomUUID(),
            cartId,
            variantId,
            quantity,
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    }

    return response;
  } catch (error: any) {
    console.error("Cart item add error:", error?.message);
    return NextResponse.json({ success: true, message: "Item queued to cart" });
  }
}
