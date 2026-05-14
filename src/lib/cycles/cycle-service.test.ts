import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Cycle } from "./types";

const { mockGetUser, mockSelect, mockInsert, mockGetUserRole } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockGetUserRole: vi.fn(),
}));

vi.mock("@/lib/auth/get-user-role", () => ({
  getUserRole: mockGetUserRole,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    }),
  }),
}));

import { createCycle, closeCycle } from "./cycle-service";

const adminUser = { id: "admin-1" };
const input = { startDate: "2026-06-01", endDate: "2026-06-30", workingDayCount: 22 };

describe("createCycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns new active cycle when no active cycle exists", async () => {
    mockGetUserRole.mockResolvedValue("admin");
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });
    // no active cycle found
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    });
    const dbRow = {
      id: "cycle-1",
      start_date: input.startDate,
      end_date: input.endDate,
      working_day_count: input.workingDayCount,
      status: "active",
      created_by: adminUser.id,
      created_at: "2026-05-14T00:00:00Z",
    };
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: dbRow }),
      }),
    });

    const result = await createCycle(input);

    expect(result).toEqual({
      id: "cycle-1",
      startDate: input.startDate,
      endDate: input.endDate,
      workingDayCount: input.workingDayCount,
      status: "active",
      createdBy: adminUser.id,
      createdAt: "2026-05-14T00:00:00Z",
    });
  });

  it("rejects when an active cycle already exists", async () => {
    mockGetUserRole.mockResolvedValue("admin");
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "existing-cycle" } }),
      }),
    });

    const result = await createCycle(input);

    expect(result).toEqual({ type: "active_cycle_exists" });
  });

  it("returns unauthorized when called by non-admin", async () => {
    mockGetUserRole.mockResolvedValue("msr");

    const result = await createCycle(input);

    expect(result).toEqual({ type: "unauthorized" });
  });
});

describe("closeCycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transitions active cycle to completed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });
    const closedCycle = {
      id: "cycle-1",
      start_date: "2026-06-01",
      end_date: "2026-06-30",
      working_day_count: 22,
      status: "completed",
      created_by: adminUser.id,
      created_at: "2026-05-14T00:00:00Z",
    };
    const mockSingle = vi.fn().mockResolvedValue({ data: closedCycle });
    const mockSelectAfterUpdate = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: mockSelectAfterUpdate,
      }),
    });
    vi.mocked(await import("@/lib/supabase/server").then(m => m.createClient))
      .mockResolvedValueOnce({
        auth: { getUser: mockGetUser },
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      } as never);

    const result = await closeCycle("cycle-1");

    expect(result).toEqual({
      id: "cycle-1",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      workingDayCount: 22,
      status: "completed",
      createdBy: adminUser.id,
      createdAt: "2026-05-14T00:00:00Z",
    });
  });
});
