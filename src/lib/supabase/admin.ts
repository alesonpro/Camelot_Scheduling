import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Service-role client. Bypasses Row Level Security — never import this
 * from a "use client" module or expose it to the browser. Reserved for
 * Phase 2+ admin operations (e.g. provisioning accounts); Phase 1 does not
 * call this yet.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
