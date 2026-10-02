import { NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { url: supabaseUrl } = getSupabaseConfig();
    
    const res = await fetch(
      `${supabaseUrl}/rest/v1/Brand?isActive=eq.true&order=name.asc&select=*`,
      {
        headers: getSupabaseHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase returned status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in /api/catalog/brands:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
