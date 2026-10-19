import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { epochToLocal } from "@/lib/slots";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const { data, error } = await db()
    .from("bookings")
    .select("id, slot_start, slot_end, name, phone")
    .eq("status", "confirmed")
    .order("slot_start");
  if (error) return Response.json({ ok: false }, { status: 500 });
  const bookings = data.map((b) => {
    const { date, time } = epochToLocal(Date.parse(b.slot_start));
    return { id: b.id, date, time, end: epochToLocal(Date.parse(b.slot_end)).time, name: b.name, phone: b.phone };
  });
  return Response.json({ ok: true, bookings }, { headers: { "Cache-Control": "no-store" } });
}
