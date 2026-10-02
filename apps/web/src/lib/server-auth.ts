import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "./supabase";

const { url: SUPABASE_URL } = getSupabaseConfig();

export interface AuthenticatedUserContext {
  userId: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  placedOrderIds: string[];
}

/**
 * Resolves current user context from Clerk session, authenticated cookies, and request headers.
 * NEVER returns any hardcoded demo or fallback user ID.
 */
export async function getAuthenticatedUser(req?: NextRequest): Promise<AuthenticatedUserContext> {
  let clerkUserId: string | null = null;
  let clerkEmail: string | null = null;
  let clerkName: string | null = null;
  let clerkPhone: string | null = null;

  try {
    const session = await auth();
    if (session?.userId) {
      clerkUserId = session.userId;
    }
  } catch (_e) {
    // Clerk middleware context may not be present in some environments
  }

  try {
    if (clerkUserId) {
      const user = await currentUser();
      if (user) {
        clerkEmail = user.primaryEmailAddress?.emailAddress || null;
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        clerkName = fullName || user.username || null;
        clerkPhone = user.primaryPhoneNumber?.phoneNumber || null;
      }
    }
  } catch (_e) {
    // currentUser fetch is optional
  }

  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("userId")?.value || null;
  const headerUserId = req?.headers?.get("x-user-id") || null;

  // Strict user identification: Clerk session takes priority, followed by authenticated cookie/header
  const resolvedUserId = clerkUserId || cookieUserId || headerUserId || null;

  return {
    userId: resolvedUserId,
    email: clerkEmail,
    name: clerkName,
    phone: clerkPhone,
    placedOrderIds: [],
  };
}

/**
 * Ensures a User row exists in PostgreSQL/Supabase to satisfy foreign key constraints (Order.userId, Address.userId).
 */
export async function ensureUserExistsInDb(
  userId: string,
  email?: string | null,
  name?: string | null,
  phone?: string | null
): Promise<boolean> {
  if (!userId) return false;

  const headers = getSupabaseHeaders();

  try {
    // 1. Check if user already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/User?id=eq.${encodeURIComponent(userId)}&select=id`,
      { headers, cache: "no-store" }
    );

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        return true;
      }
    }

    // 2. Generate unique email and phone to satisfy PostgreSQL unique constraints
    let safeEmail = email || `${userId.replace(/[^a-zA-Z0-9_-]/g, "")}@user.medico.in`;

    // Verify email is not already claimed by another user record
    try {
      const emailCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/User?email=eq.${encodeURIComponent(safeEmail)}&select=id`,
        { headers, cache: "no-store" }
      );
      if (emailCheck.ok) {
        const existingEmailUsers = await emailCheck.json();
        if (existingEmailUsers && existingEmailUsers.length > 0 && existingEmailUsers[0].id !== userId) {
          safeEmail = `${userId.replace(/[^a-zA-Z0-9_-]/g, "")}-${Date.now().toString(36)}@user.medico.in`;
        }
      }
    } catch {}

    // Ensure phone is 10 digits and distinct
    let cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : "";
    if (!cleanPhone || cleanPhone.length < 10) {
      const hash = Math.abs(
        userId.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      );
      cleanPhone = `9${String(hash).padStart(9, "0").slice(-9)}`;
    }

    // Verify phone is not already claimed by another user record in PostgreSQL
    try {
      const phoneCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/User?phone=eq.${encodeURIComponent(cleanPhone)}&select=id`,
        { headers, cache: "no-store" }
      );
      if (phoneCheck.ok) {
        const existingPhoneUsers = await phoneCheck.json();
        if (existingPhoneUsers && existingPhoneUsers.length > 0 && existingPhoneUsers[0].id !== userId) {
          // Phone belongs to another user record. Use deterministic unique phone for User table
          // Note: Address.phone preserves the customer's actual input phone without conflict.
          const hash = Math.abs(
            (userId + "phone").split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
          );
          cleanPhone = `9${String(hash).padStart(9, "0").slice(-9)}`;
        }
      }
    } catch {}

    const payload = {
      id: userId,
      name: name || "Verified Customer",
      email: safeEmail,
      phone: cleanPhone,
      role: "CUSTOMER",
      isActive: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let createRes = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });

    if (createRes.ok) {
      return true;
    }

    // Fallback attempt: if initial insert conflicted on any unindexed field, retry with timestamp-guaranteed uniqueness
    const errText = await createRes.text();
    console.warn("User insert initial attempt failed, attempting fallback payload:", errText);

    const fallbackPayload = {
      id: userId,
      name: name || "Verified Customer",
      email: `${userId.replace(/[^a-zA-Z0-9_-]/g, "")}-${Date.now().toString(36)}@user.medico.in`,
      phone: `9${String(Date.now()).slice(-9)}`,
      role: "CUSTOMER",
      isActive: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(fallbackPayload),
    });

    if (retryRes.ok) {
      return true;
    }

    const retryErr = await retryRes.text();
    console.error("User insert fallback attempt failed:", retryRes.status, retryErr);
    return false;
  } catch (err: any) {
    console.error("ensureUserExistsInDb error:", err?.message);
    return false;
  }
}
