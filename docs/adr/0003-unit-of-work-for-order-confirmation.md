# ADR 0003: Unit of Work for order confirmation

- Status: Accepted
- Date: 2026-10-15

## Context

Confirming an order writes to two places: it decrements stock and saves the order as `confirmed`. If each repository opens its own transaction, a failure between them leaves stock decremented while the order is still a draft, and nothing undoes it.

Opening `db.transaction()` inside `OrdersService` would solve atomicity, but it brings Drizzle into the layer that holds business rules and prevents unit testing it with in-memory fakes.

## Decision

A `TransactionManager` port (token `TRANSACTION_MANAGER`) runs a block of work in one transaction and hands it repositories bound to that transaction:

```ts
interface TransactionManager {
  run<T>(work: (repos: { orders: OrderRepository; stock: StockRepository }) => Promise<T>): Promise<T>;
}
```

`OrdersService.confirm` loads the order, applies `transition(order, 'confirmed')`, decrements stock and saves the order, all inside `run`. If anything throws, nothing is persisted.

Supporting decisions:

- `OrderRepository` has no injection token. It is reachable only inside `run`, so it cannot be used outside a transaction by mistake.
- `findById` returns `null` instead of throwing. The service maps it to `OrderNotFoundError` (HTTP 404), which is kept separate from `OrderRuleError` (HTTP 409).
- `save` persists the whole aggregate, header and lines. Rules stay in the pure domain (`src/orders/domain/order.ts`). The repository exposes no `addLine` or `updateStatus`.
- The pure domain transition runs before any I/O, so invalid confirmations fail without writes.
- The in-memory fake simulates rollback by restoring a snapshot taken before `work` runs. A shallow copy is enough because `Order` is immutable.

## Alternatives considered

- **Transaction inside the service with Drizzle.** Simple, but it couples business logic to the ORM and forces integration tests for every rule.
- **Ambient transaction with `AsyncLocalStorage` (for example `@nestjs-cls/transactional`).** Repositories stay injectable, but the transaction becomes implicit and harder to explain and test.
- **Saga or compensation (decrement, then increment on failure).** Needed across services or databases, but unnecessary complexity inside one Postgres instance.

## Consequences

- `DrizzleStockRepository` must accept a transaction handle instead of opening its own transaction. The Drizzle `TransactionManager` wraps `db.transaction()` and builds both repositories with that handle.
- Order rules are unit-tested in milliseconds. Atomicity and races (same idempotency key twice, two parallel confirmations) still need integration tests against real Postgres.
- Every new use case that writes to several aggregates goes through `run`, and the set of repositories it receives grows with it.

## Addendum: module wiring

- `OrdersModule` provides `TRANSACTION_MANAGER` with `useClass: DrizzleTransactionManager` and exports only `OrdersService`. Consumers (controllers, agent tools) depend on the service, never on the transaction manager or the repositories.
- Repositories are not Nest providers. The transaction manager builds `DrizzleOrderRepository` and `DrizzleStockRepository` with the open transaction, so `OrdersModule` does not import `StockModule`. The `STOCK_REPOSITORY` token stays for standalone stock use.
- Trade-off: the orders adapter imports the stock adapter class directly. This couples the two adapter layers, which both target the same Postgres database; the domain and the service stay unaware of it. If stock moved to another store, the transaction manager would be the single place to change, and atomicity would then need a different approach (ADR 0003 alternatives).
- The e2e boot test compiles `AppModule`, which proves the dependency graph resolves.
