import { describe, it, expect } from "vitest";
import { suggestRoute } from "./route-engine";
import type { HCPCandidate, RouteEngineInput } from "./types";

// Helpers to build test fixtures
function hcp(id: string, tier: 1 | 2 | 3, lat = 0, lng = 0): HCPCandidate {
  return { hcpId: id, name: `HCP ${id}`, specialty: "Cardiology", address: `Addr ${id}`, tier, lat, lng };
}

function matrix(ids: string[]): Record<string, Record<string, number>> {
  const all = ["msr", ...ids];
  return Object.fromEntries(
    all.map((a) => [a, Object.fromEntries(all.map((b) => [b, a === b ? 0 : 1]))])
  );
}

const msrPosition = { lat: 0, lng: 0 };

describe("suggestRoute — frequency exclusion", () => {
  it("excludes HCPs that have met their max calls_per_cycle", () => {
    const hcps = [hcp("A", 1), hcp("B", 2), hcp("C", 3)];
    const input: RouteEngineInput = {
      hcps,
      callCountsThisCycle: { A: 4 },
      maxCallsPerHCP: { A: 4, B: 4, C: 4 },
      distanceMatrix: matrix(["A", "B", "C"]),
      msrPosition,
    };

    const result = suggestRoute(input);

    expect(result.map((s) => s.hcpId)).not.toContain("A");
    expect(result.map((s) => s.hcpId)).toContain("B");
    expect(result.map((s) => s.hcpId)).toContain("C");
  });
});

describe("suggestRoute — max across multiple grids", () => {
  it("uses max(calls_per_cycle) when HCP appears in multiple product line grids", () => {
    // HCP "X" has grids requiring 4 and 6 calls — threshold is 6
    const hcps = [hcp("X", 2), hcp("Y", 2)];
    const input: RouteEngineInput = {
      hcps,
      callCountsThisCycle: { X: 5 },   // 5 done, max is 6 → still eligible
      maxCallsPerHCP: { X: 6, Y: 4 },
      distanceMatrix: matrix(["X", "Y"]),
      msrPosition,
    };

    const result = suggestRoute(input);

    expect(result.map((s) => s.hcpId)).toContain("X");
  });

  it("excludes HCP when count meets the max across grids", () => {
    const hcps = [hcp("X", 2), hcp("Y", 2)];
    const input: RouteEngineInput = {
      hcps,
      callCountsThisCycle: { X: 6 },   // 6 done, max is 6 → excluded
      maxCallsPerHCP: { X: 6, Y: 4 },
      distanceMatrix: matrix(["X", "Y"]),
      msrPosition,
    };

    const result = suggestRoute(input);

    expect(result.map((s) => s.hcpId)).not.toContain("X");
  });
});

describe("suggestRoute — Tier 1 minimum slots", () => {
  it("always reserves up to tier1MinSlots Tier 1 HCPs", () => {
    // 5 Tier 1, 5 Tier 2 — result must include at least 3 Tier 1
    const hcps = [
      hcp("T1a", 1), hcp("T1b", 1), hcp("T1c", 1), hcp("T1d", 1), hcp("T1e", 1),
      hcp("T2a", 2), hcp("T2b", 2), hcp("T2c", 2), hcp("T2d", 2), hcp("T2e", 2),
    ];
    const input: RouteEngineInput = {
      hcps,
      callCountsThisCycle: {},
      maxCallsPerHCP: Object.fromEntries(hcps.map((h) => [h.hcpId, 4])),
      distanceMatrix: matrix(hcps.map((h) => h.hcpId)),
      msrPosition,
      tier1MinSlots: 3,
      maxSlots: 10,
    };

    const result = suggestRoute(input);
    const tier1Count = result.filter((s) => s.tier === 1).length;

    expect(tier1Count).toBeGreaterThanOrEqual(3);
  });

  it("includes all available Tier 1 when fewer than tier1MinSlots exist", () => {
    const hcps = [hcp("T1a", 1), hcp("T2a", 2), hcp("T2b", 2)];
    const input: RouteEngineInput = {
      hcps,
      callCountsThisCycle: {},
      maxCallsPerHCP: { T1a: 4, T2a: 4, T2b: 4 },
      distanceMatrix: matrix(["T1a", "T2a", "T2b"]),
      msrPosition,
      tier1MinSlots: 3,
    };

    const result = suggestRoute(input);
    const tier1Count = result.filter((s) => s.tier === 1).length;

    expect(tier1Count).toBe(1);
  });
});

describe("suggestRoute — ordering", () => {
  it("returns stops with sequential position numbers starting at 1", () => {
    const hcps = [hcp("A", 1), hcp("B", 2), hcp("C", 3)];
    const input: RouteEngineInput = {
      hcps,
      callCountsThisCycle: {},
      maxCallsPerHCP: { A: 4, B: 4, C: 4 },
      distanceMatrix: matrix(["A", "B", "C"]),
      msrPosition,
    };

    const result = suggestRoute(input);

    expect(result.map((s) => s.position)).toEqual(
      Array.from({ length: result.length }, (_, i) => i + 1)
    );
  });

  it("respects distance matrix — picks nearer stop first", () => {
    // B is 1 min from MSR, C is 10 min — B should come first
    const hcps = [hcp("B", 2, 0, 0.01), hcp("C", 2, 0, 1)];
    const dm: Record<string, Record<string, number>> = {
      msr: { B: 1, C: 10 },
      B:   { msr: 1, C: 9 },
      C:   { msr: 10, B: 9 },
    };
    const input: RouteEngineInput = {
      hcps,
      callCountsThisCycle: {},
      maxCallsPerHCP: { B: 4, C: 4 },
      distanceMatrix: dm,
      msrPosition,
      tier1MinSlots: 0,
    };

    const result = suggestRoute(input);

    expect(result[0].hcpId).toBe("B");
    expect(result[1].hcpId).toBe("C");
  });
});
