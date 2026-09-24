import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  findNextAvailableSlots,
  searchAgentAvailability,
  type AgentAvailabilityStatus,
} from "@/lib/scheduling/availability";
import { createClient } from "@/lib/supabase/server";
import { listActiveProperties } from "@/lib/services/property-service";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import { formatTime, minutesToTime, timeToMinutes, todayInTimezone } from "@/lib/utils/datetime";

const timeInputClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const selectClass = timeInputClass;

const STATUS_LABEL: Record<AgentAvailabilityStatus, string> = {
  available: "Available",
  busy: "Busy",
  unavailable: "Unavailable",
};

const STATUS_VARIANT: Record<AgentAvailabilityStatus, "default" | "outline" | "secondary"> = {
  available: "default",
  busy: "outline",
  unavailable: "secondary",
};

type SearchParams = Promise<{
  propertyId?: string;
  date?: string;
  time?: string;
  duration?: string;
  showNext?: string;
}>;

export default async function FindAvailabilityPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = params.date || todayInTimezone(DEFAULT_TIMEZONE);
  const time = params.time || "";
  const duration = Number(params.duration) || 30;
  const showNext = params.showNext === "1";
  const propertyId = params.propertyId || "";

  const supabase = await createClient();
  const properties = await listActiveProperties(supabase);

  const results = time
    ? await searchAgentAvailability(supabase, {
        date,
        startTime: time,
        endTime: minutesToTime(timeToMinutes(time) + duration),
      })
    : null;

  const anyAvailable = results?.some((result) => result.status === "available") ?? true;
  const nextSlots =
    time && (!anyAvailable || showNext)
      ? await findNextAvailableSlots(supabase, { date, afterTime: time, durationMinutes: duration })
      : null;

  const bookHref = (agentId: string, atTime: string) =>
    `/receptionist/book?agentId=${agentId}&propertyId=${propertyId}&date=${date}&time=${atTime}&duration=${duration}`;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Available Agents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No properties yet. Ask an admin to add one before booking a showing.
            </p>
          ) : (
            <form className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="propertyId">Property</Label>
                <select id="propertyId" name="propertyId" defaultValue={propertyId} required className={selectClass}>
                  <option value="" disabled>
                    Select a property
                  </option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.property_name ? `${property.property_name} — ` : ""}
                      {property.address}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <input id="date" type="date" name="date" defaultValue={date} required className={timeInputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="time">Time</Label>
                <input id="time" type="time" name="time" defaultValue={time} required className={timeInputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="duration">Duration</Label>
                <select id="duration" name="duration" defaultValue={String(duration)} className={selectClass}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                </select>
              </div>
              <Button type="submit">Search</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>
              Agents for {date} at {formatTime(`${time}:00`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agents are set up yet. Ask an admin for help.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {results.map((result) => (
                  <li key={result.agentId} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">{result.name}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_VARIANT[result.status]}>{STATUS_LABEL[result.status]}</Badge>
                      {result.status === "available" && propertyId && (
                        <Link href={bookHref(result.agentId, time)} className="text-sm font-medium text-primary hover:underline">
                          Book with {result.name}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!anyAvailable && (
              <p className="text-sm text-muted-foreground">
                No agents are available at {formatTime(`${time}:00`)}.{" "}
                {!showNext && "Try a different time, or find the next available agent below."}
              </p>
            )}

            {!showNext && anyAvailable && (
              <Link
                href={`/receptionist/find-availability?date=${date}&time=${time}&duration=${duration}&showNext=1`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Show next available times
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {nextSlots && (
        <Card>
          <CardHeader>
            <CardTitle>Next Available</CardTitle>
          </CardHeader>
          <CardContent>
            {nextSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability found later that day.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {nextSlots.map((slot, index) => (
                  <li key={`${slot.agentId}-${slot.time}-${index}`} className="flex items-center justify-between py-2">
                    <span className="text-sm">
                      {formatTime(`${slot.time}:00`)} <span className="font-medium">{slot.name}</span>
                    </span>
                    {propertyId && (
                      <Link
                        href={bookHref(slot.agentId, slot.time)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Book with {slot.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
