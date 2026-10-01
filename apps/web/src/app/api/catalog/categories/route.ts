import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Prisma error in /api/catalog/categories, falling back to Supabase REST API:", error?.message);

    // Fallback directly to Supabase REST API
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
      const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
      const res = await fetch(`${supabaseUrl}/rest/v1/Category?isActive=eq.true&order=sortOrder.asc&select=*`, {
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
      { success: false, message: error?.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
