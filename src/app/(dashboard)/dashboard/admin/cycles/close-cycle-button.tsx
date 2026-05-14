"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { closeCycleAction } from "./actions";

export function CloseCycleButton({ cycleId }: { cycleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => { await closeCycleAction(cycleId); })}
    >
      {pending ? "Closing…" : "Close cycle"}
    </Button>
  );
}
