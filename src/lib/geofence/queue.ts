import { openDB } from "idb";
import type { GeofenceEvent } from "./types";

const DB_NAME = "pharmatrack";
const STORE = "geofence_queue";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { autoIncrement: true });
      }
    },
  });
}

export async function enqueueEvent(event: GeofenceEvent): Promise<void> {
  const store = await db();
  await store.add(STORE, event);
}

export async function drainQueue(): Promise<GeofenceEvent[]> {
  const store = await db();
  const tx = store.transaction(STORE, "readwrite");
  const events = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return events;
}
