export type CampaignStatus = "draft" | "active" | "closed";

export interface Campaign {
  id: string;
  cycleId: string;
  pmId: string;
  status: CampaignStatus;
  createdAt: string;
}

export interface PromotionalGrid {
  id: string;
  campaignId: string;
  productLineId: string;
  tier: 1 | 2 | 3;
  callsPerCycle: number;
  minVisitDurationMinutes: number;
  position1Product: string;
  position2Product: string | null;
  message: string | null;
}

export interface GridInput {
  campaignId: string;
  productLineId: string;
  tier: 1 | 2 | 3;
  callsPerCycle: number;
  minVisitDurationMinutes: number;
  position1Product: string;
  position2Product?: string;
  message?: string;
}

export type CampaignError =
  | { type: "active_campaign_exists" }
  | { type: "unauthorized" }
  | { type: "db_error"; message: string };

export type GridError =
  | { type: "missing_required_field"; field: string }
  | { type: "unauthorized" }
  | { type: "db_error"; message: string };
