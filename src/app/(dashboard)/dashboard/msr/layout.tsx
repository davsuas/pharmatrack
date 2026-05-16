import { GeofenceWatcher } from "@/components/geofence-watcher";

export default function MsrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GeofenceWatcher />
      {children}
    </>
  );
}
