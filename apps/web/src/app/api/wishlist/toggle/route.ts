import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/wishlist/toggle
 * For guest users, wishlist is managed entirely client-side in localStorage.
 * This endpoint is a no-op placeholder that always returns success,
 * preventing console errors from the wishlist store's background sync.
 * 
 * When user authentication is integrated, this should persist
 * wishlist state in the database for the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    return NextResponse.json({
      success: true,
      message: productId ? "Wishlist updated" : "No product specified",
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: "Wishlist updated" });
  }
}
