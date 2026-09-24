"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { addAgent, setAgentActive, updateAgent } from "@/lib/services/agent-service";

export type ActionState = {
  error: string | null;
};

const AGENTS_PATH = "/admin/agents";
const NOT_ADMIN_ERROR = "You don't have permission to do that.";

// Defense in depth (CLAUDE.md §17/§19): the /admin route is already
// role-gated, but Server Actions are independently reachable, and
// addAgentAction in particular uses the service-role client — which
// bypasses RLS entirely — so this check is the only thing stopping a
// non-admin from creating accounts, not just a UI nicety.
async function requireAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === "admin";
}

const addAgentSchema = z.object({
  name: z.string().trim().min(1, "Enter a name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function addAgentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdmin())) {
    return { error: NOT_ADMIN_ERROR };
  }

  const parsed = addAgentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const result = await addAgent(createAdminClient(), parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(AGENTS_PATH);
  return { error: null };
}

const updateAgentSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().trim().min(1, "Enter a name."),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

export async function updateAgentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdmin())) {
    return { error: NOT_ADMIN_ERROR };
  }

  const parsed = updateAgentSchema.safeParse({
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const supabase = await createClient();
  const result = await updateAgent(supabase, parsed.data.agentId, { name: parsed.data.name, phone: parsed.data.phone });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(AGENTS_PATH);
  return { error: null };
}

const setActiveSchema = z.object({
  agentId: z.string().uuid(),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export async function setAgentActiveAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdmin())) {
    return { error: NOT_ADMIN_ERROR };
  }

  const parsed = setActiveSchema.safeParse({
    agentId: formData.get("agentId"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const result = await setAgentActive(supabase, parsed.data.agentId, parsed.data.active);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(AGENTS_PATH);
  return { error: null };
}
