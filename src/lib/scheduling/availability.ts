import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import {
  dateStringInTimezone,
  dayOfWeekForDate,
  minutesOfDayInTimezone,
  minutesToTime,
  shiftDate,
  timeToMinutes,
} from "@/lib/utils/datetime";

/** Minutes-since-midnight range. Half-open: [start, end). */
export type TimeWindow = { start: number; end: number };

type RuleInput = Pick<
  Database["public"]["Tables"]["availability_rules"]["Row"],
  "day_of_week" | "start_time" | "end_time" | "active"
>;
type ExceptionInput = Pick<
  Database["public"]["Tables"]["availability_exceptions"]["Row"],
  "date" | "start_time" | "end_time" | "type"
>;
type BookingInput = Pick<Database["public"]["Tables"]["showings"]["Row"], "start_time" | "end_time">;

export type AvailabilityInputs = {
  /** "YYYY-MM-DD", interpreted in `timeZone`. */
  date: string;
  timeZone: string;
  rules: RuleInput[];
  exceptions: ExceptionInput[];
  bookings: BookingInput[];
};

const FULL_DAY: TimeWindow = { start: 0, end: 24 * 60 };

/**
 * The single source of truth for "is this agent available for this time
 * range?" (CLAUDE.md §30). Combines recurring availability, one-time /
 * unavailable exceptions (which take priority over recurring rules per
 * CLAUDE.md §7), and existing non-cancelled bookings, for one calendar date.
 * Every consumer — agent calendar, availability CRUD preview, and later the
 * receptionist search and booking form — must call this rather than
 * reimplementing the logic.
 */
export function computeAvailableWindows({ date, timeZone, rules, exceptions, bookings }: AvailabilityInputs): TimeWindow[] {
  const dow = dayOfWeekForDate(date);

  let windows: TimeWindow[] = rules
    .filter((rule) => rule.active && rule.day_of_week === dow)
    .map((rule) => ({ start: timeToMinutes(rule.start_time), end: timeToMinutes(rule.end_time) }));

  const dateExceptions = exceptions.filter((exception) => exception.date === date);
  const exceptionWindow = (exception: ExceptionInput): TimeWindow =>
    exception.start_time && exception.end_time
      ? { start: timeToMinutes(exception.start_time), end: timeToMinutes(exception.end_time) }
      : FULL_DAY;

  for (const exception of dateExceptions.filter((e) => e.type === "available")) {
    windows = mergeWindows([...windows, exceptionWindow(exception)]);
  }

  for (const exception of dateExceptions.filter((e) => e.type === "unavailable")) {
    windows = subtractWindow(windows, exceptionWindow(exception));
  }

  for (const booking of bookings) {
    const window = bookingWindowForDate(booking, date, timeZone);
    if (window) {
      windows = subtractWindow(windows, window);
    }
  }

  return windows;
}

function bookingWindowForDate(booking: BookingInput, date: string, timeZone: string): TimeWindow | null {
  const startDate = dateStringInTimezone(booking.start_time, timeZone);
  const endDate = dateStringInTimezone(booking.end_time, timeZone);

  if (startDate > date || endDate < date) {
    return null;
  }

  return {
    start: startDate === date ? minutesOfDayInTimezone(booking.start_time, timeZone) : 0,
    end: endDate === date ? minutesOfDayInTimezone(booking.end_time, timeZone) : 24 * 60,
  };
}

function mergeWindows(windows: TimeWindow[]): TimeWindow[] {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const merged: TimeWindow[] = [];

  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (last && window.start <= last.end) {
      last.end = Math.max(last.end, window.end);
    } else {
      merged.push({ ...window });
    }
  }

  return merged;
}

function subtractWindow(windows: TimeWindow[], toRemove: TimeWindow): TimeWindow[] {
  const result: TimeWindow[] = [];

  for (const window of windows) {
    if (toRemove.end <= window.start || toRemove.start >= window.end) {
      result.push(window);
      continue;
    }
    if (toRemove.start > window.start) {
      result.push({ start: window.start, end: Math.min(toRemove.start, window.end) });
    }
    if (toRemove.end < window.end) {
      result.push({ start: Math.max(toRemove.end, window.start), end: window.end });
    }
  }

  return result.filter((window) => window.end > window.start);
}

