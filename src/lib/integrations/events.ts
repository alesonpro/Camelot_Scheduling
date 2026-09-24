import "server-only";

// CLAUDE.md §20/§21: core scheduling logic emits events; it never talks to
// n8n (or any notification provider) directly. Phase 6 wires this up to a
// real n8n webhook. Until then this just logs, so the call sites (showing
// create/cancel/reschedule) don't need to change when that lands.

export type SchedulingEvent =
  | {
      event: "showing.created" | "showing.cancelled" | "showing.rescheduled";
      showing_id: string;
      agent_id: string;
      property_id: string;
      prospect_id: string | null;
      start_time: string;
      end_time: string;
    }
  | {
      event: "availability.updated";
      agent_id: string;
    };

export function emitEvent(payload: SchedulingEvent): void {
  console.log("[event]", payload.event, payload);
}
