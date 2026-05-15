"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import type { PromotionalGrid, GridInput, GridError } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGrid(row: Record<string, any>): PromotionalGrid {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    productLineId: row.product_line_id,
    tier: row.tier,
    callsPerCycle: row.calls_per_cycle,
    minVisitDurationMinutes: row.min_visit_duration_minutes,
    position1Product: row.position_1_product,
    position2Product: row.position_2_product ?? null,
    message: row.message ?? null,
  };
}

export async function upsertGrid(
  input: GridInput
): Promise<PromotionalGrid | GridError> {
  const role = await getUserRole();
  if (role !== "pm") return { type: "unauthorized" };

  if (!input.callsPerCycle) {
    return { type: "missing_required_field", field: "callsPerCycle" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotional_grids")
    .upsert(
      {
        campaign_id: input.campaignId,
        product_line_id: input.productLineId,
        tier: input.tier,
        calls_per_cycle: input.callsPerCycle,
        min_visit_duration_minutes: input.minVisitDurationMinutes,
        position_1_product: input.position1Product,
        position_2_product: input.position2Product ?? null,
        message: input.message ?? null,
      },
      { onConflict: "campaign_id,product_line_id,tier" }
    )
    .select()
    .single();

  if (error) return { type: "db_error", message: error.message };
  return mapGrid(data);
}

export async function getGridsForCampaign(
  campaignId: string
): Promise<PromotionalGrid[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotional_grids")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("product_line_id")
    .order("tier");

  if (error || !data) return [];
  return data.map(mapGrid);
}
