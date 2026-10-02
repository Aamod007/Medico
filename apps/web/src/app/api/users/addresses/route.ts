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
    let { userId, email, name, phone: clerkPhone } = userCtx;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    if (!userId && body?.userId) {
      userId = String(body.userId).trim();
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to save a delivery address." },
        { status: 401 }
      );
    }

    const { fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, type, isDefault } = body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, message: "Please fill all required address fields." },
        { status: 400 }
      );
    }

    // Normalize phone number to standard 10 digits (strip non-digits and leading zeros/prefixes)
    const rawPhoneDigits = String(phone).replace(/\D/g, "");
    const cleanPhone = rawPhoneDigits.length >= 10 ? rawPhoneDigits.slice(-10) : rawPhoneDigits;

    // Ensure User row exists in DB
    await ensureUserExistsInDb(userId, email, fullName || name, cleanPhone || clerkPhone);

    const addressId = crypto.randomUUID();

    const newAddress = {
      id: addressId,
      userId,
      fullName: String(fullName).trim(),
      phone: cleanPhone || String(phone).trim(),
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

    // Maintain database invariant: one_default_address per user
    if (newAddress.isDefault) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/Address?userId=eq.${encodeURIComponent(userId)}&isDefault=eq.true`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ isDefault: false, updatedAt: new Date().toISOString() }),
        }
      );
    }

    // Insert into Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Address`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(newAddress),
    });

    if (res.ok) {
      let savedAddress = newAddress;
      try {
        const text = await res.text();
        if (text) {
          const created = JSON.parse(text);
          savedAddress = (Array.isArray(created) ? created[0] : created) || newAddress;
        }
      } catch {}
      return NextResponse.json(
        { success: true, message: "Address saved successfully", data: savedAddress },
        { status: 201 }
      );
    }

    const errText = await res.text();
    console.error("Address insertion failed:", errText);
    let detailMsg = "Could not save address to database.";
    try {
      const parsedErr = JSON.parse(errText);
      detailMsg = parsedErr.message || parsedErr.details || parsedErr.hint || detailMsg;
    } catch {}

    return NextResponse.json(
      { success: false, message: detailMsg },
      { status: res.status >= 400 && res.status < 600 ? res.status : 500 }
    );
  } catch (error: any) {
    console.error("POST /api/users/addresses error:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to save address" },
      { status: 500 }
    );
  }
}
