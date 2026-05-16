import { describe, it, expect } from "vitest";
import { haversineMeters } from "./distance";

describe("haversineMeters", () => {
  it("returns ~0 for identical coordinates", () => {
    expect(haversineMeters({ lat: 4.711, lng: -74.072 }, { lat: 4.711, lng: -74.072 })).toBeCloseTo(0, 0);
  });

  it("returns ~157m for two points ~157m apart", () => {
    // Bogotá: move ~0.00143° lat ≈ 159m
    const a = { lat: 4.7110, lng: -74.0720 };
    const b = { lat: 4.7124, lng: -74.0720 };
    expect(haversineMeters(a, b)).toBeCloseTo(156, -1); // within 10m
  });

  it("is symmetric", () => {
    const a = { lat: 4.711, lng: -74.072 };
    const b = { lat: 4.720, lng: -74.080 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 5);
  });
});
