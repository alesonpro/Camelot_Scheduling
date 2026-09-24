"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setAgentActiveAction,
  updateAgentAction,
  type ActionState,
} from "@/app/(app)/admin/agents/actions";

const initialState: ActionState = { error: null };

export type AgentRowData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
};

export function AgentRow({ agent }: { agent: AgentRowData }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateAgentAction, initialState);
  const [toggleState, toggleAction, togglePending] = useActionState(setAgentActiveAction, initialState);
  const [lastHandledState, setLastHandledState] = useState(updateState);

  if (updateState !== lastHandledState) {
    setLastHandledState(updateState);
    if (!updateState.error) {
      setEditing(false);
    }
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {agent.name} {!agent.active && <Badge variant="secondary">Disabled</Badge>}
          </span>
          <span className="text-sm text-muted-foreground">
            {agent.email}
            {agent.phone ? ` · ${agent.phone}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/agents/${agent.id}/availability`} className="text-sm font-medium text-primary hover:underline">
            Manage availability
          </Link>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((open) => !open)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
          <form action={toggleAction}>
            <input type="hidden" name="agentId" value={agent.id} />
            <input type="hidden" name="active" value={(!agent.active).toString()} />
            <Button type="submit" variant={agent.active ? "destructive" : "outline"} size="sm" disabled={togglePending}>
              {agent.active ? "Disable" : "Enable"}
            </Button>
          </form>
        </div>
      </div>

      {toggleState.error && <p className="text-sm text-destructive">{toggleState.error}</p>}

      {editing && (
        <form action={updateAction} className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/50 p-3">
          <input type="hidden" name="agentId" value={agent.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor={`name-${agent.id}`}>
              Name
            </label>
            <Input id={`name-${agent.id}`} name="name" defaultValue={agent.name} required className="w-40" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor={`phone-${agent.id}`}>
              Phone
            </label>
            <Input id={`phone-${agent.id}`} name="phone" defaultValue={agent.phone ?? ""} className="w-40" />
          </div>
          <Button type="submit" size="sm" disabled={updatePending}>
            {updatePending ? "Saving…" : "Save"}
          </Button>
          {updateState.error && <p className="w-full text-sm text-destructive">{updateState.error}</p>}
        </form>
      )}
    </li>
  );
}
