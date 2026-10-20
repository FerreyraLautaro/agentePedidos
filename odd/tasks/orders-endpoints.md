# Feature: orders service completion and HTTP endpoints (Fase 1, steps 3a + 3b)

## Objective
Complete `OrdersService` (create draft, add line, cancel) and expose orders over HTTP, translating domain errors to status codes.

## Decisions
- Unit price is read server-side from the catalog through a new `ProductCatalog` port (option A), outside the transaction. The client/agent only sends `productId` and `quantity`. The price is frozen in the line (snapshot).
- Cancel restocks only when the order was `confirmed`; cancelling a draft never touched stock.
- `userId` is a plain parameter until JWT lands (step 4).

## Scope
In: `src/orders/**`, `docs/adr/` (new ADR for price source). Out: JWT/users (step 4), agent tools (Fase 2).

## Delivery
Branch `feat/fase-1-dominio` (kept by user). Strategy: ask-on-risk. Forecast ~450 changed lines across both parts; slice boundary to be decided before the next commit past 400.

## Tasks
- [x] T1 `ProductCatalog` port + in-memory fake + Drizzle adapter + module wiring (route: inline, small files, parent already held full context; no subagent spawned because the harness forbids spawning unless asked)
- [x] T2 `OrdersService.createDraft` and `addLine` (unit RED 12 failed / 7 passed, then GREEN 37 passed)
- [~] T3 `OrdersService.cancel` with restock when previously confirmed: unit GREEN; integration tests written (restock, confirm-vs-cancel race, parallel addLine) but NOT run, Docker daemon was down
- [ ] T4 `OrdersController` + Zod DTOs
- [ ] T5 Domain error to HTTP mapping (409 / 404 / 422) via exception filter
- [ ] T6 ADR for price source + roadmap checkboxes

## Acceptance
- Unit tests green for every new service method; integration test proves cancel restocks atomically.
- Endpoints covered by e2e tests, including each mapped error.
- `npx tsc --noEmit` and `npm run lint` clean.

## Progress
Exploration done. No code written yet.

## Next step
T1.
