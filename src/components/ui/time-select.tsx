import type { ComponentProps } from "react";

import { formatTime, minutesToTime } from "@/lib/utils/datetime";

// A plain dropdown of 12-hour times (CLAUDE.md §23: non-technical users,
// familiar terminology) instead of the native <input type="time">, whose
// picker UI and AM/PM-vs-24-hour display vary by OS/browser locale. The
// option value stays "HH:MM" (24-hour), so every existing action/schema
// that reads this field needs no change.
const STEP_MINUTES = 15;
const TIME_OPTIONS = Array.from({ length: (24 * 60) / STEP_MINUTES }, (_, index) => {
  const value = minutesToTime(index * STEP_MINUTES);
  return { value, label: formatTime(value) };
});

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type TimeSelectProps = Omit<ComponentProps<"select">, "children">;

export function TimeSelect({ className, ...props }: TimeSelectProps) {
  return (
    <select className={className ?? selectClass} {...props}>
      <option value="" disabled>
        Select a time
      </option>
      {TIME_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
