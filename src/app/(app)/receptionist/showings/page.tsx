import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShowingRow, type ShowingRowData } from "@/components/showings/showing-row";
import { createClient } from "@/lib/supabase/server";
import { listUpcomingShowings } from "@/lib/services/showing-service";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import { dateStringInTimezone, minutesOfDayInTimezone, minutesToTime } from "@/lib/utils/datetime";

type SearchParams = Promise<{ booked?: string }>;

export default async function ReceptionistShowingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { booked } = await searchParams;
  const supabase = await createClient();
  const showings = await listUpcomingShowings(supabase);

  const rows: ShowingRowData[] = showings.map((showing) => {
    const date = dateStringInTimezone(showing.start_time, DEFAULT_TIMEZONE);
    const time = minutesToTime(minutesOfDayInTimezone(showing.start_time, DEFAULT_TIMEZONE));
    const endTime = minutesToTime(minutesOfDayInTimezone(showing.end_time, DEFAULT_TIMEZONE));
    const durationMinutes =
      (new Date(showing.end_time).getTime() - new Date(showing.start_time).getTime()) / 60_000;

    return {
      id: showing.id,
      agentName: showing.agent?.name ?? "Unknown agent",
      propertyLabel: showing.property
        ? `${showing.property.property_name ? `${showing.property.property_name} — ` : ""}${showing.property.address}`
        : "Unknown property",
      prospectName: showing.prospect?.name ?? "Unknown prospect",
      prospectContact: showing.prospect?.phone || showing.prospect?.email || "No contact on file",
      date,
      time,
      endTime,
      durationMinutes,
      status: showing.status,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {booked === "1" && (
        <Alert>
          <AlertDescription>Showing booked successfully.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Showings</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No showings scheduled.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((row) => (
                <ShowingRow key={row.id} showing={row} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
