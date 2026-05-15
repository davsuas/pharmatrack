"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductLine } from "@/lib/hcps/types";
import { upsertGridAction, type GridFormState } from "./actions";

const TIERS = [1, 2, 3] as const;

export function GridForm({
  campaignId,
  productLines,
}: {
  campaignId: string;
  productLines: ProductLine[];
}) {
  const [state, action, pending] = useActionState<GridFormState, FormData>(
    upsertGridAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add / update grid row</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="campaignId" value={campaignId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productLineId">Product line</Label>
              <select
                id="productLineId"
                name="productLineId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {productLines.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tier">Tier</Label>
              <select
                id="tier"
                name="tier"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>Tier {t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="callsPerCycle">Calls per cycle</Label>
              <Input id="callsPerCycle" name="callsPerCycle" type="number" min={1} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minVisitDurationMinutes">Min visit duration (min)</Label>
              <Input id="minVisitDurationMinutes" name="minVisitDurationMinutes" type="number" min={1} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="position1Product">Position 1 product</Label>
              <Input id="position1Product" name="position1Product" type="text" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="position2Product">Position 2 product <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="position2Product" name="position2Product" type="text" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">Message <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="message" name="message" type="text" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-600">Grid row saved.</p>}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Save grid row"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
