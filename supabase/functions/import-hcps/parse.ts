export interface HCPRow {
  hcp_id: string;
  name: string;
  specialty: string;
  address: string;
  msr_id: string;
  tier: 1 | 2 | 3;
}

export interface ParseError {
  hcp_id: string;
  reason: string;
}

const REQUIRED_FIELDS = ["hcp_id", "name", "specialty", "address", "msr_id", "tier"] as const;
const VALID_TIERS = [1, 2, 3] as const;

export function parseCSVRow(raw: Record<string, string>): HCPRow | ParseError {
  const hcp_id = raw["hcp_id"]?.trim() ?? "";

  for (const field of REQUIRED_FIELDS) {
    if (!raw[field]?.trim()) {
      return { hcp_id, reason: `missing required field: ${field}` };
    }
  }

  const tierNum = Number(raw["tier"]);
  if (!VALID_TIERS.includes(tierNum as 1 | 2 | 3)) {
    return { hcp_id, reason: `invalid tier: ${raw["tier"]} (must be 1, 2, or 3)` };
  }

  return {
    hcp_id,
    name: raw["name"].trim(),
    specialty: raw["specialty"].trim(),
    address: raw["address"].trim(),
    msr_id: raw["msr_id"].trim(),
    tier: tierNum as 1 | 2 | 3,
  };
}

export function isParseError(result: HCPRow | ParseError): result is ParseError {
  return "reason" in result;
}
