import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { addMinutes, isBookableNow, isValidStart, meetingInterval } from "@/lib/slots";
import { MEETING_MINUTES } from "@/config/availability";

const err = (error: string, status: number) => Response.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return err("invalid", 400);
  const { date, time, name, phone, website } = body as Record<string, unknown>;

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (typeof website === "string" && website.trim() !== "") return Response.json({ ok: true });

  if (typeof date !== "string" || typeof time !== "string") return err("invalid", 400);
  const cleanName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  if (cleanName.length < 1 || cleanName.length > 80) return err("name", 400);
  const cleanPhone = typeof phone === "string" ? normalizePhone(phone) : null;
  if (!cleanPhone) return err("phone", 400);

  if (!isValidStart(date, time)) return err("taken", 409);
  if (!isBookableNow(date, time, Date.now())) return err("taken", 409);

  const iv = meetingInterval(date, time);
  const { error } = await db().from("bookings").insert({
    slot_start: new Date(iv.start).toISOString(),
    slot_end: new Date(iv.end).toISOString(),
    name: cleanName,
    phone: cleanPhone,
    status: "confirmed",
  });

  if (error) {
    if (error.code === "23P01") return err("taken", 409); // exclusion constraint: overlap
    if (error.code === "23505") return err("phone_has_booking", 409); // one active per phone
    console.error(error);
    return err("server", 500);
  }
  return Response.json({ ok: true, date, time, end: addMinutes(time, MEETING_MINUTES) });
}
