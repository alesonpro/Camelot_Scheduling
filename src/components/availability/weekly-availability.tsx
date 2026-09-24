"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TimeSelect } from "@/components/ui/time-select";
import type { Database } from "@/lib/db/types";
import { DAY_NAMES, formatTime } from "@/lib/utils/datetime";
import {
  addAvailabilityRuleAction,
  deleteAvailabilityRuleAction,
  type ActionState,
} from "@/app/(app)/agent/availability/actions";

type Rule = Database["public"]["Tables"]["availability_rules"]["Row"];

/** When an admin manages another agent's availability instead of their own (CLAUDE.md §4/§17). */
type AdminScope = { agentId: string; returnPath: string };

const initialState: ActionState = { error: null };
// Monday-first display order, matching the CLAUDE.md §6/§38 example, even
// though day_of_week is stored Sunday-first (0) to match Postgres/JS convention.
const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function WeeklyAvailability({ rules, scope }: { rules: Rule[]; scope?: AdminScope }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {WEEK_DISPLAY_ORDER.map((dayOfWeek) => (
        <DayRow
          key={dayOfWeek}
          dayOfWeek={dayOfWeek}
          rules={rules.filter((rule) => rule.day_of_week === dayOfWeek)}
          scope={scope}
        />
      ))}
    </div>
  );
}

function DayRow({ dayOfWeek, rules, scope }: { dayOfWeek: number; rules: Rule[]; scope?: AdminScope }) {
  return (
    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="w-28 shrink-0 pt-1.5 text-sm font-medium">{DAY_NAMES[dayOfWeek]}</div>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {rules.length === 0 && <span className="text-sm text-muted-foreground">Not available</span>}
        {rules.map((rule) => (
          <RuleChip key={rule.id} rule={rule} scope={scope} />
        ))}
        <AddRuleForm dayOfWeek={dayOfWeek} scope={scope} />
      </div>
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

function RuleChip({ rule, scope }: { rule: Rule; scope?: AdminScope }) {
  const [, formAction, pending] = useActionState(deleteAvailabilityRuleAction, initialState);

  return (
    <form action={formAction} className="inline-flex">
      <input type="hidden" name="ruleId" value={rule.id} />
      <ScopeFields scope={scope} />
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-sm">
        {formatTime(rule.start_time)}–{formatTime(rule.end_time)}
        <button
          type="submit"
          disabled={pending}
          aria-label={`Remove ${DAY_NAMES[rule.day_of_week]} ${formatTime(rule.start_time)}–${formatTime(rule.end_time)}`}
          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </span>
    </form>
  );
}

function AddRuleForm({ dayOfWeek, scope }: { dayOfWeek: number; scope?: AdminScope }) {
  const [state, formAction, pending] = useActionState(addAvailabilityRuleAction, initialState);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [lastHandledState, setLastHandledState] = useState(state);

  // Adjusting state in response to a prop/state change, done during render
  // per https://react.dev/learn/you-might-not-need-an-effect rather than in
  // a useEffect: remounts the form (clearing its inputs) after a successful
  // submission, without an extra render pass.
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) {
      setFormKey((key) => key + 1);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        + Add time
      </Button>
    );
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
      <ScopeFields scope={scope} />
      <TimeSelect name="startTime" required aria-label="Start time" />
      <span className="text-sm text-muted-foreground">to</span>
      <TimeSelect name="endTime" required aria-label="End time" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
