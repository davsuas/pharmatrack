import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockSelect, mockInsert, mockUpdate, mockGetUserRole } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockGetUserRole: vi.fn(),
}));

vi.mock("@/lib/auth/get-user-role", () => ({ getUserRole: mockGetUserRole }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    }),
  }),
}));

import { createCampaign, activateCampaign } from "./campaign-service";

const pmUser = { id: "pm-1" };
const cycleId = "cycle-uuid-1";
const campaignId = "campaign-1";

const draftDbRow = {
  id: campaignId,
  cycle_id: cycleId,
  pm_id: pmUser.id,
  status: "draft",
  created_at: "2026-05-15T00:00:00Z",
};

const activatedDbRow = { ...draftDbRow, status: "active" };

describe("createCampaign", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns unauthorized for non-PM role", async () => {
    mockGetUserRole.mockResolvedValue("msr");

    const result = await createCampaign(cycleId);

    expect(result).toEqual({ type: "unauthorized" });
  });

  it("returns new draft campaign for a PM with given cycleId", async () => {
    mockGetUserRole.mockResolvedValue("pm");
    mockGetUser.mockResolvedValue({ data: { user: pmUser } });

    const dbRow = {
      id: "campaign-1",
      cycle_id: cycleId,
      pm_id: pmUser.id,
      status: "draft",
      created_at: "2026-05-15T00:00:00Z",
    };
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: dbRow }),
      }),
    });

    const result = await createCampaign(cycleId);

    expect(result).toEqual({
      id: campaignId,
      cycleId,
      pmId: pmUser.id,
      status: "draft",
      createdAt: "2026-05-15T00:00:00Z",
    });
  });
});

describe("activateCampaign", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transitions draft campaign to active", async () => {
    mockGetUserRole.mockResolvedValue("pm");
    // 1st select: fetch target campaign's cycle_id
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { cycle_id: cycleId } }),
      }),
    });
    // 2nd select: no active campaign on this cycle
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: activatedDbRow }),
        }),
      }),
    });

    const result = await activateCampaign(campaignId);

    expect(result).toEqual({
      id: campaignId,
      cycleId,
      pmId: pmUser.id,
      status: "active",
      createdAt: "2026-05-15T00:00:00Z",
    });
  });

  it("rejects when an active campaign already exists on the same cycle", async () => {
    mockGetUserRole.mockResolvedValue("pm");
    // 1st select: fetch target campaign's cycle_id
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { cycle_id: cycleId } }),
      }),
    });
    // 2nd select: existing active campaign found
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "existing-campaign" } }),
        }),
      }),
    });

    const result = await activateCampaign(campaignId);

    expect(result).toEqual({ type: "active_campaign_exists" });
  });
});
