# ADR 0005: Row lock for concurrent order confirmations

- Status: Accepted
- Date: 2026-10-15

## Context

Postgres runs at `READ COMMITTED` by default: a plain `SELECT` takes no lock and reads the last committed version. Two confirmations of the same order that run in parallel both read `draft`, both pass the domain transition and both decrement stock. The conditional stock update (ADR 0002) prevents overselling, but not decrementing twice for the same order: they are different invariants.

The unique index `(user_id, idempotency_key)` does not help either:

| Race | Stopped by the unique index? |
|---|---|
| Same key, different orders | Yes: the second transaction waits for the first and fails with `23505` |
| Same key, same order | No: both write the same key on the same row |
| Different keys, same order | No: nothing is duplicated |

## Decision

Confirmation loads the order with `SELECT ... FOR UPDATE` through a dedicated port method, `OrderRepository.findByIdForUpdate`. The second transaction waits on that select until the first one ends, then reads the committed state. The service logic already covered by unit tests decides correctly from there: the same key returns the order (ADR 0004), and a different key fails the transition with `OrderRuleError`.

Supporting decisions:

- `findById` stays lock-free, because reads such as `GET /orders/:id` must not block confirmations.
- The in-memory fake implements `findByIdForUpdate` as `findById`. A unit test cannot observe a lock; spying on the call would test the implementation, not the behavior. Locking is proven by integration tests.
- No deadlock is introduced: every confirmation locks the order first, then stock rows sorted by product id.
- Repositories take a `DbExecutor` (the database or an open transaction). Their own `.transaction()` calls become savepoints when nested, so they keep their all-or-nothing guarantee standalone and inside the transaction manager.

## Alternatives considered

- **Conditional status update (`UPDATE orders ... WHERE status = 'draft'`).** Detects the lost race in one statement, but the loser always gets an error, even when it is a retry with the same key, which breaks ADR 0004. It also moves a domain rule into `save`.
- **`SERIALIZABLE` isolation.** Correct, but Postgres aborts one transaction with `40001` and the application needs a retry loop. Heavier to run and to explain.
- **Optimistic locking with a version column.** Fits long edits; on a confirmation race it also turns a valid retry into an error unless it re-reads and retries.

## Consequences

- Integration tests race two confirmations against real Postgres: with different keys exactly one succeeds and stock drops once; with the same key both return the same confirmed order and stock drops once. Removing the lock makes them fail (stock ends at 6 instead of 8), and which test fails varies between runs, as races do.
- Concurrent confirmations of the same order are serialized. This is negligible for one order but means a slow transaction holds the lock; transactions must stay short.
- Same key on different orders still relies on the unique index. `DrizzleOrderRepository` translates that violation into `IdempotencyKeyReuseError` (see below).

## Addendum: translating the unique violation

The row lock cannot serialize two different orders, so both can see the key as new and reach `save`. The second one hits the unique index and Postgres raises `23505`. Without translation, the raw `Failed query` error would leak past the port, and neither the HTTP layer nor the agent could map it.

- Drizzle 0.45 wraps driver errors in `DrizzleQueryError`; the `pg` `DatabaseError`, with `code` and `constraint`, is its `cause`.
- The adapter matches both the code `23505` and the constraint `orders_user_idempotency_key_unique`. A violation of any other unique index is rethrown unchanged instead of being disguised as an idempotency problem.
- The `try/catch` wraps only the header upsert, the one statement that can violate that index.
- The key is checked twice on purpose: the service lookup covers sequential retries with a clear error, and the unique index is the guarantee under races. The losing transaction rolls back, including its stock decrement, which the integration test asserts.
