// Runs against a live deployment: TEST_URL=https://... ADMIN_PASSWORD=... npm run test:e2e
// Uses Thu 22 and cancels everything it creates.
import { afterAll, describe, expect, it } from "vitest";

const BASE = process.env.TEST_URL ?? "http://localhost:3000";
const DATE = "2026-10-22";
const NAME = "Prueba E2E";
let cookie = "";

const slots = async () => {
  const res = await fetch(`${BASE}/api/slots`);
  const text = await res.text();
  return { text, days: JSON.parse(text).days as { date: string; slots: { time: string; free: boolean }[] }[] };
};
const freeOn = async (date: string) =>
  (await slots()).days.find((d) => d.date === date)!.slots.filter((s) => s.free).map((s) => s.time);

const book = (time: string, phone: string) =>
  fetch(`${BASE}/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: DATE, time, name: NAME, phone, website: "" }),
  });

const admin = async (path: string, body?: unknown) =>
  fetch(`${BASE}/api/admin/${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", cookie },
    body: body ? JSON.stringify(body) : undefined,
  });

const testBookings = async () =>
  ((await (await admin("bookings")).json()).bookings as { id: string; name: string; time: string }[]).filter(
    (b) => b.name === NAME,
  );

afterAll(async () => {
  for (const b of await testBookings()) await admin("cancel", { id: b.id });
});

describe("live API", () => {
  it("admin login sets an httpOnly cookie", async () => {
    expect((await admin("bookings")).status).toBe(401);
    const res = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie")!;
    expect(setCookie.toLowerCase()).toContain("httponly");
    cookie = setCookie.split(";")[0];
  });

  it("booking 12:00 on Thu blocks 11:00–13:00 and keeps 10:30, 13:30", async () => {
    expect((await book("12:00", "699000001")).status).toBe(200);
    const f = await freeOn(DATE);
    for (const t of ["11:00", "11:30", "12:00", "12:30", "13:00"]) expect(f).not.toContain(t);
    expect(f).toContain("10:30");
    expect(f).toContain("13:30");
  });

  it("same phone cannot hold two active bookings", async () => {
    const res = await book("17:00", "699000001");
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("phone_has_booking");
  });

  it("rejects off-grid and blocked starts", async () => {
    expect((await book("12:15", "699000009")).status).toBe(409);
    const blocked = await fetch(`${BASE}/api/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-10-20", time: "12:00", name: NAME, phone: "699000009" }),
    });
    expect(blocked.status).toBe(409);
  });

  it("two parallel overlapping requests: only one succeeds", async () => {
    const [a, b] = await Promise.all([book("16:00", "699000002"), book("16:30", "699000003")]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
  });

  it("public responses contain no names or phones", async () => {
    const { text } = await slots();
    expect(text).not.toContain(NAME);
    expect(text).not.toMatch(/6990000\d\d/);
    expect(text).not.toMatch(/name|phone/i);
  });

  it("cancel in admin frees the times", async () => {
    const noon = (await testBookings()).find((b) => b.time === "12:00")!;
    expect((await admin("cancel", { id: noon.id })).status).toBe(200);
    const f = await freeOn(DATE);
    for (const t of ["11:00", "11:30", "12:00", "12:30", "13:00"]) expect(f).toContain(t);
  });
});
