"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { cancelShowing, rescheduleShowing } from "@/lib/services/showing-service";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import { localDateTimeToUtcIso, minutesToTime, timeToMinutes } from "@/lib/utils/datetime";

export type ActionState = {
  error: string | null;
};

const SHOWINGS_PATH = "/receptionist/showings";

const cancelSchema = z.object({ showingId: z.string().uuid() });

export async function cancelShowingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cancelSchema.safeParse({ showingId: formData.get("showingId") });

  if (!parsed.success) {
    return { error: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const result = await cancelShowing(supabase, parsed.data.showingId);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(SHOWINGS_PATH);
  return { error: null };
}

const rescheduleSchema = z.object({
  showingId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid time."),
  duration: z.coerce.number().int().min(5).max(480),
});

export async function rescheduleShowingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = rescheduleSchema.safeParse({
    showingId: formData.get("showingId"),
    date: formData.get("date"),
    time: formData.get("time"),
    duration: formData.get("duration"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { showingId, date, time, duration } = parsed.data;
  const startIso = localDateTimeToUtcIso(date, time, DEFAULT_TIMEZONE);
  const endIso = localDateTimeToUtcIso(date, minutesToTime(timeToMinutes(time) + duration), DEFAULT_TIMEZONE);

  const supabase = await createClient();
  const result = await rescheduleShowing(supabase, showingId, { startIso, endIso });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(SHOWINGS_PATH);
  return { error: null };
}
