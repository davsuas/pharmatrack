"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductLine } from "@/lib/hcps/types";
import { importHCPsAction, type ImportFormState } from "./actions";

export function ImportForm({ productLines }: { productLines: ProductLine[] }) {
  const [state, action, pending] = useActionState<ImportFormState, FormData>(
    importHCPsAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import HCP Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="productLineId">Product line</Label>
            <select
              id="productLineId"
              name="productLineId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select…</option>
              {productLines.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="csvFile">CSV file</Label>
            <Input
              id="csvFile"
              name="csvFile"
              type="file"
              accept=".csv,text/csv"
              required
            />
            <p className="text-xs text-muted-foreground">
              Required columns: hcp_id, name, specialty, address, msr_id, tier (1–3)
            </p>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Importing…" : "Import CSV"}
          </Button>
        </form>

        {state?.result && (
          <div className="flex flex-col gap-3 pt-2 border-t">
            <h3 className="font-semibold text-sm">Import result</h3>
            <div className="flex gap-3 flex-wrap">
              <Badge variant="default">{state.result.geocoded} geocoded</Badge>
              {state.result.warnings.length > 0 && (
                <Badge variant="outline">{state.result.warnings.length} warnings</Badge>
              )}
              {state.result.failed.length > 0 && (
                <Badge variant="destructive">{state.result.failed.length} failed</Badge>
              )}
            </div>
            {state.result.warnings.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-yellow-600">Warnings (imported without MSR assignment):</p>
                {state.result.warnings.map((w) => (
                  <p key={w.hcp_id} className="text-xs text-muted-foreground">
                    <span className="font-mono">{w.hcp_id}</span> — {w.reason}
                  </p>
                ))}
              </div>
            )}
            {state.result.failed.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-destructive">Failed rows:</p>
                {state.result.failed.map((f) => (
                  <p key={f.hcp_id} className="text-xs text-muted-foreground">
                    <span className="font-mono">{f.hcp_id}</span> — {f.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
