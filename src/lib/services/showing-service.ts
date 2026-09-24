import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { isAgentAvailableForRange } from "@/lib/scheduling/availability";
import { emitEvent } from "@/lib/integrations/events";
import type { ServiceResult } from "./availability-service";

type Showing = Database["public"]["Tables"]["showings"]["Row"];

const GENERIC_ERROR = "Something went wrong. Please try again.";
const CONFLICT_ERROR = "This agent is no longer available for this time. Please choose another agent or time.";
const PAST_TIME_ERROR = "That time has already passed. Please choose a time in the future.";
// Postgres exclusion_violation — the last-resort safety net when two
// requests race past the availability check above (CLAUDE.md §9).
const EXCLUSION_VIOLATION_CODE = "23P01";

export type ShowingWithDetails = Showing & {
  agent: { id: string; name: string } | null;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    property_name: string | null;
  } | null;
  prospect: { id: string; name: string; phone: string | null; email: string | null } | null;
};

const SHOWING_WITH_DETAILS_SELECT =
  "*, agent:agents(id, name), property:properties(id, address, city, state, zip, property_name), prospect:prospects(id, name, phone, email)";

/**
 * Creates a prospect + showing together. Re-validates the agent's full
 * availability (recurring rules, exceptions, active status, existing
 * bookings — CLAUDE.md §8) right before inserting, then relies on the
 * database's exclusion constraint (migration 0008) as the final backstop
 * against a race between two simultaneous booking requests (CLAUDE.md §9).
 */
export async function createShowing(
  supabase: SupabaseClient<Database>,
  input: {
    agentId: string;
    propertyId: string;
    startIso: string;
    endIso: string;
    prospect: { name: string; phone: string | null; email: string | null };
    notes: string | null;
  },
): Promise<ServiceResult<{ showingId: string }>> {
  if (new Date(input.startIso).getTime() < Date.now()) {
    return { data: null, error: PAST_TIME_ERROR };
  }

  const available = await isAgentAvailableForRange(supabase, input.agentId, input.startIso, input.endIso);
  if (!available) {
    return { data: null, error: CONFLICT_ERROR };
  }

  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .insert({ name: input.prospect.name, phone: input.prospect.phone, email: input.prospect.email })
    .select("id")
    .single();

  if (prospectError || !prospect) {
    return { data: null, error: GENERIC_ERROR };
  }

  const { data: showing, error: showingError } = await supabase
    .from("showings")
    .insert({
      agent_id: input.agentId,
      property_id: input.propertyId,
      prospect_id: prospect.id,
      start_time: input.startIso,
      end_time: input.endIso,
      status: "scheduled",
      notes: input.notes,
    })
    .select("id")
    .single();

  if (showingError || !showing) {
    return { data: null, error: showingError?.code === EXCLUSION_VIOLATION_CODE ? CONFLICT_ERROR : GENERIC_ERROR };
  }

  emitEvent({
    event: "showing.created",
    showing_id: showing.id,
    agent_id: input.agentId,
    property_id: input.propertyId,
    prospect_id: prospect.id,
    start_time: input.startIso,
    end_time: input.endIso,
  });

  return { data: { showingId: showing.id }, error: null };
}

export async function cancelShowing(supabase: SupabaseClient<Database>, showingId: string): Promise<ServiceResult> {
  const { data: showing } = await supabase
    .from("showings")
    .select("id, agent_id, property_id, prospect_id, start_time, end_time")
    .eq("id", showingId)
    .maybeSingle();

  if (!showing) {
    return { data: null, error: GENERIC_ERROR };
  }

  const { error } = await supabase.from("showings").update({ status: "cancelled" }).eq("id", showingId);

  if (error) {
    return { data: null, error: GENERIC_ERROR };
  }

  emitEvent({
    event: "showing.cancelled",
    showing_id: showing.id,
    agent_id: showing.agent_id,
    property_id: showing.property_id,
    prospect_id: showing.prospect_id,
    start_time: showing.start_time,
    end_time: showing.end_time,
  });

  return { data: undefined, error: null };
}

/**
 * Moves an existing showing to a new time, re-checking the agent's
 * availability against everything except the showing's own current slot.
 */
export async function rescheduleShowing(
  supabase: SupabaseClient<Database>,
  showingId: string,
  input: { startIso: string; endIso: string },
): Promise<ServiceResult> {
  const { data: showing } = await supabase
    .from("showings")
    .select("id, agent_id, property_id, prospect_id")
    .eq("id", showingId)
    .maybeSingle();

  if (!showing) {
    return { data: null, error: GENERIC_ERROR };
  }

  if (new Date(input.startIso).getTime() < Date.now()) {
    return { data: null, error: PAST_TIME_ERROR };
  }

  const available = await isAgentAvailableForRange(
    supabase,
    showing.agent_id,
    input.startIso,
    input.endIso,
    undefined,
    showingId,
  );
  if (!available) {
    return { data: null, error: CONFLICT_ERROR };
  }

  const { error } = await supabase
    .from("showings")
    .update({ start_time: input.startIso, end_time: input.endIso })
    .eq("id", showingId);

  if (error) {
    return { data: null, error: error.code === EXCLUSION_VIOLATION_CODE ? CONFLICT_ERROR : GENERIC_ERROR };
  }

  emitEvent({
    event: "showing.rescheduled",
    showing_id: showing.id,
    agent_id: showing.agent_id,
    property_id: showing.property_id,
    prospect_id: showing.prospect_id,
    start_time: input.startIso,
    end_time: input.endIso,
  });

  return { data: undefined, error: null };
}

/** All active, upcoming showings — the receptionist/admin view (CLAUDE.md §4). */
export async function listUpcomingShowings(supabase: SupabaseClient<Database>): Promise<ShowingWithDetails[]> {
  const { data } = await supabase
    .from("showings")
    .select(SHOWING_WITH_DETAILS_SELECT)
    .neq("status", "cancelled")
    .gte("end_time", new Date().toISOString())
    .order("start_time");

  return (data as unknown as ShowingWithDetails[] | null) ?? [];
}

/** One agent's upcoming showings — CLAUDE.md §4 "View their booked showings". */
export async function listUpcomingShowingsForAgent(
  supabase: SupabaseClient<Database>,
  agentId: string,
): Promise<ShowingWithDetails[]> {
  const { data } = await supabase
    .from("showings")
    .select(SHOWING_WITH_DETAILS_SELECT)
    .eq("agent_id", agentId)
    .neq("status", "cancelled")
    .gte("end_time", new Date().toISOString())
    .order("start_time");

  return (data as unknown as ShowingWithDetails[] | null) ?? [];
}
