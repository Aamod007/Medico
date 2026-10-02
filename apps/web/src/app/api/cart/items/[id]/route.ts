import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

function getHeaders() {
  return getSupabaseHeaders();
}

export async function PATCH(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const rawParams = context?.params ? await context.params : {};
    const id = rawParams?.id || req.nextUrl.pathname.split("/").pop();
    const { quantity } = await req.json();

    if (quantity <= 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/CartItem?id=eq.${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/CartItem?id=eq.${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ quantity }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const rawParams = context?.params ? await context.params : {};
    const id = rawParams?.id || req.nextUrl.pathname.split("/").pop();

    await fetch(`${SUPABASE_URL}/rest/v1/CartItem?id=eq.${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    return NextResponse.json({ success: true, message: "Item removed" });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: "Item removed" });
  }
}
