import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { discountValue: "desc" },
    });

    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    console.error("Error in /api/coupons/active:", error?.message);
    return NextResponse.json({ success: true, data: [] });
  }
}
