import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

function token() {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHmac("sha256", secret).update(`admin:${process.env.ADMIN_PASSWORD ?? ""}`).digest("hex");
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && safeEqual(pw, expected);
}

export async function setAdminCookie() {
  (await cookies()).set(ADMIN_COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function isAdmin() {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!value && !!process.env.ADMIN_PASSWORD && safeEqual(value, token());
}
