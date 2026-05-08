# PharmaTrack

A single-tenant pharmaceutical field execution platform for Medical Sales Representatives, District Managers, and Product Managers to plan, execute, and monitor 22-day promotional cycles.

## Language

### People

**Admin**:
A system-level role responsible for user provisioning, Panel CSV imports, Cycle creation, and global configuration (geofence radius, default minimum visit duration). Sits above DM and PM in the role hierarchy.
_Avoid_: Super-admin, system admin, National Sales Manager (use in UI labels only)

**Medical Sales Representative (MSR)**:
A field rep who visits HCPs daily according to an optimized route derived from their Panel and the active Promotional Grid.
_Avoid_: Sales rep, rep, visitador médico (use in UI labels only)

**District Manager (DM)**:
A manager who oversees a team of MSRs within a geographic territory, sets KPIs, configures minimum Tier 1 slots per Route, and monitors Cycle execution via status-level tracking (current Route stop and dwell time per MSR — no continuous GPS feed).
_Avoid_: Manager, supervisor

**Product Manager (PM)**:
A role who launches Campaigns, defines the Promotional Grid per Cycle, and sets which products take position focus during a Cycle.
_Avoid_: Marketing manager

**Healthcare Professional (HCP)**:
A prescriber or clinical influencer on an MSR's Panel, categorized into Tiers.
_Avoid_: Doctor, médico, physician, contact (except in UI labels)

### Field execution

**Call**:
The canonical logged interaction between an MSR and an HCP — the atomic unit of field activity. Auto-generated when a Visit meets the required duration threshold.
_Avoid_: Visit (as a synonym for the logged event), appointment, contact

**Visit**:
The physical presence of an MSR at an HCP location, detected by geofencing (50-meter movement threshold). A Visit produces a Call once the configured minimum duration is met.
_Avoid_: Do not use as a synonym for Call

**Minimum Visit Duration**:
The time threshold (in minutes) an MSR must spend at an HCP location for the Visit to produce a Call. Defined per Tier per Product Line on the Promotional Grid by the PM. Leaving before this threshold triggers an early-departure alert.
_Avoid_: Visit time, call duration, dwell time

**Panel**:
The full set of HCPs assigned to an MSR, organized by Tier per Product Line and used as the source for route suggestions. Loaded via separate CSV per Product Line (each containing HCP identifier, address, and tier); the system geocodes addresses on import via Google Maps Geocoding API.
_Avoid_: Territory list, HCP list, doctor list

**Tier**:
A priority classification assigned to an HCP (Tier 1 = High Priority, Tier 2 = Moderate, Tier 3 = Low), determining visit frequency within a Cycle.
_Avoid_: Segment, quintil (use in UI labels only)

**Promotional Cycle (Cycle)**:
A 22-business-day period created by the Admin, in which an MSR is expected to complete a full rotation of their Panel according to the active Promotional Grid. HCPs not fully covered by Day 22 are flagged as coverage misses and auto-boosted in priority for the next Cycle.
_Avoid_: Month, period, ciclo

**Coverage Miss**:
An HCP who did not receive their required number of Calls by the end of a Cycle. Reported to the DM and automatically assigned boosted priority in the following Cycle's Route selection.
_Avoid_: Missed visit, uncovered HCP

**Promotional Grid**:
The configuration set by a PM that defines which message, product, and call frequency applies to each Tier for a specific Product Line during a Cycle. One Campaign contains one Promotional Grid per Product Line.
_Avoid_: Grid, campaign grid, visit plan

**Product Line**:
A grouping of pharmaceutical products that share a Promotional Grid within a Campaign. An HCP may appear in multiple Product Lines with different Tier assignments and call frequencies.
_Avoid_: Product, drug, brand (use in UI labels only)

**Campaign**:
A PM-launched initiative that activates one or more Promotional Grids (one per Product Line) for a given Cycle, including core messages, visual aids, and product positioning per grid.
_Avoid_: Cycle campaign, promotion

**Route**:
The ordered sequence of HCPs suggested or manually set for an MSR on a given business day, constrained to a maximum of 10 targets. Suggested Routes are built by: (1) excluding HCPs who have met their Cycle call frequency, (2) reserving a configurable minimum number of slots for Tier 1 HCPs (default: 3), (3) filling remaining slots with the geographically tightest cluster near the MSR's current location, (4) ordering the selected HCPs via Google Maps Distance Matrix for minimum travel. Routes may include time-based Breaks between stops.
_Avoid_: Plan, itinerary, journey

**Break**:
A time-based pause inserted between Route stops by the MSR (e.g., lunch, personal errand). Defined by estimated duration only — no location is recorded. Visit detection is paused for the break window.
_Avoid_: Stop, waypoint, pause

## Relationships

- An **MSR** has one **Panel** of **HCPs**
- A **Panel** contains **HCPs** classified by **Tier**
- A **PM** launches a **Campaign** that activates a **Promotional Grid** for a **Cycle**
- A **DM** sets KPIs and monitors **MSR** execution within a **Cycle**
- Each business day an **MSR** follows a **Route** drawn from their **Panel**
- A **Route** contains up to 10 **HCPs**
- A **Visit** (geofence event) produces a **Call** (logged record) when minimum duration is met
- An **MSR** may promote multiple **Product Lines** in a single **Call**
- A **Promotional Grid** determines how many times per **Cycle** each **Tier** of **HCP** is called per **Product Line**
- When an **HCP** appears in multiple **Promotional Grids**, the required call frequency is the maximum across all grids; fulfilling it satisfies all grids simultaneously

## Example dialogue

> **Dev:** "When an MSR arrives at an HCP location, do we immediately create a Call?"
> **Domain expert:** "No — the geofence triggers a Visit. The Call is only logged once the MSR has been there for at least the configured minimum duration."
> **Dev:** "And if they leave early?"
> **Domain expert:** "The Visit ends, an alert fires, and the rep can confirm the early departure with a note. If they don't confirm, the Call is flagged as incomplete."

**Activity Log**:
An append-only record of all field events: Route versions, Visit arrivals/departures (with GPS coordinates and timestamp), and Call records. No deletions or edits — corrections create new records with a `supersedes_id` reference to the original. Required for compliance auditing.
_Avoid_: Audit log, history, changelog

**Same-Building Scenario**:
When an MSR enters a geofence containing 2+ Panel HCPs at the same address, the app prompts the rep to select which HCP they are visiting before starting the Visit timer. Each HCP receives a separate Call record.
_Avoid_: Co-located visit, building visit

## Flagged ambiguities

- "visit" was used in `webapp-idea.md` to mean both the physical presence (geofence event) and the logged CRM interaction — resolved: **Visit** = geofence event, **Call** = logged record.
