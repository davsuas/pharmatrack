"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import type { Campaign, CampaignError, CampaignStatus } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCampaign(row: Record<string, any>): Campaign {
  return {
    id: row.id,
    cycleId: row.cycle_id,
    pmId: row.pm_id,
    status: row.status as CampaignStatus,
    createdAt: row.created_at,
  };
}

export async function createCampaign(
  cycleId: string
): Promise<Campaign | CampaignError> {
  const role = await getUserRole();
  if (role !== "pm") return { type: "unauthorized" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { type: "unauthorized" };

  const { data, error } = await supabase
    .from("campaigns")
    .insert({ cycle_id: cycleId, pm_id: user.id })
    .select()
    .single();

  if (error) return { type: "db_error", message: error.message };
  return mapCampaign(data);
}

export async function activateCampaign(
  campaignId: string
): Promise<Campaign | CampaignError> {
  const role = await getUserRole();
  if (role !== "pm") return { type: "unauthorized" };

  const supabase = await createClient();

  // Fetch the campaign's cycleId first, then check for an existing active campaign
  const { data: target } = await supabase
    .from("campaigns")
    .select("cycle_id")
    .eq("id", campaignId)
    .single();

  if (target) {
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id")
      .eq("status", "active")
      .eq("cycle_id", target.cycle_id)
      .single();

    if (existing) return { type: "active_campaign_exists" };
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update({ status: "active" })
    .eq("id", campaignId)
    .select()
    .single();

  if (error) return { type: "db_error", message: error.message };
  return mapCampaign(data);
}

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapCampaign);
}
