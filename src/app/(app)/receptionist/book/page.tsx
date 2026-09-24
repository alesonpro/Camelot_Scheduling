import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingForm } from "@/components/showings/booking-form";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, minutesToTime, timeToMinutes } from "@/lib/utils/datetime";

type SearchParams = Promise<{
  agentId?: string;
  propertyId?: string;
  date?: string;
  time?: string;
  duration?: string;
}>;

export default async function BookShowingPage({ searchParams }: { searchParams: SearchParams }) {
  const { agentId, propertyId, date, time, duration } = await searchParams;

  if (!agentId || !propertyId || !date || !time || !duration) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: agent }, { data: property }] = await Promise.all([
    supabase.from("agents").select("id, name").eq("id", agentId).maybeSingle(),
    supabase
      .from("properties")
      .select("id, address, city, state, zip, property_name")
      .eq("id", propertyId)
      .maybeSingle(),
  ]);

  if (!agent || !property) {
    notFound();
  }

  const durationMinutes = Number(duration);
  const endTime = minutesToTime(timeToMinutes(time) + durationMinutes);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Book Showing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Agent</dt>
            <dd className="font-medium">{agent.name}</dd>
            <dt className="text-muted-foreground">Property</dt>
            <dd className="font-medium">
              {property.property_name ? `${property.property_name} — ` : ""}
              {property.address}, {property.city}, {property.state} {property.zip}
            </dd>
            <dt className="text-muted-foreground">When</dt>
            <dd className="font-medium">
              {formatDate(date)}, {formatTime(`${time}:00`)}–{formatTime(`${endTime}:00`)}
            </dd>
          </dl>

          <BookingForm agentId={agentId} propertyId={propertyId} date={date} time={time} duration={duration} />
        </CardContent>
      </Card>
    </div>
  );
}
