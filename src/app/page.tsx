import { redirect } from "next/navigation";

import { dashboardPathForRole } from "@/lib/auth/roles";
import { getCurrentUserProfile } from "@/lib/auth/session";

// proxy.ts already redirects "/" before this ever renders; this is a
// fallback in case a request somehow reaches the page directly.
export default async function RootPage() {
  const profile = await getCurrentUserProfile();
  redirect(profile ? dashboardPathForRole(profile.role) : "/login");
}
