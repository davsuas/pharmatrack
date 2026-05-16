import { describe, it, expect } from "vitest";
import { isWithinRadius, hasDeparted, findSameBuildingGroup } from "./detector";

const stop = { hcpId: "hcp-1", lat: 4.7110, lng: -74.0720 };

describe("isWithinRadius", () => {
  it("returns true when position is within default 50m radius", () => {
    // ~20m north
    expect(isWithinRadius({ lat: 4.7112, lng: -74.0720 }, stop)).toBe(true);
  });

  it("returns false when position is outside default 50m radius", () => {
    // ~160m north
    expect(isWithinRadius({ lat: 4.7124, lng: -74.0720 }, stop)).toBe(false);
  });

  it("respects a custom radius", () => {
    // ~160m north — inside 200m radius, outside 50m
    const pos = { lat: 4.7124, lng: -74.0720 };
    expect(isWithinRadius(pos, stop, 200)).toBe(true);
    expect(isWithinRadius(pos, stop, 50)).toBe(false);
  });
});

describe("hasDeparted", () => {
  it("returns true when position is outside radius after arrival", () => {
    // ~160m away — outside 50m radius
    expect(hasDeparted({ lat: 4.7124, lng: -74.0720 }, stop)).toBe(true);
  });

  it("returns false when still within radius", () => {
    // ~20m away — still inside
    expect(hasDeparted({ lat: 4.7112, lng: -74.0720 }, stop)).toBe(false);
  });

  it("uses the same radius as arrival so boundary is consistent", () => {
    const onBoundary = { lat: 4.7114, lng: -74.0720 }; // ~44m — inside 50m
    expect(hasDeparted(onBoundary, stop)).toBe(false);
    expect(hasDeparted(onBoundary, stop, 40)).toBe(true);
  });
});

describe("findSameBuildingGroup", () => {
  const arrived = { hcpId: "hcp-1", lat: 4.7110, lng: -74.0720 };
  const colocated = { hcpId: "hcp-2", lat: 4.71101, lng: -74.07201 }; // <2m away
  const distant = { hcpId: "hcp-3", lat: 4.7124, lng: -74.0720 };    // ~160m away

  it("returns other stops within radius of the arrived stop", () => {
    const group = findSameBuildingGroup([arrived, colocated, distant], arrived);
    expect(group.map((s) => s.hcpId)).toContain("hcp-2");
    expect(group.map((s) => s.hcpId)).not.toContain("hcp-3");
  });

  it("excludes the arrived stop itself from the group", () => {
    const group = findSameBuildingGroup([arrived, colocated], arrived);
    expect(group.map((s) => s.hcpId)).not.toContain("hcp-1");
  });

  it("returns empty array when no other HCPs share the building", () => {
    const group = findSameBuildingGroup([arrived, distant], arrived);
    expect(group).toHaveLength(0);
  });
});
