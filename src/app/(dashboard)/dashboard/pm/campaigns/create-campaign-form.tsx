"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Cycle } from "@/lib/cycles/types";
import { createCampaignAction, type CampaignFormState } from "./actions";

export function CreateCampaignForm({ cycles }: { cycles: Cycle[] }) {
  const [state, action, pending] = useActionState<CampaignFormState, FormData>(
    createCampaignAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cycleId">Cycle</Label>
            <select
              id="cycleId"
              name="cycleId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select active cycle…</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.startDate} → {c.endDate} ({c.status})
                </option>
              ))}
            </select>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-600">Campaign created.</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Creating…" : "Create campaign"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
