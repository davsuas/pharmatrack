export type RouteStatus = "suggested" | "approved" | "completed";

export interface HCPCandidate {
  hcpId: string;
  name: string;
  specialty: string;
  address: string;
  tier: 1 | 2 | 3;
  lat: number;
  lng: number;
}

export interface RouteStop {
  hcpId: string;
  name: string;
  specialty: string;
  address: string;
  tier: 1 | 2 | 3;
  position: number;
}

export interface RouteEngineInput {
  hcps: HCPCandidate[];
  callCountsThisCycle: Record<string, number>;   // hcp_id → calls completed
  maxCallsPerHCP: Record<string, number>;         // hcp_id → max(calls_per_cycle) across grids
  distanceMatrix: Record<string, Record<string, number>>; // hcp_id → hcp_id → minutes; "msr" key for origin
  msrPosition: { lat: number; lng: number };
  tier1MinSlots?: number;  // default 3
  maxSlots?: number;       // default 10
}

export interface Route {
  id: string;
  msrId: string;
  date: string;
  status: RouteStatus;
  stops: RouteStop[];
}
