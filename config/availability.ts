// Edit this file to change days, hours or blocks. Times are Europe/Madrid local time.

export const TIMEZONE = "Europe/Madrid";

/** Length of every meeting, in minutes. */
export const MEETING_MINUTES = 90;

/** Possible start times: every STEP minutes from FIRST_START to LAST_START (inclusive). */
export const STEP_MINUTES = 30;
export const FIRST_START = "09:00";
export const LAST_START = "20:00";

/** Start times closer than this to "now" are hidden. */
export const MIN_NOTICE_MINUTES = 120;

/** Days you can be booked (YYYY-MM-DD). */
export const DAYS = ["2026-10-20", "2026-10-21", "2026-10-22"];

/** Times when we are busy: [from, to) on that date. A meeting may not overlap them. */
export const BLOCKS: { date: string; from: string; to: string }[] = [
  { date: "2026-10-20", from: "12:00", to: "13:30" },
  { date: "2026-10-21", from: "17:00", to: "19:50" },
];
