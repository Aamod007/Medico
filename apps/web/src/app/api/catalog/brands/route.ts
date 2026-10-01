import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

    const res = await fetch(
      `${supabaseUrl}/rest/v1/Brand?isActive=eq.true&order=name.asc&select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
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
