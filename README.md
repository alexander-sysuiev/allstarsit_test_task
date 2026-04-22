# Battlefield Dashboard

## Overview

This project is a small full-stack battlefield simulation built as a take-home exercise.

- `server`: Node.js + TypeScript simulation service with snapshot and SSE endpoints
- `client`: React + TypeScript dashboard that renders 20,000 units, KPI cards, a tactical map, a virtualized units panel, an event feed, and a lightweight browser performance panel

The main goal is to handle a large live dataset with architecture that is easy to explain in a review call.

## Setup

### Prerequisites

- Node.js 22+
- npm 10+

### Install dependencies

From the repo root:

```bash
npm install
```

### Configure the client

Create a local env file from the example:

```bash
cp client/.env.example client/.env
```

Current client envs:

- `VITE_API_BASE_URL`: base URL for the server API and SSE stream

## Run Locally

### Run both apps

```bash
npm run dev
```

This starts:

- server on `http://localhost:4000`
- client on `http://localhost:5173`

### Run apps separately

Server:

```bash
npm run dev --workspace server
```

Client:

```bash
npm run dev --workspace client
```

## Verification

Typecheck:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Tests:

```bash
npm run test
```

Production build:

```bash
npm run build
```

## Architecture Decisions

### Server

- The simulation is owned by a single in-memory `UnitSimulationService`.
- The server exposes:
  - `GET /api/snapshot` for the initial full state
  - `GET /api/stream` for live tick deltas over SSE
- Each tick mutates only a subset of units and emits:
  - changed unit patches
  - recent battle events
  - recalculated KPIs
- Query validation is isolated in transport helpers with `zod`.

This keeps the backend simple: one simulation loop, one snapshot endpoint, one stream endpoint.

### Client

- The client fetches one snapshot, then stays synchronized via SSE deltas.
- State is stored in a normalized Zustand store, so patch application updates units by id instead of replacing large arrays.
- The tactical map is rendered on a single canvas and updated outside React’s normal list rendering path.
- The units panel does its own memoized filtering and virtualization so it does not render thousands of rows directly.
- The performance panel is isolated from app state and samples browser APIs on its own cadence.

The general pattern is: React handles layout and UI composition, while hot update paths stay imperative and narrow.

## Simulation Behavior

The simulation intentionally favors simple rules over realism.

- Units spawn with unique coordinates.
- Movement is random and bounded by world limits.
- `MAX_STEP` is shared as:
  - the maximum random movement distance
  - the maximum attack range
- Attacks target the closest alive enemy within attack range.
- If no enemy is in range, the unit falls back to idle for that tick.
- Coordinates are occupancy-protected: two units cannot share the same `x,y`.
- Zone control is derived from alive-unit counts per zone.

These rules are small enough to reason about quickly, while still producing a live, changing battlefield.

## Why SSE

SSE is a good fit here because the data flow is one-way: server to client.

- The dashboard only needs live pushes from the server.
- `EventSource` is built into the browser and keeps the client small.
- Ordering is natural for events like `ready` and `tick.delta`.
- Reconnect behavior is straightforward.
- The server can replay missed ticks with `sinceTick` from a bounded in-memory history.

If the system needed bidirectional commands, binary payloads, or much tighter realtime interaction, WebSockets would be the better next option. For this dashboard, SSE is the simpler tool.

## Why Canvas

The tactical map needs to show 20,000 live unit markers.

- Rendering 20,000 DOM nodes would create unnecessary reconciliation and layout overhead.
- SVG would still mean one element per marker, which is expensive under frequent updates.
- A single canvas keeps the render surface flat.
- Drawing is scheduled with `requestAnimationFrame`, which aligns rendering with the browser frame loop.

React mounts the canvas, but the draw logic lives in a separate renderer so unit updates do not trigger large React rerenders.

## Delta Synchronization

Synchronization is snapshot plus delta based.

1. The client fetches `/api/snapshot`.
2. The server returns the full unit set, current KPIs, and the current `tickNumber`.
3. The client opens `/api/stream?sinceTick=...`.
4. On each tick, the server sends only the changed units plus events and KPI data.
5. The client applies those patches into the existing normalized store.

This avoids resending all 20,000 units every second.

The stream endpoint accepts `sinceTick`, and the server keeps a bounded recent tick history. That lets the client reconnect and catch up after short disconnects without forcing a full snapshot every time.

## Performance Metrics

The performance panel uses browser APIs directly rather than storing diagnostics in app state.

Collected metrics:

- FPS via `requestAnimationFrame`
- average frame time via `requestAnimationFrame`
- JS heap usage via `performance.memory` when available
- API latency computed from `Date.now() - delta.serverTime`

Implementation details:

- metrics are aggregated in an internal collector
- UI updates are published at a low frequency
- the panel rerenders in isolation from the rest of the dashboard

This keeps the diagnostics useful without turning the monitoring UI into its own performance problem.

## Trade-offs And Known Limitations

- The simulation is in-memory and single-process. It is not durable and is not meant for horizontal scale.
- SSE replay uses a bounded in-memory tick history, so a long disconnect can still require a fresh snapshot.
- Canvas redraws the whole scene when the map updates. That is simple and adequate here, but not the most optimized possible approach.
- `performance.memory` is browser-specific, so heap metrics degrade to `n/a` where unsupported.
- The legend is currently static presentation, not a functional map filter.
- The simulation uses `setInterval`, which is simple but not ideal for tighter timing guarantees.
- Targeting is based on Euclidean distance and attack range only. There is no pathfinding, line-of-sight, or terrain logic.

## What I Would Improve Next For Production

- Add richer stream observability such as reconnect latency, replay catch-up time, and dropped-update detection.
- Add a forced resync path when a reconnect falls outside the retained tick-history window.
- Move shared domain types into a common package instead of duplicating them between client and server.
- Add structured logs and operational metrics around stream lifecycle and tick throughput.
- Revisit the map renderer for offscreen canvas or worker-based rendering if profiling showed canvas work becoming the next bottleneck.

## Project Structure

```text
server/
  src/
    config/
    domain/
    errors/
    middleware/
    services/
    transport/
    utils/
  tests/

client/
  src/
    components/
    entities/
    lib/
    store/
    styles/
    utils/
  tests/
```

The structure is intentionally shallow. The codebase is small enough that adding more abstraction layers would make it harder to explain, not easier.
