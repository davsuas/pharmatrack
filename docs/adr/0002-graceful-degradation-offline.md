# Graceful degradation over full offline-first

The app pre-fetches the day's Route and Panel data at session start so the critical path (geofence detection, Call logging) survives connectivity loss. Map tiles are not cached — the map degrades to a non-interactive state when offline. Queued Call records sync automatically when connectivity resumes.

Full offline-first (service worker + IndexedDB with conflict resolution) was considered but rejected for v1: MSRs commit to their Route at the start of the day, so pre-fetching covers the vast majority of the offline surface area without the complexity of a full sync engine.
