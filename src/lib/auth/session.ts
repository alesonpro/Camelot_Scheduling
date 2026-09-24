import "server-only";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { isRole } from "@/lib/auth/roles";
import type { UserProfile } from "@/types";

/**
 * Returns the signed-in user's profile (from public.users), or null if no
 * one is signed in. Uses getUser() rather than getSession() so the JWT is
 * actually revalidated against Supabase, not just read from a cookie.
 * Wrapped in cache() so the root layout, the role layout, and the page can
 * each call this without tripling the Supabase round-trip per request.
 */
export const getCurrentUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
 */
export const getCurrentAgentId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: agent } = await supabase.from("agents").select("id").eq("user_id", user.id).maybeSingle();

  return agent?.id ?? null;
});
