import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAgentId, getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listUpcomingShowingsForAgent } from "@/lib/services/showing-service";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import { dateStringInTimezone, formatDate, formatTime, minutesOfDayInTimezone, minutesToTime } from "@/lib/utils/datetime";

export default async function AgentDashboardPage() {
  const [profile, agentId] = await Promise.all([getCurrentUserProfile(), getCurrentAgentId()]);
  const supabase = await createClient();
  const showings = agentId ? await listUpcomingShowingsForAgent(supabase, agentId) : [];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {profile?.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/agent/availability" className={buttonVariants({ className: "w-fit" })}>
            Manage my availability
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Showings</CardTitle>
        </CardHeader>
        <CardContent>
          {showings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No showings scheduled.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {showings.map((showing) => {
                const date = dateStringInTimezone(showing.start_time, DEFAULT_TIMEZONE);
                const time = minutesToTime(minutesOfDayInTimezone(showing.start_time, DEFAULT_TIMEZONE));
                const endTime = minutesToTime(minutesOfDayInTimezone(showing.end_time, DEFAULT_TIMEZONE));

                return (
                  <li key={showing.id} className="flex flex-col gap-0.5 py-2.5">
                    <span className="text-sm font-medium">
                      {showing.property
                        ? `${showing.property.property_name ? `${showing.property.property_name} — ` : ""}${showing.property.address}`
                        : "Unknown property"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(date)}, {formatTime(`${time}:00`)}–{formatTime(`${endTime}:00`)} ·{" "}
                      {showing.prospect?.name ?? "Unknown prospect"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
