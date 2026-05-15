import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse as parseCSVText } from "https://deno.land/std@0.224.0/csv/parse.ts";
import { parseCSVRow, isParseError } from "./parse.ts";

interface ImportResult {
  geocoded: number;
  failed: { hcp_id: string; reason: string }[];
  warnings: { hcp_id: string; reason: string }[];
}

function parseCSV(text: string): Record<string, string>[] {
  // skipFirstRow uses the header row as object keys; handles quoted fields with commas
  return parseCSVText(text.trim(), { skipFirstRow: true }) as Record<string, string>[];
}

interface GeocodeResult {
  coords: { lat: number; lng: number } | null;
  error: string | null;
}

async function geocode(address: string, apiKey: string): Promise<GeocodeResult> {
  if (!apiKey) {
    return { coords: null, error: "GOOGLE_MAPS_API_KEY env var not set" };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  let json: { status: string; error_message?: string; results?: { geometry: { location: { lat: number; lng: number } } }[] };
  try {
    const res = await fetch(url);
    json = await res.json();
  } catch (err) {
    return { coords: null, error: `geocode fetch failed: ${err}` };
  }

  if (json.status !== "OK") {
    // Google returns status codes like REQUEST_DENIED, INVALID_REQUEST, ZERO_RESULTS, etc.
    const detail = json.error_message ? ` — ${json.error_message}` : "";
    return { coords: null, error: `geocode status ${json.status}${detail}` };
  }

  if (!json.results?.[0]) {
    return { coords: null, error: "geocode returned no results" };
  }

  return { coords: json.results[0].geometry.location, error: null };
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
  console.log(`GOOGLE_MAPS_API_KEY present: ${!!apiKey}`);

  const rawRows = parseCSV(csvText);
  console.log(`Parsed ${rawRows.length} rows from CSV`);
  const result: ImportResult = { geocoded: 0, failed: [], warnings: [] };

  for (const raw of rawRows) {
    const parsed = parseCSVRow(raw);

    if (isParseError(parsed)) {
      result.failed.push(parsed);
      continue;
    }

    const { coords, error: geocodeError } = await geocode(parsed.address, apiKey);
    console.log(`Geocode [${parsed.hcp_id}] "${parsed.address}": ${geocodeError ?? "OK"}`);

    if (!coords) {
      result.failed.push({ hcp_id: parsed.hcp_id, reason: geocodeError ?? "geocoding failed" });
      continue;
    }

    const hcpPayload = {
      hcp_id: parsed.hcp_id,
      name: parsed.name,
      specialty: parsed.specialty,
      address: parsed.address,
      msr_id: parsed.msr_id || null,
      lat: coords.lat,
      lng: coords.lng,
      geocoded_at: new Date().toISOString(),
    };

    let { error: upsertError } = await supabase
      .from("hcps")
      .upsert(hcpPayload, { onConflict: "hcp_id" });

    // msr_id references a user that doesn't exist yet — import without assignment
    if (upsertError?.message.includes("hcps_msr_id_fkey")) {
      result.warnings.push({
        hcp_id: parsed.hcp_id,
        reason: `msr_id ${parsed.msr_id} not found in auth.users — imported without MSR assignment`,
      });
      const retry = await supabase
        .from("hcps")
        .upsert({ ...hcpPayload, msr_id: null }, { onConflict: "hcp_id" });
      upsertError = retry.error;
    }

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
