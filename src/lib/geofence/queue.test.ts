import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { enqueueEvent, drainQueue } from "./queue";
import type { GeofenceEvent } from "./types";

const arrival: GeofenceEvent = {
  type: "arrival",
  hcpId: "hcp-1",
  timestamp: 1000,
  position: { lat: 4.711, lng: -74.072 },
};

const departure: GeofenceEvent = {
  type: "departure",
  hcpId: "hcp-1",
  timestamp: 2000,
  position: { lat: 4.712, lng: -74.073 },
};

beforeEach(async () => {
  // drain leftovers between tests
  await drainQueue();
});

describe("geofence queue", () => {
  it("enqueued event is returned by drainQueue", async () => {
    await enqueueEvent(arrival);
    const events = await drainQueue();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "arrival", hcpId: "hcp-1" });
  });

  it("drainQueue returns events in insertion order", async () => {
    await enqueueEvent(arrival);
    await enqueueEvent(departure);
    const events = await drainQueue();
    expect(events[0].type).toBe("arrival");
    expect(events[1].type).toBe("departure");
  });

  it("drainQueue clears the queue", async () => {
    await enqueueEvent(arrival);
    await drainQueue();
    const second = await drainQueue();
    expect(second).toHaveLength(0);
  });
});
