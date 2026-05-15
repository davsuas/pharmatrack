import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GridInput } from "./types";

const { mockGetUserRole, mockUpsert } = vi.hoisted(() => ({
  mockGetUserRole: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock("@/lib/auth/get-user-role", () => ({ getUserRole: mockGetUserRole }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
  }),
}));

import { upsertGrid } from "./grid-service";

const validInput: GridInput = {
  campaignId: "campaign-1",
  productLineId: "pl-1",
  tier: 2,
  callsPerCycle: 4,
  minVisitDurationMinutes: 15,
  position1Product: "Product A",
};

describe("upsertGrid", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns grid for valid input", async () => {
    mockGetUserRole.mockResolvedValue("pm");
    const dbRow = {
      id: "grid-1",
      campaign_id: validInput.campaignId,
      product_line_id: validInput.productLineId,
      tier: validInput.tier,
      calls_per_cycle: validInput.callsPerCycle,
      min_visit_duration_minutes: validInput.minVisitDurationMinutes,
      position_1_product: validInput.position1Product,
      position_2_product: null,
      message: null,
    };
    mockUpsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: dbRow }),
      }),
    });

    const result = await upsertGrid(validInput);

    expect(result).toEqual({
      id: "grid-1",
      campaignId: validInput.campaignId,
      productLineId: validInput.productLineId,
      tier: 2,
      callsPerCycle: 4,
      minVisitDurationMinutes: 15,
      position1Product: "Product A",
      position2Product: null,
      message: null,
    });
  });

  it("returns error when calls_per_cycle is missing", async () => {
    mockGetUserRole.mockResolvedValue("pm");
    const input = { ...validInput, callsPerCycle: 0 };

    const result = await upsertGrid(input);

    expect(result).toEqual({ type: "missing_required_field", field: "callsPerCycle" });
  });

  it("returns unauthorized for non-PM role", async () => {
    mockGetUserRole.mockResolvedValue("msr");

    const result = await upsertGrid(validInput);

    expect(result).toEqual({ type: "unauthorized" });
  });
});