/**
 * Fetches an agent's rules/exceptions/nearby bookings for one date and
 * computes their available windows. Returns an empty list for an inactive
 * agent (CLAUDE.md §8: "the agent is active" is a hard booking requirement).
 */
export async function getAgentAvailableWindows(
  supabase: SupabaseClient<Database>,
  agentId: string,
  date: string,
  timeZone: string = DEFAULT_TIMEZONE,
  /** Exclude this showing from the booking conflicts (rescheduling it against its own current slot). */
  excludeShowingId?: string,
): Promise<TimeWindow[]> {
  const dayOfWeek = dayOfWeekForDate(date);

  let bookingsQuery = supabase
    .from("showings")
    .select("start_time, end_time")
    .eq("agent_id", agentId)
    .neq("status", "cancelled")
    // Overfetch by a day on each side (safe superset for any timezone offset)
    // so bookingWindowForDate can precisely clamp per-timezone below.
    .gte("start_time", `${shiftDate(date, -1)}T00:00:00Z`)
    .lte("start_time", `${shiftDate(date, 1)}T23:59:59Z`);

  if (excludeShowingId) {
    bookingsQuery = bookingsQuery.neq("id", excludeShowingId);
  }

  const [{ data: agent }, { data: rules }, { data: exceptions }, { data: bookings }] = await Promise.all([
    supabase.from("agents").select("active").eq("id", agentId).maybeSingle(),
    supabase
      .from("availability_rules")
      .select("day_of_week, start_time, end_time, active")
      .eq("agent_id", agentId)
      .eq("day_of_week", dayOfWeek)
      .eq("active", true),
    supabase
      .from("availability_exceptions")
      .select("date, start_time, end_time, type")
      .eq("agent_id", agentId)
      .eq("date", date),
    bookingsQuery,
  ]);

  if (!agent?.active) {
    return [];
  }

  return computeAvailableWindows({
    date,
    timeZone,
    rules: rules ?? [],
    exceptions: exceptions ?? [],
    bookings: bookings ?? [],
  });
}

/** Is the agent available for the full requested range on one calendar date? */
export async function isAgentAvailableForRange(
  supabase: SupabaseClient<Database>,
  agentId: string,
  startIso: string,
  endIso: string,
  timeZone: string = DEFAULT_TIMEZONE,
  excludeShowingId?: string,
): Promise<boolean> {
  const date = dateStringInTimezone(startIso, timeZone);
  const windows = await getAgentAvailableWindows(supabase, agentId, date, timeZone, excludeShowingId);
  const startMinutes = minutesOfDayInTimezone(startIso, timeZone);
  const endMinutes = minutesOfDayInTimezone(endIso, timeZone);

  return windows.some((window) => startMinutes >= window.start && endMinutes <= window.end);
}

type AgentContext = {
  id: string;
  name: string;
  rules: RuleInput[];
  exceptions: ExceptionInput[];
  bookings: BookingInput[];
};

/**
 * Bulk-fetches every active agent plus their rules/exceptions/nearby
 * bookings for one date in a handful of queries (not one round-trip per
 * agent — CLAUDE.md §26), for the receptionist search screens. Wrapped in
 * cache() since searchAgentAvailability and findNextAvailableSlots are
 * sometimes both called for the same date within one request.
 */
const fetchActiveAgentContexts = cache(async (
  supabase: SupabaseClient<Database>,
  date: string,
): Promise<AgentContext[]> => {
  const dayOfWeek = dayOfWeekForDate(date);

  const [{ data: agents }, { data: rules }, { data: exceptions }, { data: bookings }] = await Promise.all([
    supabase.from("agents").select("id, name").eq("active", true).order("name"),
    supabase
      .from("availability_rules")
      .select("agent_id, day_of_week, start_time, end_time, active")
      .eq("day_of_week", dayOfWeek)
      .eq("active", true),
    supabase.from("availability_exceptions").select("agent_id, date, start_time, end_time, type").eq("date", date),
    supabase
      .from("showings")
      .select("agent_id, start_time, end_time")
      .neq("status", "cancelled")
      .gte("start_time", `${shiftDate(date, -1)}T00:00:00Z`)
      .lte("start_time", `${shiftDate(date, 1)}T23:59:59Z`),
  ]);

  return (agents ?? []).map((agent) => ({
    id: agent.id,
    name: agent.name,
    rules: (rules ?? []).filter((rule) => rule.agent_id === agent.id),
    exceptions: (exceptions ?? []).filter((exception) => exception.agent_id === agent.id),
    bookings: (bookings ?? []).filter((booking) => booking.agent_id === agent.id),
  }));
});

