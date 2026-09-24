"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/db/types";
import { formatDate, formatTime } from "@/lib/utils/datetime";
import {
  addAvailabilityExceptionAction,
  deleteAvailabilityExceptionAction,
  type ActionState,
} from "@/app/(app)/agent/availability/actions";

type Exception = Database["public"]["Tables"]["availability_exceptions"]["Row"];

/** When an admin manages another agent's exceptions instead of their own (CLAUDE.md §4/§17). */
type AdminScope = { agentId: string; returnPath: string };

const initialState: ActionState = { error: null };

const timeInputClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ExceptionsManager({ exceptions, scope }: { exceptions: Exception[]; scope?: AdminScope }) {
  return (
    <div className="flex flex-col gap-4">
      {exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming time off or extra availability.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {exceptions.map((exception) => (
            <ExceptionRow key={exception.id} exception={exception} scope={scope} />
          ))}
        </ul>
      )}
      <AddExceptionForm scope={scope} />
    </div>
  );
}

function ScopeFields({ scope }: { scope?: AdminScope }) {
  if (!scope) {
    return null;
  }
  return (
    <>
      <input type="hidden" name="agentId" value={scope.agentId} />
      <input type="hidden" name="returnPath" value={scope.returnPath} />
    </>
  );
}

function ExceptionRow({ exception, scope }: { exception: Exception; scope?: AdminScope }) {
  const [, formAction, pending] = useActionState(deleteAvailabilityExceptionAction, initialState);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <div className="flex items-center gap-2.5">
        <Badge variant={exception.type === "unavailable" ? "destructive" : "secondary"}>
          {exception.type === "unavailable" ? "Unavailable" : "Extra availability"}
        </Badge>
        <span className="text-sm">
          {formatDate(exception.date)}
          {exception.start_time && exception.end_time
            ? ` · ${formatTime(exception.start_time)}–${formatTime(exception.end_time)}`
            : " · All day"}
        </span>
        {exception.reason && <span className="text-sm text-muted-foreground">— {exception.reason}</span>}
      </div>
      <form action={formAction}>
        <input type="hidden" name="exceptionId" value={exception.id} />
        <ScopeFields scope={scope} />
        <button
          type="submit"
          disabled={pending}
          aria-label="Remove"
          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </form>
    </li>
  );
}

function AddExceptionForm({ scope }: { scope?: AdminScope }) {
  const [state, formAction, pending] = useActionState(addAvailabilityExceptionAction, initialState);
  const [allDay, setAllDay] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [lastHandledState, setLastHandledState] = useState(state);

  // See the matching comment in weekly-availability.tsx: adjusting state
  // during render (not in a useEffect) to reset the form after success.
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) {
      setFormKey((key) => key + 1);
      setAllDay(false);
    }
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
      <ScopeFields scope={scope} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exception-date">Date</Label>
          <Input id="exception-date" name="date" type="date" required className="w-40" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exception-type">Type</Label>
          <select id="exception-type" name="type" defaultValue="unavailable" className={selectClass}>
            <option value="unavailable">Unavailable</option>
            <option value="available">Extra availability</option>
          </select>
        </div>

        <label className="flex items-center gap-1.5 pb-1.5 text-sm">
          <input
            type="checkbox"
            name="allDay"
            checked={allDay}
            onChange={(event) => setAllDay(event.target.checked)}
          />
          All day
        </label>

        {!allDay && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exception-start">From</Label>
              <input id="exception-start" type="time" name="startTime" className={timeInputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exception-end">To</Label>
              <input id="exception-end" type="time" name="endTime" className={timeInputClass} />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exception-reason">Note (optional)</Label>
        <Input id="exception-reason" name="reason" placeholder="e.g. Vacation, doctor's appointment" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}
