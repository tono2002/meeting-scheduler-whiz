import {
  BLOCKS,
  DAYS,
  FIRST_START,
  LAST_START,
  MEETING_MINUTES,
  MIN_NOTICE_MINUTES,
  STEP_MINUTES,
  TIMEZONE,
} from "@/config/availability";

export type Interval = { start: number; end: number }; // epoch ms, [start, end)

export type PublicSlot = { time: string; end: string; free: boolean };
export type PublicDay = { date: string; slots: PublicSlot[] };

const MIN = 60_000;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Offset of TIMEZONE from UTC at a given instant, in minutes. */
function tzOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / MIN);
}

/** Local Madrid date + "HH:MM" to epoch ms. */
export function localToEpoch(date: string, hhmm: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  const naive = Date.UTC(y, mo - 1, d) + toMinutes(hhmm) * MIN;
  // Two passes handle the DST edge correctly.
  let ts = naive - tzOffsetMinutes(new Date(naive)) * MIN;
  ts = naive - tzOffsetMinutes(new Date(ts)) * MIN;
  return ts;
}

/** Epoch ms to Madrid { date: "YYYY-MM-DD", time: "HH:MM" }. */
export function epochToLocal(ts: number): { date: string; time: string } {
  const local = new Date(ts + tzOffsetMinutes(new Date(ts)) * MIN);
  return {
    date: local.toISOString().slice(0, 10),
    time: local.toISOString().slice(11, 16),
  };
}

export function addMinutes(hhmm: string, minutes: number) {
  return toHHMM(toMinutes(hhmm) + minutes);
}

/** All possible start times from the config, as "HH:MM". */
export function startTimes(): string[] {
  const out: string[] = [];
  for (let m = toMinutes(FIRST_START); m <= toMinutes(LAST_START); m += STEP_MINUTES) out.push(toHHMM(m));
  return out;
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export function meetingInterval(date: string, time: string): Interval {
  const start = localToEpoch(date, time);
  return { start, end: start + MEETING_MINUTES * MIN };
}

function blockIntervals(date: string): Interval[] {
  return BLOCKS.filter((b) => b.date === date).map((b) => ({
    start: localToEpoch(date, b.from),
    end: localToEpoch(date, b.to),
  }));
}

/** True if date+time is a configured start time that does not hit a block. Ignores bookings and "now". */
export function isValidStart(date: string, time: string): boolean {
  if (!DAYS.includes(date) || !startTimes().includes(time)) return false;
  const iv = meetingInterval(date, time);
  return !blockIntervals(date).some((b) => overlaps(iv, b));
}

/** True if the start is far enough in the future to be offered. */
export function isBookableNow(date: string, time: string, now: number): boolean {
  return localToEpoch(date, time) - now >= MIN_NOTICE_MINUTES * MIN;
}

/**
 * Public availability: per day, every start time that is not hidden by the notice window,
 * marked free unless it overlaps a block or a confirmed booking. Past days are omitted.
 */
export function buildAvailability(bookings: Interval[], now: number): PublicDay[] {
  const days: PublicDay[] = [];
  for (const date of DAYS) {
    const blocks = blockIntervals(date);
    const slots: PublicSlot[] = [];
    for (const time of startTimes()) {
      if (!isBookableNow(date, time, now)) continue;
      const iv = meetingInterval(date, time);
      const busy = blocks.some((b) => overlaps(iv, b)) || bookings.some((b) => overlaps(iv, b));
      slots.push({ time, end: addMinutes(time, MEETING_MINUTES), free: !busy });
    }
    if (slots.length) days.push({ date, slots });
  }
  return days;
}
