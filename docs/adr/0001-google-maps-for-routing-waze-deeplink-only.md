# Google Maps Platform for all geospatial computation; Waze as navigation deep-link only

All route optimization, distance matrix calculations, geocoding, map rendering, and geofencing run exclusively through Google Maps Platform. Waze is used only as an optional turn-by-turn navigation deep-link that MSRs can open from their device — it has no backend role.

Waze provides no route optimization API; it can only navigate to a single destination. Google Maps Platform covers the full stack: Distance Matrix for TSP solving, Directions API for ordered routes, Maps JavaScript SDK for rendering, and Geocoding API for HCP address resolution. Splitting computation across two providers would add integration complexity for no benefit.
