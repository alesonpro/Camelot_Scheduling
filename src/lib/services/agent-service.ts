import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import type { ServiceResult } from "./availability-service";

type Agent = Database["public"]["Tables"]["agents"]["Row"];

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function listAgents(supabase: SupabaseClient<Database>): Promise<Agent[]> {
  const { data } = await supabase.from("agents").select("*").order("name");
  return data ?? [];
}

/**
 * Creates the agent's login (Supabase Auth user) and their agents row
 * together. Requires the service-role client (src/lib/supabase/admin.ts) —
 * regular authenticated clients, even as admin, cannot create auth users.
 * The public.users row is created automatically by the handle_new_user
 * trigger (migration 0002).
 */
export async function addAgent(
  adminClient: SupabaseClient<Database>,
  input: { name: string; email: string; phone: string | null; password: string },
): Promise<ServiceResult<{ agentId: string }>> {
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name, role: "agent" },
  });

  if (authError || !authUser.user) {
    const alreadyExists = authError?.message.toLowerCase().includes("already been registered");
    return { data: null, error: alreadyExists ? "An account with that email already exists." : GENERIC_ERROR };
  }

  if (input.phone) {
    await adminClient.from("users").update({ phone: input.phone }).eq("id", authUser.user.id);
  }

  const { data: agent, error: agentError } = await adminClient
    .from("agents")
    .insert({ user_id: authUser.user.id, name: input.name, email: input.email, phone: input.phone })
    .select("id")
    .single();

  if (agentError || !agent) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: { agentId: agent.id }, error: null };
}

export async function updateAgent(
  supabase: SupabaseClient<Database>,
  agentId: string,
  input: { name: string; phone: string | null },
): Promise<ServiceResult> {
  const { error } = await supabase.from("agents").update({ name: input.name, phone: input.phone }).eq("id", agentId);

  if (error) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: undefined, error: null };
}

/**
 * Disabling an agent (CLAUDE.md §4) both blocks their login (users.active,
 * checked at sign-in) and removes them from availability search results
 * (agents.active, already checked throughout src/lib/scheduling).
 */
export async function setAgentActive(
  supabase: SupabaseClient<Database>,
  agentId: string,
  active: boolean,
): Promise<ServiceResult> {
  const { data: agent } = await supabase.from("agents").select("user_id").eq("id", agentId).maybeSingle();

  if (!agent) {
    return { data: null, error: GENERIC_ERROR };
  }

  const [{ error: agentError }, { error: userError }] = await Promise.all([
    supabase.from("agents").update({ active }).eq("id", agentId),
    supabase.from("users").update({ active }).eq("id", agent.user_id),
  ]);

  if (agentError || userError) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: undefined, error: null };
}
