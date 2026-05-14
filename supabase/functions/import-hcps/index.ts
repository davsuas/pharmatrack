import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseCSVRow, isParseError } from "./parse.ts";

interface ImportResult {
  geocoded: number;
  failed: { hcp_id: string; reason: string }[];
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

async function geocode(
  address: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK" || !json.results?.[0]) return null;
  return json.results[0].geometry.location;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { productLineId, csvText } = await req.json();
  if (!productLineId || !csvText) {
    return new Response(JSON.stringify({ error: "productLineId and csvText required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "";
  const rawRows = parseCSV(csvText);
  const result: ImportResult = { geocoded: 0, failed: [] };

  for (const raw of rawRows) {
    const parsed = parseCSVRow(raw);

    if (isParseError(parsed)) {
      result.failed.push(parsed);
      continue;
    }

    const coords = await geocode(parsed.address, apiKey);

    if (!coords) {
      result.failed.push({ hcp_id: parsed.hcp_id, reason: "geocoding failed" });
      continue;
    }

    const { error: upsertError } = await supabase.from("hcps").upsert(
      {
        hcp_id: parsed.hcp_id,
        name: parsed.name,
        specialty: parsed.specialty,
        address: parsed.address,
        msr_id: parsed.msr_id || null,
        lat: coords.lat,
        lng: coords.lng,
        geocoded_at: new Date().toISOString(),
      },
      { onConflict: "hcp_id" }
    );

    if (upsertError) {
      result.failed.push({ hcp_id: parsed.hcp_id, reason: upsertError.message });
      continue;
    }

    await supabase.from("hcp_tier_assignments").upsert(
      { hcp_id: parsed.hcp_id, product_line_id: productLineId, tier: parsed.tier },
      { onConflict: "hcp_id,product_line_id" }
    );

    result.geocoded++;
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
