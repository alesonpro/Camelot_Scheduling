import "server-only";
import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/roles";
import type { UserProfile } from "@/types";

/**
 * Defense-in-depth check for role-scoped layouts. proxy.ts already enforces
 * this at the route level; this re-checks server-side in case a route is
 * ever reached without going through it.
 */
export async function requireRole(...allowed: Role[]): Promise<UserProfile> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowed.includes(profile.role)) {
    redirect("/unauthorized");
  }

  return profile;
}
