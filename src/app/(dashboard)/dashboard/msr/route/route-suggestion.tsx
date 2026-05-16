"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { RouteStop } from "@/lib/routes/types";
import { buildMapsScriptUrl } from "@/lib/routes/maps-script-url";

const TIER_VARIANT = { 1: "default", 2: "secondary", 3: "outline" } as const;

function RouteMap({ stops }: { stops: RouteStop[] }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || stops.length === 0 || !window.google) return;

    const bounds = new google.maps.LatLngBounds();
    const geocoder = new google.maps.Geocoder();
    const map = new google.maps.Map(mapRef.current, { zoom: 12 });
    const path: google.maps.LatLng[] = [];

    let resolved = 0;
    const coords: (google.maps.LatLng | null)[] = new Array(stops.length).fill(null);

    stops.forEach((stop, i) => {
      geocoder.geocode({ address: stop.address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          coords[i] = loc;
          bounds.extend(loc);
          new google.maps.Marker({
            position: loc,
            map,
            label: String(stop.position),
            title: stop.name,
          });
        }
        resolved++;
        if (resolved === stops.length) {
          const ordered = coords.filter(Boolean) as google.maps.LatLng[];
          new google.maps.Polyline({ path: ordered, map, strokeColor: "#4F46E5" });
          map.fitBounds(bounds);
        }
      });
    });
  }, [stops]);

  return <div ref={mapRef} className="w-full h-64 rounded-lg border" />;
}

export function RouteSuggestion({ mapsApiKey }: { mapsApiKey: string }) {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  async function requestRoute() {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      ).catch(() => null);

      const res = await fetch("/api/routes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msrLat: pos?.coords.latitude ?? 0,
          msrLng: pos?.coords.longitude ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get route");
      setStops(data.stops);
      setRouteId(data.routeId);
      setApproved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function approveRoute() {
    if (!routeId) return;
    setApproving(true);
    await fetch(`/api/routes/${routeId}/approve`, { method: "POST" });
    setApproved(true);
    setApproving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Script
        src={buildMapsScriptUrl(mapsApiKey)}
        strategy="afterInteractive"
        onLoad={() => setMapsReady(true)}
      />
      <div className="flex gap-3 items-center">
        <Button onClick={requestRoute} disabled={loading}>
          {loading ? "Calculating…" : "Suggest today's route"}
        </Button>
        {stops.length > 0 && !approved && (
          <Button variant="outline" onClick={approveRoute} disabled={approving}>
            {approving ? "Saving…" : "Approve route"}
          </Button>
        )}
        {approved && <Badge variant="default">Route approved</Badge>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {stops.length > 0 && (
        <>
          {mapsReady && <RouteMap stops={stops} />}

          <div className="flex flex-col gap-2">
            {stops.map((stop) => (
              <Card key={stop.hcpId}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground font-mono w-5">{stop.position}.</span>
                    {stop.name}
                    <Badge variant={TIER_VARIANT[stop.tier]}>T{stop.tier}</Badge>
                  </CardTitle>
                  <CardDescription>{stop.specialty} · {stop.address}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
