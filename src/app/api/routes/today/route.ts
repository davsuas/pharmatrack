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

  // Prefer approved over suggested ('approved' < 'suggested' alphabetically)
  const { data: route } = await supabase
    .from("routes")
    .select("id, status")
    .eq("msr_id", user.id)
    .eq("date", today)
    .in("status", ["suggested", "approved"])
    .order("status", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!route) return NextResponse.json(null);

  const { data: stopRows } = await supabase
    .from("route_stops")
    .select("position, hcp_id, hcps(name, specialty, address)")
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

  return NextResponse.json({ routeId: route.id, status: route.status, stops });
}
