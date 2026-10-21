# Feature: JWT authentication and order ownership (Fase 1, step 4)

## Objective
Add `users`, register/login with JWT, a guard for `orders`, and make every order belong to an authenticated user (FK on `orders.user_id`).

## Decisions
- Password hashing: **argon2** behind a `PasswordHasher` port. **Fallback recorded by the user: if argon2 gives problems on Windows, switch to bcrypt** (only the adapter changes, the port stays). Written down in ADR 0008.
- Access token only (no refresh token), short expiry from env. Refresh tokens are out of scope for this lab.
- `JwtService` from `@nestjs/jwt` is used directly in `AuthService` (no extra port); unit tests build it with a test secret.
- Another user's order answers 404, not 403, so order ids do not leak existence. (default taken, easy to flip; confirm with user)
- Guard applied to `OrdersController` only; `products` stay public.

## Scope
In: `src/auth/**`, `src/users/**` (or inside auth), `src/database/schema.ts`, `drizzle/`, `src/orders/**` (ownership), env schema, tests, ADR 0008. Out: refresh tokens, roles, password reset.

## Constraints
- Migration with the FK must be read before applying; existing dev rows in `orders` with unknown `user_id` would break it.
- Integration tests that insert orders must now create a user first.

## Tasks
- [x] T1 `users` table + FK migration + fix existing integration tests (helper to create users). Migration 0003; 23 integration tests green incl. FK test; dev DB had 0 orders, test DB orphan rows truncated once
- [x] T2 `PasswordHasher` port + argon2 adapter (works on Windows, prebuilt binary; bcrypt fallback documented) + fake hasher; `UserRepository` port + fake + Drizzle adapter (unique violation translated, race test). `isUniqueViolation` extracted to `src/database/unique-violation.ts`
- [x] T3 `AuthService` register/login (unit RED: module missing, then GREEN 64 passed) + env `JWT_SECRET`, `JWT_EXPIRES_IN`. `.env` and `.env.example` could NOT be edited (permission denied): the user must add the variables
- [x] T4 `AuthController` (`POST /auth/register`, `POST /auth/login`) + e2e (commit 4681023)
- [x] T5 `JwtAuthGuard` + `@CurrentUserId()`; orders use the authenticated user (create-order body removed); ownership in `OrdersService` answers 404 for foreign orders (unit RED 16 failed, then GREEN)
- [x] T6 ADR 0008 (includes the bcrypt fallback), roadmap checkboxes

## Acceptance
- Wrong password and unknown email answer the same 401 (no user enumeration).
- Passwords are never stored or logged in clear text.
- Orders endpoints answer 401 without a valid token and 404 for another user's order.
- `tsc`, `oxlint`, unit, integration and e2e all green.

## Progress
All tasks done. Observed: `tsc` clean, `oxlint` clean, 76 unit, 31 e2e (run with a temporary JWT_SECRET env var), 27 integration passing.

## Next step
User must add `JWT_SECRET` (min 32 chars) and optionally `JWT_EXPIRES_IN` to `.env` and `.env.example` (not editable by the agent). Then Fase 1 is complete: open the PR. Next phase: Fase 2, the hand-written agent loop.
