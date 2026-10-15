# ADR 0004: Idempotent order confirmation

- Status: Accepted
- Date: 2026-10-15

## Context

A client that confirms an order and loses the response cannot tell whether the confirmation happened, so it retries. The agent makes this common: an LLM that retries a tool call after a timeout is the typical case. Without idempotency, a retry either fails with "already confirmed" although the client's intent succeeded, or, in a race, decrements stock twice.

## Decision

`OrdersService.confirm(orderId, idempotencyKey)` requires a client-generated key, unique per operation attempt and scoped per user. The key is stored on the order, and the unique index `(user_id, idempotency_key)` enforces it in the database.

| Situation | Result |
|---|---|
| New key | Confirm the order and store the key on it |
| Same key, same order (retry) | Return the stored order; stock is not touched |
| Same key, different order | `IdempotencyKeyReuseError` (HTTP 422): a client bug |
| Different key, order already confirmed | `OrderRuleError` (HTTP 409), as before |

Inside the transaction the service loads the order, then looks up the key with `findByIdempotencyKey(order.userId, key)`, and only then applies the domain transition. The key check must come first: otherwise a retry reaches `transition(confirmed → confirmed)` and fails.

A retry returns the order in its current state. If the order was confirmed with a key and later cancelled, a retry with that key returns the cancelled order. This reports the truth instead of replaying a stale response.

## Alternatives considered

- **No key, treat "already confirmed" as success.** Simpler, but a client cannot distinguish its own retry from someone else's confirmation, and it hides client bugs.
- **Stored response replay (Stripe style).** Keeps the original response byte for byte, but needs a separate table with request fingerprints and expiry. It is overkill while confirmation is the only idempotent operation.
- **Key in a separate `idempotency_keys` table.** Generalizes to other operations, but adds a join and a second write for a single use case. Can be extracted when a second idempotent operation appears.

## Consequences

- Sequential retries are safe and covered by unit tests with in-memory fakes.
- Concurrent requests with the same key both see a new key in their own transaction. Protection relies on the database: a row lock on the order or a conditional status update, plus the unique index. This is covered by integration tests in the Drizzle adapter.
- The HTTP layer will take the key from an `Idempotency-Key` header and the agent tool will generate one per confirmation attempt.
