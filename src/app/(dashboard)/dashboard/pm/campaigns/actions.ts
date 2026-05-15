"use server";

import { revalidatePath } from "next/cache";
import { createCampaign, activateCampaign } from "@/lib/campaigns/campaign-service";

export type CampaignFormState = { error?: string; success?: boolean } | null;

export async function createCampaignAction(
  _prev: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const cycleId = formData.get("cycleId") as string;
  if (!cycleId) return { error: "Select a cycle." };

  const result = await createCampaign(cycleId);
  if ("type" in result) {
    const messages: Record<string, string> = {
      unauthorized: "Only PMs can create campaigns.",
      db_error: "type" in result && result.type === "db_error" ? result.message : "Database error.",
    };
    return { error: messages[result.type] ?? "Unknown error." };
  }

  revalidatePath("/dashboard/pm/campaigns");
  return { success: true };
}

export async function activateCampaignAction(
  campaignId: string
): Promise<CampaignFormState> {
  const result = await activateCampaign(campaignId);
  if ("type" in result) {
    const messages: Record<string, string> = {
      active_campaign_exists: "This cycle already has an active campaign.",
      unauthorized: "Only PMs can activate campaigns.",
      db_error: "type" in result && result.type === "db_error" ? result.message : "Database error.",
    };
    return { error: messages[result.type] ?? "Unknown error." };
  }

  revalidatePath("/dashboard/pm/campaigns");
  return { success: true };
}
