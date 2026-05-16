export interface Position {
  lat: number;
  lng: number;
}

export interface GeofenceStop {
  hcpId: string;
  lat: number;
  lng: number;
}

export type GeofenceEventType = "arrival" | "departure";

export interface GeofenceEvent {
  type: GeofenceEventType;
  hcpId: string;
  timestamp: number;
  position: Position;
}
