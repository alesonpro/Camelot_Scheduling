import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExceptionsManager } from "@/components/availability/exceptions-manager";
import { WeeklyAvailability } from "@/components/availability/weekly-availability";
import { getCurrentAgentId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listAvailabilityExceptions, listAvailabilityRules } from "@/lib/services/availability-service";

export default async function AgentAvailabilityPage() {
  const agentId = await getCurrentAgentId();

  if (!agentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No agent profile is linked to your account. Ask an admin for help.
          </p>
        </CardContent>
      </Card>
    );
  }

  const supabase = await createClient();
  const [rules, exceptions] = await Promise.all([
    listAvailabilityRules(supabase, agentId),
    listAvailabilityExceptions(supabase, agentId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>When can you show properties?</CardTitle>
          <CardDescription>This repeats every week until you change it.</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyAvailability rules={rules} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time off &amp; extra availability</CardTitle>
          <CardDescription>One-time changes that override your weekly schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExceptionsManager exceptions={exceptions} />
        </CardContent>
      </Card>
    </div>
  );
}
