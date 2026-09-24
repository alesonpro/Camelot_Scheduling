"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPropertyAction, type ActionState } from "@/app/(app)/admin/properties/actions";

const initialState: ActionState = { error: null };

export function AddPropertyForm() {
  const [state, formAction, pending] = useActionState(addPropertyAction, initialState);
  const [formKey, setFormKey] = useState(0);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) {
      setFormKey((key) => key + 1);
    }
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-48 flex-col gap-1.5">
          <Label htmlFor="address">Street address</Label>
          <Input id="address" name="address" required />
        </div>
        <div className="flex flex-1 min-w-40 flex-col gap-1.5">
          <Label htmlFor="propertyName">Property name (optional)</Label>
          <Input id="propertyName" name="propertyName" placeholder="e.g. The Oaks Unit 4B" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" required className="w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zip">ZIP</Label>
          <Input id="zip" name="zip" required className="w-28" />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Add Property"}
      </Button>
    </form>
  );
}
