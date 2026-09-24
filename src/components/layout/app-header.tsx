import Link from "next/link";

import { AppNav } from "@/components/layout/app-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { navItemsForRole } from "@/components/layout/role-nav-items";
import { dashboardPathForRole } from "@/lib/auth/roles";
import type { UserProfile } from "@/types";

export function AppHeader({ profile }: { profile: UserProfile }) {
  const items = navItemsForRole(profile.role);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href={dashboardPathForRole(profile.role)}
            className="text-sm font-semibold text-primary"
          >
            Camelot Scheduler
          </Link>
          <AppNav items={items} />
        </div>
        <UserMenu name={profile.name} email={profile.email} />
      </div>
    </header>
  );
}
