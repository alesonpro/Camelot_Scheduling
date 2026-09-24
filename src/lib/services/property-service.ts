import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import type { ServiceResult } from "./availability-service";

type Property = Database["public"]["Tables"]["properties"]["Row"];

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function listActiveProperties(supabase: SupabaseClient<Database>): Promise<Property[]> {
  const { data } = await supabase.from("properties").select("*").eq("active", true).order("address");
  return data ?? [];
}

export async function addProperty(
  supabase: SupabaseClient<Database>,
  input: { address: string; city: string; state: string; zip: string; propertyName: string | null },
): Promise<ServiceResult> {
  const { error } = await supabase.from("properties").insert({
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    property_name: input.propertyName,
  });

  if (error) {
    return { data: null, error: GENERIC_ERROR };
  }

  return { data: undefined, error: null };
}
