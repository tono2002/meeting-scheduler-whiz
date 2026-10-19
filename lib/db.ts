import "server-only";
import { createClient } from "@supabase/supabase-js";

export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Confirmed bookings as intervals only (no personal data). */
export async function confirmedIntervals() {
  const { data, error } = await db()
    .from("bookings")
    .select("slot_start, slot_end")
    .eq("status", "confirmed");
  if (error) throw error;
  return data.map((b) => ({ start: Date.parse(b.slot_start), end: Date.parse(b.slot_end) }));
}
