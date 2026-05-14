"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCycleAction, type FormState } from "./actions";

export function CreateCycleForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createCycleAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Cycle</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workingDayCount">Working days</Label>
              <Input
                id="workingDayCount"
                name="workingDayCount"
                type="number"
                min={1}
                max={31}
                defaultValue={22}
                required
              />
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-600">Cycle created.</p>
          )}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Creating…" : "Create cycle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
