# Battlefield Dashboard

## Overview

This project is a small full-stack battlefield simulation built for a take-home exercise.

- `server`: Node.js + TypeScript service that owns the simulation, computes KPI snapshots, and streams tick deltas over SSE
- `client`: React + TypeScript dashboard that renders 20,000 units, KPI cards, an event feed, a searchable virtualized unit list, and a browser-side performance panel

The main design goal is to handle a large live unit set with simple, explainable architecture.

## Setup

### Prerequisites

- Node.js 22+
- npm 10+

### Install dependencies

From the repo root:

```bash
npm install
```

## Run Locally

### Run both apps together

```bash
npm run dev
```

This starts:

- server on `http://localhost:4000`
- client on the Vite dev server, typically `http://localhost:5173`

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

- The server keeps the battlefield state in memory inside a single simulation service.
- Each tick mutates only a subset of units, computes updated KPIs, and emits a delta payload.
- Query validation is explicit and isolated in transport helpers rather than being inlined in route handlers.

This keeps the server easy to reason about in a review call: one simulation loop, one snapshot endpoint, one stream endpoint.

### Client

- The client fetches one initial snapshot, then applies field-level unit patches from the stream.
- Units are stored in a normalized Redux entity store so updates target ids directly.
- The tactical map is isolated from React’s normal render path and draws imperatively to a single canvas.
- The unit list owns its own filtering and virtualization so large list work does not interfere with map rendering.
- The performance panel is isolated from application state and uses browser APIs directly.

The theme across the client is to keep React responsible for layout and controls, and keep hot rendering paths outside of large React tree updates.

## Why SSE

SSE is a good fit here because the data flow is one-way: server to client.

- The client does not need to send realtime commands back to the server.
- SSE is simpler to implement and debug than WebSockets for this shape of problem.
- It maps naturally to ordered event delivery such as `ready`, `tick.delta`, and `heartbeat`.
- Reconnect behavior is straightforward, and the server can replay recent missed ticks using `sinceTick`.

If this project required bidirectional gameplay commands or higher-frequency binary transport, WebSockets would be a stronger candidate. For this dashboard, SSE keeps the transport simple.

## Why Canvas

The map must render 20,000 live unit markers.

- Rendering 20,000 DOM nodes would add too much layout, style, and reconciliation overhead.
- SVG would also become expensive at that node count under frequent updates.
- A single canvas keeps the render surface flat and predictable.
- Drawing is scheduled with `requestAnimationFrame`, which lets rendering align with the browser’s frame loop.

React still mounts the canvas element, but the actual draw loop is separated into an imperative renderer to avoid expensive rerenders for every tick.

## Delta Synchronization

Synchronization is snapshot + delta based.

1. The client fetches `/api/snapshot` once at startup.
2. The server returns the full unit set and current KPI snapshot.
3. The client opens an SSE connection to `/api/stream`.
4. On each tick, the server sends only changed units plus events and KPI data.
5. The client applies incoming field-level patches to existing normalized entities.

Why this approach:

- Full snapshots every tick would be wasteful for 20,000 units.
- Most units do not change on a given tick.
- Patch application is cheap, testable, and keeps payload size bounded.

The stream endpoint also accepts `sinceTick`, which allows replay of recent tick history after reconnects instead of forcing a full reload immediately.

## Performance Metrics

The performance panel intentionally uses browser APIs rather than Redux-driven app metrics.

Collected metrics:

- FPS and average frame time via `requestAnimationFrame`
- JavaScript heap usage via `performance.memory` when available
- API latency via `PerformanceObserver` and browser performance entries
- long-task counts via `PerformanceObserver`
- store update rate via a lightweight `store.subscribe` counter

Important implementation detail:

- metrics are aggregated in an internal monitor object
- the panel publishes UI updates at a low frequency instead of every frame
- the rest of the app does not rerender when the panel samples metrics

This keeps the monitoring overhead low and avoids turning the diagnostics panel into the source of the performance problem.

## Trade-offs And Known Limitations

- The simulation is in-memory and single-process. It is fine for a take-home, but not durable or horizontally scalable.
- SSE replay uses a bounded in-memory history window, so long disconnects may require a fresh snapshot.
- The map redraws the full visible scene each frame request rather than using dirty-region rendering. That keeps the implementation simple, but it is not the most optimized possible approach.
- `performance.memory` is browser-specific and not universally available, so heap metrics degrade to `n/a`.
- The event feed keeps a bounded recent history and intentionally drops non-combat event types from the UI.
- The current server tick loop uses `setInterval`, which is simple but not precise enough for stricter simulation timing requirements.

## What I Would Improve Next For Production

- Add integration tests around SSE replay, reconnect behavior, and snapshot/delta consistency.
- Move simulation timing and tick scheduling to a more explicit loop with drift handling.
- Add structured logging, health metrics, and basic tracing around snapshot fetches and stream lifecycle.
- Introduce backpressure and load-shedding strategies for slow clients.
- Split shared battlefield types into a common package to remove duplication between server and client.
- Add user-facing filter controls for the map, not just the units panel.
- Add deployment configuration, environment-based URLs, and containerization.
- Revisit the map renderer for partial redraws or worker/offscreen-canvas support if profiling showed the canvas becoming the next bottleneck.

## Project Structure

```text
server/
  src/
    app.ts
    services/unitSimulationService.ts
    transport/
    domain/

client/
  src/
    app/
    entities/units/
    features/map/
    features/unit-list/
    features/events/
    features/kpis/
    features/performance/
    store/
```

The structure is intentionally flat and feature-oriented. The project is small enough that a deeper abstraction stack would make it harder, not easier, to explain.
