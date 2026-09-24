"use client";

import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TimeSelect } from "@/components/ui/time-select";
import { DEFAULT_TIMEZONE } from "@/lib/config/app-config";
import { formatDate, formatTime, todayInTimezone } from "@/lib/utils/datetime";
import {
  cancelShowingAction,
  rescheduleShowingAction,
  type ActionState,
} from "@/app/(app)/receptionist/showings/actions";

const initialState: ActionState = { error: null };

const timeInputClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ShowingRowData = {
  id: string;
  agentName: string;
  propertyLabel: string;
  prospectName: string;
  prospectContact: string;
  date: string;
  time: string;
  endTime: string;
  durationMinutes: number;
  status: string;
};

export function ShowingRow({ showing }: { showing: ShowingRowData }) {
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelShowingAction, initialState);
  const [rescheduleState, rescheduleAction, reschedulePending] = useActionState(
    rescheduleShowingAction,
    initialState,
  );
  const [lastHandledState, setLastHandledState] = useState(rescheduleState);

  if (rescheduleState !== lastHandledState) {
    setLastHandledState(rescheduleState);
    if (!rescheduleState.error) {
      setRescheduling(false);
    }
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{showing.propertyLabel}</span>
          <span className="text-sm text-muted-foreground">
            {formatDate(showing.date)}, {formatTime(`${showing.time}:00`)}–{formatTime(`${showing.endTime}:00`)} ·{" "}
            {showing.agentName}
          </span>
          <span className="text-sm text-muted-foreground">
            {showing.prospectName} · {showing.prospectContact}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{showing.status}</Badge>
          <Button type="button" variant="ghost" size="sm" onClick={() => setRescheduling((open) => !open)}>
            {rescheduling ? "Cancel edit" : "Reschedule"}
          </Button>
          <form action={cancelAction}>
            <input type="hidden" name="showingId" value={showing.id} />
            <Button type="submit" variant="destructive" size="sm" disabled={cancelPending}>
              {cancelPending ? "Cancelling…" : "Cancel"}
            </Button>
          </form>
        </div>
      </div>

      {cancelState.error && <p className="text-sm text-destructive">{cancelState.error}</p>}

      {rescheduling && (
        <form action={rescheduleAction} className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/50 p-3">
          <input type="hidden" name="showingId" value={showing.id} />
          <input type="hidden" name="duration" value={showing.durationMinutes} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor={`date-${showing.id}`}>
              New date
            </label>
            <input
              id={`date-${showing.id}`}
              type="date"
              name="date"
              defaultValue={showing.date}
              min={todayInTimezone(DEFAULT_TIMEZONE)}
              required
              className={timeInputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor={`time-${showing.id}`}>
              New time
            </label>
            <TimeSelect id={`time-${showing.id}`} name="time" defaultValue={showing.time} required />
          </div>
          <Button type="submit" size="sm" disabled={reschedulePending}>
            {reschedulePending ? "Saving…" : "Save new time"}
          </Button>
          {rescheduleState.error && <p className="w-full text-sm text-destructive">{rescheduleState.error}</p>}
        </form>
      )}
    </li>
  );
}
