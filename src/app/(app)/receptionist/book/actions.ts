"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createShowing } from "@/lib/services/showing-service";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import { localDateTimeToUtcIso, timeToMinutes, minutesToTime } from "@/lib/utils/datetime";

export type ActionState = {
  error: string | null;
};

const bookShowingSchema = z
  .object({
    agentId: z.string().uuid("Choose an agent."),
    propertyId: z.string().uuid("Choose a property."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid time."),
    duration: z.coerce.number().int().min(5, "Enter a valid duration.").max(480, "Enter a valid duration."),
    prospectName: z.string().trim().min(1, "Enter the prospect's name."),
    prospectPhone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
    prospectEmail: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
    notes: z
      .string()
      .trim()
      .max(500, "Keep notes under 500 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .refine((value) => value.prospectPhone || value.prospectEmail, {
    message: "Enter a phone number or email for the prospect.",
    path: ["prospectPhone"],
  })
  .refine((value) => !value.prospectEmail || z.string().email().safeParse(value.prospectEmail).success, {
    message: "Enter a valid email address.",
    path: ["prospectEmail"],
  });

export async function bookShowingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = bookShowingSchema.safeParse({
    agentId: formData.get("agentId"),
    propertyId: formData.get("propertyId"),
    date: formData.get("date"),
    time: formData.get("time"),
    duration: formData.get("duration"),
    prospectName: formData.get("prospectName"),
    prospectPhone: formData.get("prospectPhone") || undefined,
    prospectEmail: formData.get("prospectEmail") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { agentId, propertyId, date, time, duration, prospectName, prospectPhone, prospectEmail, notes } =
    parsed.data;

  const startIso = localDateTimeToUtcIso(date, time, DEFAULT_TIMEZONE);
  const endIso = localDateTimeToUtcIso(date, minutesToTime(timeToMinutes(time) + duration), DEFAULT_TIMEZONE);

  const supabase = await createClient();
  const result = await createShowing(supabase, {
    agentId,
    propertyId,
    startIso,
    endIso,
    prospect: { name: prospectName, phone: prospectPhone, email: prospectEmail },
    notes,
  });

  if (result.error) {
    return { error: result.error };
  }

  redirect("/receptionist/showings?booked=1");
}
