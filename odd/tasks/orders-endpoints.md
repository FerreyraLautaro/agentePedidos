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
- [x] T3 `OrdersService.cancel` with restock when previously confirmed: unit GREEN; integration GREEN (22 passed, includes restock, confirm-vs-cancel race, parallel addLine). Commit c89397f
- [x] T4 `OrdersController` + Zod DTOs + `IdempotencyKey` param decorator (e2e caught that `@Headers()` ignores pipes)
- [x] T5 `DomainExceptionFilter` (409 / 404 / 422), unit + e2e on in-memory fakes
- [x] T6 ADR 0006 (price snapshot), ADR 0007 (error filter), roadmap step 3 checked

## Acceptance
- Unit tests green for every new service method; integration test proves cancel restocks atomically.
- Endpoints covered by e2e tests, including each mapped error.
- `npx tsc --noEmit` and `npm run lint` clean.

## Progress
All tasks done. Final checks observed: `tsc --noEmit` clean, `oxlint` clean, 52 unit, 14 e2e, 22 integration passing.

## Next step
Step 4 of Fase 1: JWT (users table, login, guard, FK migration for `orders.user_id`). Then replace `userId` in the create-order body with the authenticated user.
