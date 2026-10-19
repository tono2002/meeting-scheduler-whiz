import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (typeof id !== "string") return Response.json({ ok: false }, { status: 400 });
  const { error } = await db().from("bookings").update({ status: "cancelled" }).eq("id", id);
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
