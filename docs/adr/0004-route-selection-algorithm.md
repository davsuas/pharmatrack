# Route selection: geographic clustering with guaranteed Tier 1 minimum

The daily Route suggestion selects 10 HCPs using a two-phase algorithm: first reserve a configurable minimum number of slots for Tier 1 HCPs (default: 3), then fill remaining slots with the geographically tightest cluster of eligible HCPs near the MSR's current location. Ordering of the final 10 is solved via Google Maps Distance Matrix.

Pure geographic optimization was considered but rejected: it risks Tier 1 HCPs being skipped every day because they are geographically scattered, causing unrecoverable coverage gaps by Cycle day 22. Pure tier-priority ordering was also rejected: it ignores geography and produces inefficient routes with excessive travel time.

The minimum Tier 1 slots value is configurable per DM to allow territory-specific tuning.
