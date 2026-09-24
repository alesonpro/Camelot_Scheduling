import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { getCurrentUserProfile } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader profile={profile} />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
