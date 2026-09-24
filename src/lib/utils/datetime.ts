// Shared time/date helpers for the availability engine and its UI. Postgres
// `time` columns round-trip as "HH:MM:SS" strings; everything here works in
// minutes-since-midnight so the scheduling engine never does string math.

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "";
}

/** "09:00" or "09:00:00" -> 540 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 540 -> "09:00" */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "09:00:00" -> "9:00 AM" */
export function formatTime(time: string): string {
  const totalMinutes = timeToMinutes(time);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/** JS Date.getDay() convention: 0 = Sunday ... 6 = Saturday. */
export function dayOfWeekForDate(date: string): DayOfWeek {
  return new Date(`${date}T00:00:00`).getDay() as DayOfWeek;
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "YYYY-MM-DD" +/- N days, in UTC calendar terms (no timezone conversion). */
export function shiftDate(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

/** A timestamptz ISO string's calendar date as observed in `timeZone`. */
export function dateStringInTimezone(isoTimestamp: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoTimestamp));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Today's calendar date ("YYYY-MM-DD") as observed in `timeZone`. */
export function todayInTimezone(timeZone: string): string {
  return dateStringInTimezone(new Date().toISOString(), timeZone);
}

/** A timestamptz ISO string's minutes-since-midnight as observed in `timeZone`. */
export function minutesOfDayInTimezone(isoTimestamp: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoTimestamp));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return get("hour") * 60 + get("minute");
}

/** The DST-aware UTC offset (in minutes) `timeZone` observes at `date`. */
function utcOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - date.getTime()) / 60_000;
}

/**
 * Converts a "YYYY-MM-DD" + "HH:MM" wall-clock time in `timeZone` to a UTC
 * ISO timestamp, for writing to timestamptz columns (CLAUDE.md §16: never
 * store ambiguous local timestamps).
 */
export function localDateTimeToUtcIso(date: string, time: string, timeZone: string): string {
  const naiveUtc = new Date(`${date}T${time}:00Z`);
  const offset = utcOffsetMinutes(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offset * 60_000).toISOString();
}
