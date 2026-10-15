# ADR 0002: Atomic, all-or-nothing stock decrement

- Status: Accepted
- Date: 2026-10-15 (recorded retroactively; decided in phase 1)

## Context

Stock is decremented when an order is confirmed. Two customers can confirm orders for the last unit at the same time, and an order can contain several products. The store must never oversell, and an order must never be partially fulfilled.

## Decision

`StockRepository.decrement(lines)` is all or nothing:

- It runs in one transaction.
- Each line uses a conditional update, `UPDATE stock SET quantity = quantity - n WHERE product_id = $1 AND quantity >= n`. A line that updates zero rows lacks stock.
- Duplicate lines for the same product are merged before checking, so two lines of 1 are checked as 2.
- Lines are sorted by product id, so concurrent transactions lock rows in the same order and cannot deadlock.
- If any product lacks stock, the transaction rolls back and `InsufficientStockError` lists every failing product, not only the first.
- A `CHECK (quantity >= 0)` constraint in the database is the last line of defense.

## Alternatives considered

- **Read, check in code, then write.** Two concurrent requests can both read 1 and both write 0: a lost update that oversells.
- **`SELECT ... FOR UPDATE` then update.** Correct, but it needs an extra round trip per line for the same guarantee the conditional update gives in one statement.
- **Optimistic locking with a version column.** Fits long edits, but on contention it forces retries for a hot product.
- **Reserve stock when a line is added to the draft.** Abandoned drafts would hold stock and need expiry. It can be revisited if the agent needs reservations.

## Consequences

- Correctness is proven with integration tests against real Postgres, including two concurrent decrements of the last unit where exactly one succeeds.
- Listing every failing product lets the agent tell the customer everything that is missing in one turn.
- The decrement must run inside the caller's transaction when other writes depend on it. See ADR 0003.
