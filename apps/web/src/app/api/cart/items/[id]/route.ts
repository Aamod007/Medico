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
