import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime, minutesToTime } from "@/lib/utils/datetime";

// A custom-styled dropdown of 12-hour times (CLAUDE.md §23: non-technical
// users, familiar terminology) instead of the native <input type="time">,
// whose picker UI and AM/PM-vs-24-hour display vary by OS/browser locale.
// Submitted values stay "HH:MM" (24-hour), so every existing action/schema
// that reads this field needs no change.
const STEP_MINUTES = 15;
const TIME_OPTIONS = Array.from({ length: (24 * 60) / STEP_MINUTES }, (_, index) => {
  const value = minutesToTime(index * STEP_MINUTES);
  return { value, label: formatTime(value) };
});

type TimeSelectProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  "aria-label"?: string;
  className?: string;
};

export function TimeSelect({ id, name, defaultValue, required, className, ...rest }: TimeSelectProps) {
  return (
    <Select name={name} defaultValue={defaultValue || undefined} required={required}>
      <SelectTrigger id={id} className={className} {...rest}>
        <SelectValue placeholder="Select a time" />
      </SelectTrigger>
      <SelectContent>
        {TIME_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
