"use server";

import { revalidatePath } from "next/cache";
import { createCycle, closeCycle } from "@/lib/cycles/cycle-service";

export type FormState = { error?: string; success?: boolean } | null;

export async function createCycleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await createCycle({
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    workingDayCount: Number(formData.get("workingDayCount")),
  });

  if ("type" in result) {
    const messages: Record<string, string> = {
      active_cycle_exists: "A cycle is already active. Close it before creating a new one.",
      unauthorized: "Only admins can create cycles.",
      db_error: "type" in result && result.type === "db_error" ? result.message : "Database error.",
    };
    return { error: messages[result.type] ?? "Unknown error." };
  }

  revalidatePath("/dashboard/admin/cycles");
  return { success: true };
}

export async function closeCycleAction(cycleId: string): Promise<FormState> {
  const result = await closeCycle(cycleId);

  if ("type" in result) {
    return { error: "Failed to close cycle." };
  }

  revalidatePath("/dashboard/admin/cycles");
  return { success: true };
}
