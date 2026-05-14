import { describe, it, expect } from "vitest";
import { parseCSVRow, isParseError } from "./parse";

const validRow = {
  hcp_id: "HCP001",
  name: "Dr. Jane Smith",
  specialty: "Cardiology",
  address: "123 Main St, Buenos Aires",
  msr_id: "msr-uuid-1",
  tier: "2",
};

describe("parseCSVRow", () => {
  it("returns HCPRow for a valid row", () => {
    const result = parseCSVRow(validRow);

    expect(isParseError(result)).toBe(false);
    expect(result).toEqual({
      hcp_id: "HCP001",
      name: "Dr. Jane Smith",
      specialty: "Cardiology",
      address: "123 Main St, Buenos Aires",
      msr_id: "msr-uuid-1",
      tier: 2,
    });
  });

  it("returns ParseError when a required field is missing", () => {
    const result = parseCSVRow({ ...validRow, name: "" });

    expect(isParseError(result)).toBe(true);
    expect((result as { reason: string }).reason).toMatch(/missing required field: name/);
  });

  it("returns ParseError for invalid tier value", () => {
    const result = parseCSVRow({ ...validRow, tier: "4" });

    expect(isParseError(result)).toBe(true);
    expect((result as { reason: string }).reason).toMatch(/invalid tier/);
  });

  it("returns ParseError for non-numeric tier", () => {
    const result = parseCSVRow({ ...validRow, tier: "gold" });

    expect(isParseError(result)).toBe(true);
    expect((result as { reason: string }).reason).toMatch(/invalid tier/);
  });
});
