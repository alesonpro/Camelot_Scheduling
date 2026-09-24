import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DAY_NAMES, formatTime } from "@/lib/utils/datetime";

const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function ReceptionistAgentsPage() {
  const supabase = await createClient();

  const [{ data: agents }, { data: rules }] = await Promise.all([
    supabase.from("agents").select("id, name").eq("active", true).order("name"),
    supabase
      .from("availability_rules")
      .select("agent_id, day_of_week, start_time, end_time")
      .eq("active", true)
      .order("day_of_week")
      .order("start_time"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {!agents || agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active agents yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {agents.map((agent) => {
                const agentRules = (rules ?? []).filter((rule) => rule.agent_id === agent.id);

                return (
                  <li key={agent.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium">{agent.name}</span>
                    {agentRules.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No weekly availability set.</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {WEEK_DISPLAY_ORDER.filter((day) => agentRules.some((rule) => rule.day_of_week === day))
                          .map((day) =>
                            agentRules
                              .filter((rule) => rule.day_of_week === day)
                              .map((rule) => `${DAY_NAMES[day].slice(0, 3)} ${formatTime(rule.start_time)}–${formatTime(rule.end_time)}`)
                              .join(", "),
                          )
                          .join(" · ")}
                      </span>
                    )}
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
