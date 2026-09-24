import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listAgents } from "@/lib/services/agent-service";
import { listUpcomingShowings } from "@/lib/services/showing-service";

export default async function AdminDashboardPage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();
  const [agents, showings] = await Promise.all([listAgents(supabase), listUpcomingShowings(supabase)]);
  const activeAgents = agents.filter((agent) => agent.active).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {profile?.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {activeAgents} active agent{activeAgents === 1 ? "" : "s"} · {showings.length} upcoming showing
            {showings.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/agents" className={buttonVariants({ className: "w-fit" })}>
              Manage Agents
            </Link>
            <Link href="/admin/properties" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
              Manage Properties
            </Link>
            <Link href="/admin/showings" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
              View Showings
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