export type AgentAvailabilityStatus = "available" | "busy" | "unavailable";

export type AgentSearchResult = {
  agentId: string;
  name: string;
  status: AgentAvailabilityStatus;
};

/**
 * The receptionist's core question (CLAUDE.md §1/§10): for every active
 * agent, is this exact time range available? "busy" (has a schedule for
 * this slot but a conflicting booking) is distinguished from "unavailable"
 * (doesn't work this slot at all) so the UI can match the CLAUDE.md §10
 * example (Sarah/John — Available, Mike — Busy, David — Unavailable).
 */
export async function searchAgentAvailability(
  supabase: SupabaseClient<Database>,
  params: { date: string; startTime: string; endTime: string; timeZone?: string },
): Promise<AgentSearchResult[]> {
  const timeZone = params.timeZone ?? DEFAULT_TIMEZONE;
  const requestedStart = timeToMinutes(params.startTime);
  const requestedEnd = timeToMinutes(params.endTime);
  const agents = await fetchActiveAgentContexts(supabase, params.date);

  return agents.map((agent) => {
    const scheduledWindows = computeAvailableWindows({
      date: params.date,
      timeZone,
      rules: agent.rules,
      exceptions: agent.exceptions,
      bookings: [],
    });
    const actualWindows = computeAvailableWindows({
      date: params.date,
      timeZone,
      rules: agent.rules,
      exceptions: agent.exceptions,
      bookings: agent.bookings,
    });

    const fits = (windows: TimeWindow[]) =>
      windows.some((window) => requestedStart >= window.start && requestedEnd <= window.end);

    const status: AgentAvailabilityStatus = fits(actualWindows) ? "available" : fits(scheduledWindows) ? "busy" : "unavailable";

    return { agentId: agent.id, name: agent.name, status };
  });
}

export type NextAvailableSlot = {
  agentId: string;
  name: string;
  time: string;
};

/**
 * "Find Next Available Agent" (CLAUDE.md §11): the next bookable slots
 * across all active agents on one date, at or after `afterTime`, sorted
 * chronologically. Slots are offered on a 30-minute grid.
 */
export async function findNextAvailableSlots(
  supabase: SupabaseClient<Database>,
  params: { date: string; afterTime: string; durationMinutes: number; timeZone?: string; limit?: number },
): Promise<NextAvailableSlot[]> {
  const timeZone = params.timeZone ?? DEFAULT_TIMEZONE;
  const limit = params.limit ?? 6;
  const SLOT_STEP_MINUTES = 30;
  const afterMinutes = timeToMinutes(params.afterTime);
  const agents = await fetchActiveAgentContexts(supabase, params.date);

  const slots: NextAvailableSlot[] = [];

  for (const agent of agents) {
    const windows = computeAvailableWindows({
      date: params.date,
      timeZone,
      rules: agent.rules,
      exceptions: agent.exceptions,
      bookings: agent.bookings,
    });

    for (const window of windows) {
      const firstSlot = Math.max(window.start, Math.ceil(afterMinutes / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES);
      for (let start = firstSlot; start + params.durationMinutes <= window.end; start += SLOT_STEP_MINUTES) {
        slots.push({ agentId: agent.id, name: agent.name, time: minutesToTime(start) });
      }
    }
  }

  slots.sort((a, b) => (a.time === b.time ? a.name.localeCompare(b.name) : a.time.localeCompare(b.time)));
  return slots.slice(0, limit);
}
