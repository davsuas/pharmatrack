"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { activateCampaignAction } from "./actions";

export function ActivateCampaignButton({ campaignId }: { campaignId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await activateCampaignAction(campaignId);
            if (result?.error) setError(result.error);
          })
        }
      >
        {pending ? "Activating…" : "Activate"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
