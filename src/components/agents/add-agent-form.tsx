"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAgentAction, type ActionState } from "@/app/(app)/admin/agents/actions";

const initialState: ActionState = { error: null };

export function AddAgentForm() {
  const [state, formAction, pending] = useActionState(addAgentAction, initialState);
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
        <div className="flex flex-1 min-w-40 flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="flex flex-1 min-w-40 flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-1 min-w-32 flex-col gap-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="text" required minLength={8} />
        <p className="text-xs text-muted-foreground">Share this with the agent so they can log in.</p>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Adding…" : "Add Agent"}
      </Button>
    </form>
  );
}
