import { checkPassword, setAdminCookie } from "@/lib/admin";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof password !== "string" || !checkPassword(password)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  await setAdminCookie();
  return Response.json({ ok: true });
}
