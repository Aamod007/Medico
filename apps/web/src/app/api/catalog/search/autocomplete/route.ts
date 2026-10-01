import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: { products: [], categories: [], brands: [] },
      });
    }

    const trimmed = query.trim();

    const [products, categories, brands] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { composition: { contains: trimmed, mode: "insensitive" } },
          ],
          isActive: true,
          deletedAt: null,
        },
        take: 6,
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          composition: true,
          prescriptionRequired: true,
          variants: {
            where: { isDefault: true },
            select: { price: true, mrp: true },
            take: 1,
          },
        },
      }),
      prisma.category.findMany({
        where: { name: { contains: trimmed, mode: "insensitive" }, isActive: true },
        take: 3,
        select: { id: true, name: true, slug: true, image: true },
      }),
      prisma.brand.findMany({
        where: { name: { contains: trimmed, mode: "insensitive" }, isActive: true },
        take: 3,
        select: { id: true, name: true, slug: true, logo: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { products, categories, brands },
    });
  } catch (error: any) {
    console.error("Error in /api/catalog/search/autocomplete:", error?.message);
    return NextResponse.json({
      success: true,
      data: { products: [], categories: [], brands: [] },
    });
  }
}
