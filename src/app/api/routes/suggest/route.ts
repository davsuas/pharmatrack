import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import { suggestRoute } from "@/lib/routes/route-engine";
import type { HCPCandidate } from "@/lib/routes/types";

async function fetchDistanceMatrix(
  origin: { lat: number; lng: number },
  hcps: HCPCandidate[],
  apiKey: string
): Promise<Record<string, Record<string, number>>> {
  const matrix: Record<string, Record<string, number>> = {};

  if (!apiKey || hcps.length === 0) {
    // Fallback: uniform 1-minute travel time
    const all = ["msr", ...hcps.map((h) => h.hcpId)];
    for (const a of all) {
      matrix[a] = {};
      for (const b of all) matrix[a][b] = a === b ? 0 : 1;
    }
    return matrix;
  }

  const destinations = hcps.map((h) => `${h.lat},${h.lng}`).join("|");
  const originStr = `${origin.lat},${origin.lng}`;
  const allPoints = [originStr, ...hcps.map((h) => `${h.lat},${h.lng}`)];
  const pointsStr = allPoints.join("|");

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pointsStr)}&destinations=${encodeURIComponent(pointsStr)}&mode=driving&key=${apiKey}`;
  const res = await fetch(url);
  const json = await res.json();

  const ids = ["msr", ...hcps.map((h) => h.hcpId)];
  for (let i = 0; i < ids.length; i++) {
    matrix[ids[i]] = {};
    for (let j = 0; j < ids.length; j++) {
      const el = json.rows?.[i]?.elements?.[j];
      matrix[ids[i]][ids[j]] = el?.status === "OK" ? el.duration.value / 60 : 999;
    }
  }

  return matrix;
}

export async function POST(req: Request) {
  const role = await getUserRole();
  if (role !== "msr") return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const { msrLat, msrLng } = await req.json();
  const msrPosition = { lat: msrLat ?? 0, lng: msrLng ?? 0 };
  const today = new Date().toISOString().split("T")[0];

  const { data: existingApproved } = await supabase
    .from("routes")
    .select("id")
    .eq("msr_id", user.id)
    .eq("date", today)
    .eq("status", "approved")
    .maybeSingle();

  if (existingApproved) {
    return NextResponse.json({ error: "Route already approved for today" }, { status: 409 });
  }

  // Fetch MSR's HCPs with coordinates
  const { data: hcpRows } = await supabase
    .from("hcps")
    .select("hcp_id, name, specialty, address, lat, lng")
    .eq("msr_id", user.id)
    .not("lat", "is", null);

  const hcps: HCPCandidate[] = (hcpRows ?? []).map((h) => ({
    hcpId: h.hcp_id,
    name: h.name,
    specialty: h.specialty,
    address: h.address,
    tier: 2 as const,
    lat: h.lat,
    lng: h.lng,
  }));

  // Fetch tier assignments for MSR's HCPs to get tier and max calls
  const hcpIds = hcps.map((h) => h.hcpId);
  const { data: tierRows } = await supabase
    .from("hcp_tier_assignments")
    .select("hcp_id, tier, promotional_grids(calls_per_cycle)")
    .in("hcp_id", hcpIds);

  // Build maxCallsPerHCP and populate tier on each HCP
  const maxCallsPerHCP: Record<string, number> = {};
  const tierMap: Record<string, 1 | 2 | 3> = {};
  for (const row of tierRows ?? []) {
    tierMap[row.hcp_id] = row.tier as 1 | 2 | 3;
    const grids = Array.isArray(row.promotional_grids) ? row.promotional_grids : [row.promotional_grids];
    for (const g of grids) {
      if (g?.calls_per_cycle) {
        maxCallsPerHCP[row.hcp_id] = Math.max(maxCallsPerHCP[row.hcp_id] ?? 0, g.calls_per_cycle);
      }
    }
  }
  hcps.forEach((h) => { if (tierMap[h.hcpId]) h.tier = tierMap[h.hcpId]; });

  // Fetch call counts for this cycle
  const { data: activeCycle } = await supabase
    .from("cycles")
    .select("id, start_date, end_date")
    .eq("status", "active")
    .single();

  const callCountsThisCycle: Record<string, number> = {};
  if (activeCycle) {
    const { data: calls } = await supabase
      .from("route_stops")
      .select("hcp_id, routes(date, status)")
      .in("hcp_id", hcpIds);

    for (const stop of calls ?? []) {
      const route = Array.isArray(stop.routes) ? stop.routes[0] : stop.routes;
      if (route?.status === "completed" && route.date >= activeCycle.start_date && route.date <= activeCycle.end_date) {
        callCountsThisCycle[stop.hcp_id] = (callCountsThisCycle[stop.hcp_id] ?? 0) + 1;
      }
    }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
  const distanceMatrix = await fetchDistanceMatrix(msrPosition, hcps, apiKey);

  const stops = suggestRoute({ hcps, callCountsThisCycle, maxCallsPerHCP, distanceMatrix, msrPosition });

  // Save as suggested route
  const { data: route } = await supabase
    .from("routes")
    .upsert({ msr_id: user.id, date: today, status: "suggested" }, { onConflict: "msr_id,date,status" })
    .select()
    .single();

  if (route) {
    await supabase.from("route_stops").delete().eq("route_id", route.id);
    await supabase.from("route_stops").insert(
      stops.map((s) => ({ route_id: route.id, hcp_id: s.hcpId, position: s.position }))
    );
  }

  return NextResponse.json({ routeId: route?.id, stops });
}
