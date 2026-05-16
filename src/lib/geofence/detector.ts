import type { Position, GeofenceStop } from "./types";
import { haversineMeters } from "./distance";

const DEFAULT_RADIUS_M = 50;

export function isWithinRadius(
  pos: Position,
  stop: GeofenceStop,
  radiusMeters = DEFAULT_RADIUS_M
): boolean {
  return haversineMeters(pos, stop) <= radiusMeters;
}

export function hasDeparted(
  pos: Position,
  stop: GeofenceStop,
  radiusMeters = DEFAULT_RADIUS_M
): boolean {
  return !isWithinRadius(pos, stop, radiusMeters);
}

export function findSameBuildingGroup(
  stops: GeofenceStop[],
  arrivedStop: GeofenceStop,
  radiusMeters = DEFAULT_RADIUS_M
): GeofenceStop[] {
  return stops.filter(
    (s) => s.hcpId !== arrivedStop.hcpId && isWithinRadius(s, arrivedStop, radiusMeters)
  );
}
