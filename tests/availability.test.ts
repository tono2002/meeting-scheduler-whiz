import { describe, expect, it } from "vitest";
import { buildAvailability, meetingInterval, isValidStart, epochToLocal } from "@/lib/slots";
import { normalizePhone } from "@/lib/phone";

// A "now" well before the days, so nothing is hidden.
const EARLY = Date.parse("2026-10-01T08:00:00Z");

const free = (date: string, bookings = [] as ReturnType<typeof meetingInterval>[], now = EARLY) =>
  buildAvailability(bookings, now)
    .find((d) => d.date === date)!
    .slots.filter((s) => s.free)
    .map((s) => s.time);

const every30 = (from: string, to: string) => {
  const out: string[] = [];
  for (let m = +from.slice(0, 2) * 60 + +from.slice(3); m <= +to.slice(0, 2) * 60 + +to.slice(3); m += 30)
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
};

describe("availability with no bookings", () => {
  it("Tue 20", () => {
    const expected = [...every30("09:00", "10:30"), ...every30("13:30", "20:00")];
    expect(free("2026-10-20")).toEqual(expected);
    expect(expected).toHaveLength(18);
  });
  it("Wed 21", () => {
    const expected = [...every30("09:00", "15:30"), "20:00"];
    expect(free("2026-10-21")).toEqual(expected);
    expect(expected).toHaveLength(15);
  });
  it("Thu 22", () => {
    expect(free("2026-10-22")).toEqual(every30("09:00", "20:00"));
    expect(free("2026-10-22")).toHaveLength(23);
  });
});

describe("bookings", () => {
  it("booking 12:00 on Thu blocks 11:00, 11:30, 12:30, 13:00 and keeps 10:30, 13:30", () => {
    const f = free("2026-10-22", [meetingInterval("2026-10-22", "12:00")]);
    for (const t of ["11:00", "11:30", "12:00", "12:30", "13:00"]) expect(f).not.toContain(t);
    expect(f).toContain("10:30");
    expect(f).toContain("13:30");
  });
});

describe("timezone and notice", () => {
  it("09:00 Madrid on Oct 20 2026 is 07:00 UTC (CEST)", () => {
    expect(new Date(meetingInterval("2026-10-20", "09:00").start).toISOString()).toBe("2026-10-20T07:00:00.000Z");
    expect(epochToLocal(Date.parse("2026-10-20T07:00:00Z"))).toEqual({ date: "2026-10-20", time: "09:00" });
  });
  it("hides starts less than 2 h from now and past days", () => {
    const now = Date.parse("2026-10-21T08:15:00Z"); // 10:15 Madrid, Wed
    const days = buildAvailability([], now);
    expect(days.map((d) => d.date)).toEqual(["2026-10-21", "2026-10-22"]);
    expect(days[0].slots[0].time).toBe("12:30");
  });
});

describe("server validation", () => {
  it("rejects starts off the grid, outside days, or overlapping a block", () => {
    expect(isValidStart("2026-10-22", "12:15")).toBe(false);
    expect(isValidStart("2026-10-23", "12:00")).toBe(false);
    expect(isValidStart("2026-10-20", "11:00")).toBe(false);
    expect(isValidStart("2026-10-21", "16:00")).toBe(false);
    expect(isValidStart("2026-10-20", "10:30")).toBe(true);
  });
  it("phones", () => {
    expect(normalizePhone("+34 612 345 678")).toBe("612345678");
    expect(normalizePhone("712345678")).toBe("712345678");
    expect(normalizePhone("912345678")).toBeNull();
    expect(normalizePhone("61234567")).toBeNull();
  });
});
