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

  // Two requests to stay within the 100-element API limit (origins × destinations):
  //   request 1 — MSR → HCPs : 1 × N
  //   request 2 — HCPs → HCPs: N × N  (caller must ensure N ≤ 10)
  // TODO: support N > 10 by batching origins in groups of floor(100/N).
  const base = "https://maps.googleapis.com/maps/api/distancematrix/json";
  const hcpPoints = encodeURIComponent(hcps.map((h) => `${h.lat},${h.lng}`).join("|"));

  const [r1, r2] = await Promise.all([
    fetch(`${base}?origins=${encodeURIComponent(`${origin.lat},${origin.lng}`)}&destinations=${hcpPoints}&mode=driving&key=${apiKey}`),
    fetch(`${base}?origins=${hcpPoints}&destinations=${hcpPoints}&mode=driving&key=${apiKey}`),
  ]);
  const [j1, j2] = await Promise.all([r1.json(), r2.json()]);

  if (j1.status !== "OK") console.error("[DistanceMatrix] msr→hcps error:", j1.status, j1.error_message ?? "");
  if (j2.status !== "OK") console.error("[DistanceMatrix] hcps→hcps error:", j2.status, j2.error_message ?? "");

  matrix["msr"] = {};
  hcps.forEach((h, j) => {
    const el = j1.rows?.[0]?.elements?.[j];
    matrix["msr"][h.hcpId] = el?.status === "OK" ? el.duration.value / 60 : 999;
  });

  hcps.forEach((fromH, i) => {
    matrix[fromH.hcpId] = {};
    hcps.forEach((toH, j) => {
      const el = j2.rows?.[i]?.elements?.[j];
      matrix[fromH.hcpId][toH.hcpId] = el?.status === "OK" ? el.duration.value / 60 : 999;
    });
  });

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

  // Fetch tier assignments — simple select, no embed (hcp_tier_assignments has no FK to promotional_grids)
  const hcpIds = hcps.map((h) => h.hcpId);
  const { data: tierRows } = await supabase
    .from("hcp_tier_assignments")
    .select("hcp_id, tier, product_line_id")
    .in("hcp_id", hcpIds);

  const tierMap: Record<string, 1 | 2 | 3> = {};
  for (const row of tierRows ?? []) tierMap[row.hcp_id] = row.tier as 1 | 2 | 3;
  hcps.forEach((h) => { if (tierMap[h.hcpId]) h.tier = tierMap[h.hcpId]; });

  // Fetch active cycle + campaign to resolve calls_per_cycle from promotional_grids
  const { data: activeCycle } = await supabase
    .from("cycles")
    .select("id, start_date, end_date")
    .eq("status", "active")
    .single();

  const maxCallsPerHCP: Record<string, number> = {};
  if (activeCycle) {
    const { data: activeCampaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("cycle_id", activeCycle.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeCampaign) {
      const { data: gridRows } = await supabase
        .from("promotional_grids")
        .select("product_line_id, tier, calls_per_cycle")
        .eq("campaign_id", activeCampaign.id);

      // grid lookup: "productLineId:tier" → calls_per_cycle
      const gridLookup: Record<string, number> = {};
      for (const g of gridRows ?? []) gridLookup[`${g.product_line_id}:${g.tier}`] = g.calls_per_cycle;

      for (const ta of tierRows ?? []) {
        const calls = gridLookup[`${ta.product_line_id}:${ta.tier}`];
        if (calls) maxCallsPerHCP[ta.hcp_id] = Math.max(maxCallsPerHCP[ta.hcp_id] ?? 0, calls);
      }
    }
  }

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

  // Cap to 10 HCPs closest to MSR so the matrix stays within 10×10 = 100 elements.
  // TODO: remove cap once fetchDistanceMatrix batches requests for N > 10.
  const MAX_MATRIX_SIZE = 10;
  const candidateHCPs = [...hcps]
    .sort((a, b) =>
      Math.hypot(a.lat - msrPosition.lat, a.lng - msrPosition.lng) -
      Math.hypot(b.lat - msrPosition.lat, b.lng - msrPosition.lng)
    )
    .slice(0, MAX_MATRIX_SIZE);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
  const distanceMatrix = await fetchDistanceMatrix(msrPosition, candidateHCPs, apiKey);

  const stops = suggestRoute({ hcps: candidateHCPs, callCountsThisCycle, maxCallsPerHCP, distanceMatrix, msrPosition });

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
