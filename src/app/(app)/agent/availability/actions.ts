"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAgentId, getCurrentUserProfile } from "@/lib/auth/session";
import {
  addAvailabilityException,
  addAvailabilityRule,
  deleteAvailabilityException,
  deleteAvailabilityRule,
} from "@/lib/services/availability-service";

export type ActionState = {
  error: string | null;
};

const NO_AGENT_ERROR = "No agent profile is linked to your account. Ask an admin for help.";
const AVAILABILITY_PATH = "/agent/availability";

/**
 * Availability is normally scoped to the signed-in agent. An admin managing
 * another agent's schedule (CLAUDE.md §4/§17 "Admins can manage everything")
 * passes that agent's id explicitly via a hidden form field instead — RLS
 * (availability_rules_all_admin / availability_exceptions_all_admin) is what
 * actually authorizes the write, this just decides whose id to use.
 */
async function resolveAgentId(formData: FormData): Promise<string | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return null;
  }

  const formAgentId = formData.get("agentId");
  if (profile.role === "admin" && typeof formAgentId === "string" && formAgentId) {
    return formAgentId;
  }

  return getCurrentAgentId();
}

function revalidatePathFor(formData: FormData): void {
  const returnPath = formData.get("returnPath");
  revalidatePath(typeof returnPath === "string" && returnPath ? returnPath : AVAILABILITY_PATH);
}

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time.");

const addRuleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: timeString,
    endTime: timeString,
  })
  .refine((value) => value.endTime > value.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export async function addAvailabilityRuleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = addRuleSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const agentId = await resolveAgentId(formData);
  if (!agentId) {
    return { error: NO_AGENT_ERROR };
  }

  const supabase = await createClient();
  const result = await addAvailabilityRule(supabase, agentId, parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePathFor(formData);
  return { error: null };
}

const deleteRuleSchema = z.object({ ruleId: z.string().uuid() });

export async function deleteAvailabilityRuleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = deleteRuleSchema.safeParse({ ruleId: formData.get("ruleId") });

  if (!parsed.success) {
    return { error: "Something went wrong. Please try again." };
  }

  const agentId = await resolveAgentId(formData);
  if (!agentId) {
    return { error: NO_AGENT_ERROR };
  }

  const supabase = await createClient();
  const result = await deleteAvailabilityRule(supabase, agentId, parsed.data.ruleId);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePathFor(formData);
  return { error: null };
}

const addExceptionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
    type: z.enum(["available", "unavailable"]),
    allDay: z.coerce.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    reason: z
      .string()
      .trim()
      .max(200, "Keep the note under 200 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .refine((value) => value.allDay || (value.startTime && value.endTime), {
    message: "Enter a start and end time, or mark it all day.",
    path: ["startTime"],
  })
  .refine((value) => value.allDay || !value.startTime || !value.endTime || value.endTime > value.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export async function addAvailabilityExceptionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = addExceptionSchema.safeParse({
    date: formData.get("date"),
    type: formData.get("type"),
    allDay: formData.get("allDay") === "on",
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const agentId = await resolveAgentId(formData);
  if (!agentId) {
    return { error: NO_AGENT_ERROR };
  }

  const supabase = await createClient();
  const result = await addAvailabilityException(supabase, agentId, {
    date: parsed.data.date,
    type: parsed.data.type,
    startTime: parsed.data.allDay ? null : (parsed.data.startTime ?? null),
    endTime: parsed.data.allDay ? null : (parsed.data.endTime ?? null),
    reason: parsed.data.reason,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePathFor(formData);
  return { error: null };
}

const deleteExceptionSchema = z.object({ exceptionId: z.string().uuid() });

export async function deleteAvailabilityExceptionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteExceptionSchema.safeParse({ exceptionId: formData.get("exceptionId") });

  if (!parsed.success) {
    return { error: "Something went wrong. Please try again." };
  }

  const agentId = await resolveAgentId(formData);
  if (!agentId) {
    return { error: NO_AGENT_ERROR };
  }

  const supabase = await createClient();
  const result = await deleteAvailabilityException(supabase, agentId, parsed.data.exceptionId);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePathFor(formData);
  return { error: null };
}
