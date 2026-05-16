import type { HCPCandidate, RouteEngineInput, RouteStop } from "./types";

const DEFAULT_TIER1_MIN = 3;
const DEFAULT_MAX_SLOTS = 10;

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}

function centroid(hcps: HCPCandidate[]): { lat: number; lng: number } {
  const lat = hcps.reduce((s, h) => s + h.lat, 0) / hcps.length;
  const lng = hcps.reduce((s, h) => s + h.lng, 0) / hcps.length;
  return { lat, lng };
}

function travelTime(
  from: string,
  to: string,
  matrix: Record<string, Record<string, number>>
): number {
  return matrix[from]?.[to] ?? Infinity;
}

export function suggestRoute(input: RouteEngineInput): RouteStop[] {
  const {
    hcps,
    callCountsThisCycle,
    maxCallsPerHCP,
    distanceMatrix,
    msrPosition,
    tier1MinSlots = DEFAULT_TIER1_MIN,
    maxSlots = DEFAULT_MAX_SLOTS,
  } = input;

  // 1. Exclude HCPs that have met their call frequency limit
  const eligible = hcps.filter((h) => {
    const done = callCountsThisCycle[h.hcpId] ?? 0;
    const max = maxCallsPerHCP[h.hcpId] ?? Infinity;
    return done < max;
  });

  const tier1 = eligible.filter((h) => h.tier === 1);
  const others = eligible.filter((h) => h.tier !== 1);

  // 2. Reserve Tier 1 slots — pick closest to MSR position
  const tier1Sorted = [...tier1].sort(
    (a, b) => haversineKm(msrPosition, a) - haversineKm(msrPosition, b)
  );
  const selectedTier1 = tier1Sorted.slice(0, tier1MinSlots);

  // 3. Fill remaining slots with geographically tightest cluster
  const remaining = maxSlots - selectedTier1.length;
  const pool = [...others, ...tier1Sorted.slice(tier1MinSlots)];

  const poolCentroid = pool.length > 0 ? centroid([...selectedTier1, ...pool]) : msrPosition;
  const clusterFill = [...pool]
    .sort((a, b) => haversineKm(poolCentroid, a) - haversineKm(poolCentroid, b))
    .slice(0, remaining);

  const selected = [...selectedTier1, ...clusterFill];

  // 4. Order via distance matrix (nearest-neighbour from MSR)
  const ordered: HCPCandidate[] = [];
  const unvisited = new Set(selected.map((h) => h.hcpId));
  let current = "msr";

  while (unvisited.size > 0) {
    let nearest = "";
    let minTime = Infinity;
    for (const id of unvisited) {
      const t = travelTime(current, id, distanceMatrix);
      if (t < minTime) { minTime = t; nearest = id; }
    }
    if (!nearest) break;
    ordered.push(selected.find((h) => h.hcpId === nearest)!);
    unvisited.delete(nearest);
    current = nearest;
  }

  return ordered.map((h, i) => ({
    hcpId: h.hcpId,
    name: h.name,
    specialty: h.specialty,
    address: h.address,
    tier: h.tier,
    position: i + 1,
  }));
}
