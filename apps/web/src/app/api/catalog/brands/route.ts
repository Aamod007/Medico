import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: brands });
  } catch (error: any) {
    console.error("Prisma error in /api/catalog/brands, falling back to Supabase REST API:", error?.message);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
      const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
      const res = await fetch(`${supabaseUrl}/rest/v1/Brand?isActive=eq.true&order=name.asc&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }
    } catch (fallbackError) {
      console.error("Supabase REST fallback failed:", fallbackError);
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
