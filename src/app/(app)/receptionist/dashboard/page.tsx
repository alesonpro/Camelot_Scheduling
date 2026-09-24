import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/session";

export default async function ReceptionistDashboardPage() {
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {profile?.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Today&apos;s showings and a New Showing action will appear here once the booking workflow is built out.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/receptionist/find-availability" className={buttonVariants({ className: "w-fit" })}>
              Find Availability
            </Link>
            <Link
              href="/receptionist/agents"
              className={buttonVariants({ variant: "outline", className: "w-fit" })}
            >
              Agent Schedules
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
