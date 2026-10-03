import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";
import { getAuthenticatedUser, ensureUserExistsInDb } from "@/lib/server-auth";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { resolvePincode } from "@/lib/location";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

export async function GET(req: NextRequest) {
  try {
    const userCtx = await getAuthenticatedUser(req);
    const { userId } = userCtx;

    if (!userId) {
      return NextResponse.json({ success: true, data: null });
    }

    // 1. Try Clerk user metadata
    try {
      const user = await currentUser();
      const deliveryPincode = (user?.unsafeMetadata?.deliveryPincode || user?.unsafeMetadata?.pincode) as string | undefined;
      const deliveryCity = (user?.unsafeMetadata?.deliveryCity || user?.unsafeMetadata?.city) as string | undefined;

      if (deliveryPincode && deliveryCity) {
        return NextResponse.json({
          success: true,
          data: {
            pincode: String(deliveryPincode).trim(),
            city: String(deliveryCity).trim(),
          },
        });
      }
    } catch (err: any) {
      console.warn("GET /api/users/location clerk check:", err?.message);
    }

    // 2. Fallback to user's saved default address in Supabase
    try {
      const headers = getSupabaseHeaders();
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/Address?userId=eq.${encodeURIComponent(userId)}&order=isDefault.desc,createdAt.desc&limit=1`,
        { headers, cache: "no-store" }
      );

      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].pincode && rows[0].city) {
          return NextResponse.json({
            success: true,
            data: {
              pincode: String(rows[0].pincode).trim(),
              city: String(rows[0].city).trim(),
            },
          });
        }
      }
    } catch (err: any) {
      console.warn("GET /api/users/location db check:", err?.message);
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("GET /api/users/location error:", error?.message);
    return NextResponse.json({ success: true, data: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userCtx = await getAuthenticatedUser(req);
    let { userId, email, name, phone } = userCtx;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const rawPin = String(body?.pincode || "").trim();
    let cityName = String(body?.city || "").trim();

    if (!rawPin || !/^\d{6}$/.test(rawPin)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 6-digit Indian PIN code." },
        { status: 400 }
      );
    }

    // If city name is missing, attempt to resolve via offline database
    if (!cityName) {
      const info = resolvePincode(rawPin);
      if (info.valid && info.city) {
        cityName = info.city;
      } else {
        cityName = "India";
      }
    }

    if (!userId && body?.userId) {
      userId = String(body.userId).trim();
    }

    // If user is authenticated, save directly to their account
    if (userId) {
      // 1. Update Clerk user metadata
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          unsafeMetadata: {
            deliveryPincode: rawPin,
            deliveryCity: cityName,
            pincode: rawPin,
            city: cityName,
          },
        });
      } catch (clerkErr: any) {
        console.warn("POST /api/users/location Clerk update warning:", clerkErr?.message);
      }

      // 2. Ensure User exists and sync with default address if available
      try {
        await ensureUserExistsInDb(userId, email, name, phone);
        const headers = getSupabaseHeaders();
        const checkRes = await fetch(
          `${SUPABASE_URL}/rest/v1/Address?userId=eq.${encodeURIComponent(userId)}&order=isDefault.desc&limit=1`,
          { headers, cache: "no-store" }
        );

        if (checkRes.ok) {
          const existing = await checkRes.json();
          if (existing && existing.length > 0) {
            await fetch(`${SUPABASE_URL}/rest/v1/Address?id=eq.${encodeURIComponent(existing[0].id)}`, {
              method: "PATCH",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({
                city: cityName,
                pincode: rawPin,
                updatedAt: new Date().toISOString(),
              }),
            });
          }
        }
      } catch (dbErr: any) {
        console.warn("POST /api/users/location DB sync warning:", dbErr?.message);
      }

      return NextResponse.json({
        success: true,
        message: "Delivery location saved to your account.",
        data: { pincode: rawPin, city: cityName },
      });
    }

    // Guest response (client handles localStorage caching)
    return NextResponse.json({
      success: true,
      message: "Delivery location set for this session.",
      data: { pincode: rawPin, city: cityName },
    });
  } catch (error: any) {
    console.error("POST /api/users/location error:", error?.message);
    return NextResponse.json(
      { success: false, message: "Failed to save delivery location." },
      { status: 500 }
    );
  }
}
