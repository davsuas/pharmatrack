"use server";

import { importHCPs } from "@/lib/hcps/hcp-service";
import type { ImportResult } from "@/lib/hcps/types";

export type ImportFormState = { result?: ImportResult; error?: string } | null;

export async function importHCPsAction(
  _prev: ImportFormState,
  formData: FormData
): Promise<ImportFormState> {
  const productLineId = formData.get("productLineId") as string;
  const file = formData.get("csvFile") as File | null;

  if (!productLineId) return { error: "Select a product line." };
  if (!file || file.size === 0) return { error: "Select a CSV file." };

  const csvText = await file.text();
  const outcome = await importHCPs(productLineId, csvText);

  if ("error" in outcome) return { error: outcome.error };
  return { result: outcome };
}
