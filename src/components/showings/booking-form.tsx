"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookShowingAction, type ActionState } from "@/app/(app)/receptionist/book/actions";

const initialState: ActionState = { error: null };

export function BookingForm(props: {
  agentId: string;
  propertyId: string;
  date: string;
  time: string;
  duration: string;
}) {
  const [state, formAction, pending] = useActionState(bookShowingAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="agentId" value={props.agentId} />
      <input type="hidden" name="propertyId" value={props.propertyId} />
      <input type="hidden" name="date" value={props.date} />
      <input type="hidden" name="time" value={props.time} />
      <input type="hidden" name="duration" value={props.duration} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prospectName">Prospect name</Label>
        <Input id="prospectName" name="prospectName" required />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-40 flex-col gap-1.5">
          <Label htmlFor="prospectPhone">Phone</Label>
          <Input id="prospectPhone" name="prospectPhone" type="tel" />
        </div>
        <div className="flex flex-1 min-w-40 flex-col gap-1.5">
          <Label htmlFor="prospectEmail">Email</Label>
          <Input id="prospectEmail" name="prospectEmail" type="email" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Enter at least a phone number or an email.</p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" placeholder="e.g. Interested in a quick move-in" />
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Booking…" : "Book Showing"}
      </Button>
    </form>
  );
}
