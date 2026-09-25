import "server-only";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { isRole } from "@/lib/auth/roles";
import type { UserProfile } from "@/types";

/**
 * Returns the signed-in user's profile (from public.users), or null if no
 * one is signed in. Uses getSession() (a local cookie read, no network
 * call) rather than getUser() (which hits the Supabase Auth server):
 * proxy.ts already ran the network-verified getUser() check for this exact
 * request and refreshed the cookies before forwarding it here, so a second
 * network round-trip would just re-verify what's already verified. The
 * profile query below still reads fresh from public.users under RLS
 * regardless of which auth method resolved the user id, so this doesn't
 * weaken requireRole()'s defense-in-depth check. (supabase-js logs a
 * one-time warning about trusting getSession()'s user object — expected
 * and harmless here, since it's not being used to authorize anything by
 * itself.)
 * Wrapped in cache() so the root layout, the role layout, and the page can
 * each call this without tripling the Supabase round-trip per request.
 */
export const getCurrentUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, role, phone, active")
    .eq("id", user.id)
    .single();

  if (!profile || !isRole(profile.role)) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    phone: profile.phone,
    active: profile.active,
  };
});

/**
 * Returns the signed-in user's agents.id (not users.id), or null if no one
 * is signed in or they have no linked agent row (e.g. an admin who isn't
 * also an agent). Availability is scoped by agents.id, not users.id.
 * Resolves the user via getCurrentUserProfile() (cache()-wrapped, so free
 * if already called elsewhere in this request) instead of its own auth
 * call.
 */
export const getCurrentAgentId = cache(async (): Promise<string | null> => {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return null;
  }

  const supabase = await createClient();
  const { data: agent } = await supabase.from("agents").select("id").eq("user_id", profile.id).maybeSingle();

  return agent?.id ?? null;
});
