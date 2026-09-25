import type { ShowingRowData } from "@/components/showings/showing-row";
import type { ShowingWithDetails } from "@/lib/services/showing-service";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import { dateStringInTimezone, minutesOfDayInTimezone, minutesToTime } from "@/lib/utils/datetime";

/** The one place `ShowingWithDetails` rows become display-ready `ShowingRowData` (CLAUDE.md §30). */
export function toShowingRowData(showing: ShowingWithDetails): ShowingRowData {
  const date = dateStringInTimezone(showing.start_time, DEFAULT_TIMEZONE);
  const time = minutesToTime(minutesOfDayInTimezone(showing.start_time, DEFAULT_TIMEZONE));
  const endTime = minutesToTime(minutesOfDayInTimezone(showing.end_time, DEFAULT_TIMEZONE));
  const durationMinutes = (new Date(showing.end_time).getTime() - new Date(showing.start_time).getTime()) / 60_000;

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
    notes: showing.notes,
  };
}
