import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import type { RouteStop } from "@/lib/routes/types";

export async function GET() {
  const role = await getUserRole();
  if (role !== "msr") return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const today = new Date().toISOString().split("T")[0];

  // Postgres enum order: suggested=0, approved=1 — can't rely on ORDER BY.
  // Explicitly prefer approved, fall back to suggested.
  const { data: approved } = await supabase
    .from("routes")
    .select("id, status")
    .eq("msr_id", user.id)
    .eq("date", today)
    .eq("status", "approved")
    .maybeSingle();

  const route = approved ?? await (async () => {
    const { data } = await supabase
      .from("routes")
      .select("id, status")
      .eq("msr_id", user.id)
      .eq("date", today)
      .eq("status", "suggested")
      .maybeSingle();
    return data;
  })();

  if (!route) return NextResponse.json(null);

  const { data: stopRows } = await supabase
    .from("route_stops")
    .select("position, hcp_id, hcps(name, specialty, address, lat, lng)")
    .eq("route_id", route.id)
    .order("position");

  const hcpIds = (stopRows ?? []).map((s) => s.hcp_id);
  const { data: tierRows } = await supabase
    .from("hcp_tier_assignments")
    .select("hcp_id, tier")
    .in("hcp_id", hcpIds);

  const tierMap: Record<string, 1 | 2 | 3> = {};
  for (const r of tierRows ?? []) tierMap[r.hcp_id] = r.tier as 1 | 2 | 3;

  const stops: RouteStop[] = (stopRows ?? []).map((s) => {
    const hcp = Array.isArray(s.hcps) ? s.hcps[0] : s.hcps;
    return {
      hcpId: s.hcp_id,
      name: hcp?.name ?? "",
      specialty: hcp?.specialty ?? "",
      address: hcp?.address ?? "",
      tier: tierMap[s.hcp_id] ?? 2,
      position: s.position,
    };
  });

  const geofenceStops = (stopRows ?? []).map((s) => {
    const hcp = Array.isArray(s.hcps) ? s.hcps[0] : s.hcps;
    return { hcpId: s.hcp_id, lat: hcp?.lat ?? 0, lng: hcp?.lng ?? 0 };
  });

  return NextResponse.json({ routeId: route.id, status: route.status, stops, geofenceStops });
}
