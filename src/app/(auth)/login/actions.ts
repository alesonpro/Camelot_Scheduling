"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { dashboardPathForRole, isRole } from "@/lib/auth/roles";

const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  redirectTo: z.string().optional(),
});

export type SignInState = {
  error: string | null;
};

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { email, password, redirectTo } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "That email and password don't match. Try again." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", data.user.id)
    .single();

  if (!profile || !isRole(profile.role)) {
    return { error: "Your account isn't set up yet. Ask an admin for help." };
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: "Your account has been disabled. Contact an admin for help." };
  }

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : dashboardPathForRole(profile.role));
}
