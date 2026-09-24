"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { addProperty } from "@/lib/services/property-service";

export type ActionState = {
  error: string | null;
};

const addPropertySchema = z.object({
  address: z.string().trim().min(1, "Enter a street address."),
  city: z.string().trim().min(1, "Enter a city."),
  state: z.string().trim().min(1, "Enter a state."),
  zip: z.string().trim().min(1, "Enter a ZIP code."),
  propertyName: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

export async function addPropertyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = addPropertySchema.safeParse({
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    propertyName: formData.get("propertyName") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const supabase = await createClient();
  const result = await addProperty(supabase, parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/properties");
  return { error: null };
}
