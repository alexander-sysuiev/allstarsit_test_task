# Battlefield Dashboard (Starter)

This repository contains an initial full-stack scaffold:
- `server`: Node.js + TypeScript simulation service
- `client`: React + TypeScript + Vite live dashboard

## Architecture Decisions

### 1) Live transport: Server-Sent Events (SSE)
- Chosen for one-way, server-to-client streaming updates.
- Simpler operational model than WebSockets for this use case.
- Works well with event streams where client sends no real-time commands.

### 2) Client state: normalized entity store
- Units are stored by id in a normalized store (`@reduxjs/toolkit` entity adapter).
- Initial snapshot is fetched once; incremental updates are merged via `upsertMany`.
- Avoids replacing large arrays on each tick.

### 3) Rendering strategy for scale
- Unit list uses virtualization (`@tanstack/react-virtual`) to avoid rendering thousands of rows.
- Map uses a single HTML canvas draw pass instead of 20k DOM nodes.

### 4) Simulation model
- Server keeps 20,000 units in memory and mutates subsets per tick.
- SSE emits delta payloads only, not full snapshots.

## TODO
- Add integration tests (SSE contract, simulation invariants).
- Add production build/deploy setup.
- Add observability (metrics/logging/tracing).
- Tune tick batch sizes and backpressure behavior.
