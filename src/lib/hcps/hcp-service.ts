"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import type { ImportResult, ProductLine } from "./types";

export async function getProductLines(): Promise<ProductLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_lines")
    .select("id, name")
    .order("name");
  if (error || !data) return [];
  return data as ProductLine[];
}

export async function importHCPs(
  productLineId: string,
  csvText: string
): Promise<ImportResult | { error: string }> {
  const role = await getUserRole();
  if (role !== "admin") return { error: "unauthorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("import-hcps", {
    body: { productLineId, csvText },
  });

  if (error) return { error: error.message };
  return data as ImportResult;
}
