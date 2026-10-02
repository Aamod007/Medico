/**
 * Shared Supabase REST Configuration for Next.js Route Handlers.
 * Relies strictly on environment variables; zero hardcoded secrets.
 */

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY ||
    "";

  return { url, key };
}

export function getSupabaseHeaders(customHeaders: Record<string, string> = {}) {
  const { key } = getSupabaseConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...customHeaders,
  };
}
