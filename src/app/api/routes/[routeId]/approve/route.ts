import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { routeId } = await params;
  const role = await getUserRole();
  if (role !== "msr") return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("routes")
    .update({ status: "approved" })
    .eq("id", routeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
