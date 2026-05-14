"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import type { Cycle, CreateCycleInput, CycleError, CycleStatus } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCycle(row: Record<string, any>): Cycle {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    workingDayCount: row.working_day_count,
    status: row.status as CycleStatus,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function createCycle(
  input: CreateCycleInput
): Promise<Cycle | CycleError> {
  const role = await getUserRole();
  if (role !== "admin") return { type: "unauthorized" };

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { type: "unauthorized" };

  const { data: existing } = await supabase
    .from("cycles")
    .select("id")
    .eq("status", "active")
    .single();

  if (existing) return { type: "active_cycle_exists" };

  const { data, error } = await supabase
    .from("cycles")
    .insert({
      start_date: input.startDate,
      end_date: input.endDate,
      working_day_count: input.workingDayCount,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { type: "db_error", message: error.message };
  return mapCycle(data);
}

export async function closeCycle(cycleId: string): Promise<Cycle | CycleError> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { type: "unauthorized" };

  const { data, error } = await supabase
    .from("cycles")
    .update({ status: "completed" })
    .eq("id", cycleId)
    .select()
    .single();

  if (error) return { type: "db_error", message: error.message };
  return mapCycle(data);
}

export async function getCycles(): Promise<Cycle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapCycle);
}
