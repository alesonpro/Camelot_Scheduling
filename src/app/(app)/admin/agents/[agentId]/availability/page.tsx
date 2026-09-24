import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExceptionsManager } from "@/components/availability/exceptions-manager";
import { WeeklyAvailability } from "@/components/availability/weekly-availability";
import { createClient } from "@/lib/supabase/server";
import { listAvailabilityExceptions, listAvailabilityRules } from "@/lib/services/availability-service";

type Params = Promise<{ agentId: string }>;

export default async function AdminAgentAvailabilityPage({ params }: { params: Params }) {
  const { agentId } = await params;
  const supabase = await createClient();

  const { data: agent } = await supabase.from("agents").select("id, name").eq("id", agentId).maybeSingle();

  if (!agent) {
    notFound();
  }

  const [rules, exceptions] = await Promise.all([
    listAvailabilityRules(supabase, agentId),
    listAvailabilityExceptions(supabase, agentId),
  ]);

  const scope = { agentId, returnPath: `/admin/agents/${agentId}/availability` };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{agent.name}&apos;s Availability</CardTitle>
          <CardDescription>This repeats every week until changed.</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyAvailability rules={rules} scope={scope} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time off &amp; extra availability</CardTitle>
        </CardHeader>
        <CardContent>
          <ExceptionsManager exceptions={exceptions} scope={scope} />
        </CardContent>
      </Card>
    </div>
  );
}
