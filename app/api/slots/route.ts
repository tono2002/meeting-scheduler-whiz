import { connection } from "next/server";
import { confirmedIntervals } from "@/lib/db";
import { buildAvailability } from "@/lib/slots";

export async function GET() {
  await connection();
  const days = buildAvailability(await confirmedIntervals(), Date.now());
  return Response.json({ days }, { headers: { "Cache-Control": "no-store" } });
}
