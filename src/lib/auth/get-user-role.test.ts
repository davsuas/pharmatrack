import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Role } from "./get-user-role";

const { mockGetUser, mockSingle } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSingle: vi.fn(),
}));

vi.mock("@/src/utils/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({ single: mockSingle }),
      }),
    }),
  }),
}));

import { getUserRole } from "./get-user-role";

describe("getUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const roles: Role[] = ["admin", "dm", "pm", "msr"];

  for (const role of roles) {
    it(`returns "${role}" for a ${role} user`, async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      mockSingle.mockResolvedValue({ data: { role } });
      expect(await getUserRole()).toBe(role);
    });
  }

  it("returns null when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await getUserRole()).toBeNull();
  });
});
