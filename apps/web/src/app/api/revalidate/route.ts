import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  const expectedSecret = process.env.REVALIDATE_SECRET || "pharmacy_revalidate_secret_super_secure_token_2026";

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ success: false, message: "Invalid revalidation secret header" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tags = [], paths = [] } = body;

    for (const tag of tags) {
      revalidateTag(tag);
    }

    for (const p of paths) {
      revalidatePath(p);
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      tags,
      paths,
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
