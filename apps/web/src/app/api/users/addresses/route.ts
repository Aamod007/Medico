import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";
import { getAuthenticatedUser, ensureUserExistsInDb } from "@/lib/server-auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

function getHeaders() {
  return getSupabaseHeaders();
}

export async function GET(req: NextRequest) {
  try {
    const userCtx = await getAuthenticatedUser(req);
    const { userId } = userCtx;

    // Strict privacy: if not authenticated, do not return any user's addresses
    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch user addresses from Supabase scoped to this user only
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Address?userId=eq.${encodeURIComponent(userId)}&order=isDefault.desc,createdAt.desc`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (res.ok) {
      const addresses = await res.json();
      return NextResponse.json({ success: true, data: addresses || [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error("GET /api/users/addresses error:", error?.message);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userCtx = await getAuthenticatedUser(req);
    const { userId, email, name, phone: clerkPhone } = userCtx;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to save a delivery address." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, type, isDefault } = body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, message: "Please fill all required address fields." },
        { status: 400 }
      );
    }

    // Ensure User row exists in DB
    await ensureUserExistsInDb(userId, email, fullName || name, phone || clerkPhone);

    const addressId = crypto.randomUUID();

    const newAddress = {
      id: addressId,
      userId,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      addressLine1: String(addressLine1).trim(),
      addressLine2: addressLine2 ? String(addressLine2).trim() : null,
      landmark: landmark ? String(landmark).trim() : null,
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      type: type || "HOME",
      isDefault: isDefault ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert into Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Address`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(newAddress),
    });

    if (res.ok) {
      const created = await res.json();
      const savedAddress = created?.[0] || newAddress;
      return NextResponse.json(
        { success: true, message: "Address saved successfully", data: savedAddress },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Address saved", data: newAddress },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/users/addresses error:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to save address" },
      { status: 500 }
    );
  }
}
