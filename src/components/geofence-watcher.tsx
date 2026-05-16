"use client";

import { useEffect, useRef, useState } from "react";
import { isWithinRadius, hasDeparted, findSameBuildingGroup } from "@/lib/geofence/detector";
import { enqueueEvent } from "@/lib/geofence/queue";
import type { GeofenceStop } from "@/lib/geofence/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function GeofenceWatcher() {
  const stopsRef = useRef<GeofenceStop[]>([]);
  const stopIdxRef = useRef(0);
  const arrivedRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  const [sameBuildingGroup, setSameBuildingGroup] = useState<GeofenceStop[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    async function init() {
      const res = await fetch("/api/routes/today");
      const data = await res.json();
      if (!data || data.status !== "approved" || !data.geofenceStops?.length) return;

      stopsRef.current = data.geofenceStops;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (geoPos) => handlePosition({ lat: geoPos.coords.latitude, lng: geoPos.coords.longitude }),
        (err) => console.error("[GeofenceWatcher] error:", err.message),
        { enableHighAccuracy: true, maximumAge: 10_000 }
      );
    }

    init();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function handlePosition(pos: { lat: number; lng: number }) {
    const stops = stopsRef.current;
    const idx = stopIdxRef.current;
    if (idx >= stops.length) return;

    const current = stops[idx];

    if (!arrivedRef.current) {
      if (isWithinRadius(pos, current)) {
        arrivedRef.current = true;
        void enqueueEvent({ type: "arrival", hcpId: current.hcpId, timestamp: Date.now(), position: pos });

        const group = findSameBuildingGroup(stops, current);
        if (group.length > 0) setSameBuildingGroup([current, ...group]);
      }
    } else {
      if (hasDeparted(pos, current)) {
        arrivedRef.current = false;
        void enqueueEvent({ type: "departure", hcpId: current.hcpId, timestamp: Date.now(), position: pos });
        stopIdxRef.current = idx + 1;
      }
    }
  }

  function selectSameBuilding(hcpId: string) {
    void enqueueEvent({
      type: "arrival",
      hcpId,
      timestamp: Date.now(),
      position: { lat: stopsRef.current[stopIdxRef.current]?.lat ?? 0, lng: stopsRef.current[stopIdxRef.current]?.lng ?? 0 },
    });
    setSameBuildingGroup([]);
  }

  if (sameBuildingGroup.length === 0) return null;

  return (
    <Dialog open onOpenChange={() => setSameBuildingGroup([])}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Multiple HCPs at this location</DialogTitle>
          <DialogDescription>
            Several HCPs share this building. Select the one you are visiting.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          {sameBuildingGroup.map((s) => (
            <Button key={s.hcpId} variant="outline" onClick={() => selectSameBuilding(s.hcpId)}>
              {s.hcpId}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
