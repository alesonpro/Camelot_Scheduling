import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";

type AvailabilityRule = Database["public"]["Tables"]["availability_rules"]["Row"];
type AvailabilityException = Database["public"]["Tables"]["availability_exceptions"]["Row"];

export type ServiceResult<T = undefined> = { data: T; error: null } | { data: null; error: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Sits between the agent's Server Actions and the database (CLAUDE.md §27).
// Every mutation is scoped to the given agentId — callers must derive that
// from the signed-in session (see getCurrentAgentId), never from client
// input, so an agent can only ever touch their own rows. RLS enforces the
// same boundary server-side as a second layer, per CLAUDE.md §18.

export async function listAvailabilityRules(
  supabase: SupabaseClient<Database>,
  agentId: string,
): Promise<AvailabilityRule[]> {
  const { data } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("agent_id", agentId)
    .order("day_of_week")
    .order("start_time");

  return data ?? [];
}

export async function addAvailabilityRule(
  supabase: SupabaseClient<Database>,
  agentId: string,
  input: { dayOfWeek: number; startTime: string; endTime: string },
): Promise<ServiceResult> {
  const { error } = await supabase.from("availability_rules").insert({
    agent_id: agentId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
  });

  if (error) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: undefined, error: null };
}

export async function deleteAvailabilityRule(
  supabase: SupabaseClient<Database>,
  agentId: string,
  ruleId: string,
): Promise<ServiceResult> {
  const { error } = await supabase
    .from("availability_rules")
    .delete()
    .eq("id", ruleId)
    .eq("agent_id", agentId);

  if (error) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: undefined, error: null };
}

export async function listAvailabilityExceptions(
  supabase: SupabaseClient<Database>,
  agentId: string,
): Promise<AvailabilityException[]> {
  const { data } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("agent_id", agentId)
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date")
    .order("start_time");

  return data ?? [];
}

export async function addAvailabilityException(
  supabase: SupabaseClient<Database>,
  agentId: string,
  input: {
    date: string;
    startTime: string | null;
    endTime: string | null;
    type: "available" | "unavailable";
    reason: string | null;
  },
): Promise<ServiceResult> {
  const { error } = await supabase.from("availability_exceptions").insert({
    agent_id: agentId,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    type: input.type,
    reason: input.reason,
  });

  if (error) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: undefined, error: null };
}

export async function deleteAvailabilityException(
  supabase: SupabaseClient<Database>,
  agentId: string,
  exceptionId: string,
): Promise<ServiceResult> {
  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", exceptionId)
    .eq("agent_id", agentId);

  if (error) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: undefined, error: null };
}
