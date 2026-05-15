"use server";

import { revalidatePath } from "next/cache";
import { upsertGrid } from "@/lib/campaigns/grid-service";

export type GridFormState = { error?: string; success?: boolean } | null;

export async function upsertGridAction(
  _prev: GridFormState,
  formData: FormData
): Promise<GridFormState> {
  const campaignId = formData.get("campaignId") as string;
  const productLineId = formData.get("productLineId") as string;
  const tier = Number(formData.get("tier")) as 1 | 2 | 3;
  const callsPerCycle = Number(formData.get("callsPerCycle"));
  const minVisitDurationMinutes = Number(formData.get("minVisitDurationMinutes"));
  const position1Product = formData.get("position1Product") as string;
  const position2Product = (formData.get("position2Product") as string) || undefined;
  const message = (formData.get("message") as string) || undefined;

  const result = await upsertGrid({
    campaignId,
    productLineId,
    tier,
    callsPerCycle,
    minVisitDurationMinutes,
    position1Product,
    position2Product,
    message,
  });

  if ("type" in result) {
    const messages: Record<string, string> = {
      missing_required_field:
        "type" in result && result.type === "missing_required_field"
          ? `${result.field} is required.`
          : "Missing required field.",
      unauthorized: "Only PMs can manage grids.",
      db_error: "type" in result && result.type === "db_error" ? result.message : "Database error.",
    };
    return { error: messages[result.type] ?? "Unknown error." };
  }

  revalidatePath(`/dashboard/pm/campaigns/${campaignId}/grids`);
  return { success: true };
}
