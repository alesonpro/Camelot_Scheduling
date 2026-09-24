import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddAgentForm } from "@/components/agents/add-agent-form";
import { AgentRow } from "@/components/agents/agent-row";
import { createClient } from "@/lib/supabase/server";
import { listAgents } from "@/lib/services/agent-service";

export default async function AdminAgentsPage() {
  const supabase = await createClient();
  const agents = await listAgents(supabase);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents yet. Add one below.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={{ id: agent.id, name: agent.name, email: agent.email, phone: agent.phone, active: agent.active }}
                />
              ))}
            </ul>
          )}

          <AddAgentForm />
        </CardContent>
      </Card>
    </div>
  );
}
