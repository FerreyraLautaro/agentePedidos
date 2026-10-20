# ADR 0003: Unit of Work para la confirmación de pedidos

- Estado: Aceptado
- Fecha: 2026-10-15

## Contexto

Confirmar un pedido escribe en dos lugares: descuenta el stock y guarda el pedido como `confirmed`. Si cada repository abre su propia transacción, un fallo entre ambas deja el stock descontado mientras el pedido sigue en `draft`, y nada lo deshace.

Abrir `db.transaction()` dentro de `OrdersService` resolvería la atomicidad, pero metería Drizzle en la capa que contiene las reglas de negocio e impediría testearla como unit test con fakes en memoria.

## Decisión

Un port `TransactionManager` (token `TRANSACTION_MANAGER`) ejecuta un bloque de trabajo en una sola transacción y le entrega repositories atados a esa transacción:

```ts
interface TransactionManager {
  run<T>(work: (repos: { orders: OrderRepository; stock: StockRepository }) => Promise<T>): Promise<T>;
}
```

`OrdersService.confirm` carga el pedido, aplica `transition(order, 'confirmed')`, descuenta el stock y guarda el pedido, todo dentro de `run`. Si algo lanza un error, no se persiste nada.

Decisiones de apoyo:

- `OrderRepository` no tiene injection token. Solo es accesible dentro de `run`, así que no se puede usar por error fuera de una transacción.
- `findById` devuelve `null` en vez de lanzar un error. El service lo traduce a `OrderNotFoundError` (HTTP 404), que se mantiene separado de `OrderRuleError` (HTTP 409).
- `save` persiste el aggregate completo, header y líneas. Las reglas quedan en el domain puro (`src/orders/domain/order.ts`). El repository no expone `addLine` ni `updateStatus`.
- La transición del domain, que es pura, corre antes de cualquier I/O, de modo que las confirmaciones inválidas fallan sin escribir nada.
- El fake en memoria simula el rollback restaurando un snapshot tomado antes de ejecutar `work`. Una copia superficial alcanza porque `Order` es inmutable.

## Alternativas consideradas

- **Transacción dentro del service con Drizzle.** Es simple, pero acopla la lógica de negocio al ORM y obliga a escribir integration tests para cada regla.
- **Transacción ambient con `AsyncLocalStorage` (por ejemplo `@nestjs-cls/transactional`).** Los repositories siguen siendo inyectables, pero la transacción se vuelve implícita y más difícil de explicar y de testear.
- **Saga o compensación (descontar y, si algo falla, reponer).** Hace falta entre services o bases de datos distintas, pero es una complejidad innecesaria dentro de una sola instancia de Postgres.

## Consecuencias

- `DrizzleStockRepository` debe aceptar un handle de transacción en vez de abrir la suya. El `TransactionManager` de Drizzle envuelve `db.transaction()` y construye ambos repositories con ese handle.
- Las reglas de pedidos se testean como unit tests en milisegundos. La atomicidad y las races (la misma idempotency key dos veces, dos confirmaciones en paralelo) siguen necesitando integration tests contra Postgres real.
- Todo caso de uso nuevo que escriba en varios aggregates pasa por `run`, y el conjunto de repositories que recibe crece con él.

## Anexo: module wiring

- `OrdersModule` provee `TRANSACTION_MANAGER` con `useClass: DrizzleTransactionManager` y exporta solamente `OrdersService`. Los consumers (controllers, tools del agente) dependen del service, nunca del transaction manager ni de los repositories.
- Los repositories no son providers de Nest. El transaction manager construye `DrizzleOrderRepository` y `DrizzleStockRepository` con la transacción abierta, por lo que `OrdersModule` no importa `StockModule`. El token `STOCK_REPOSITORY` queda para usar el stock de forma independiente.
- Trade-off: el adapter de orders importa directamente la clase del adapter de stock. Esto acopla las dos capas de adapters, que apuntan a la misma base Postgres; el domain y el service no se enteran. Si el stock se mudara a otro store, el transaction manager sería el único lugar a cambiar, y la atomicidad necesitaría otro enfoque (alternativas de este ADR).
- El test e2e de arranque compila `AppModule`, lo que demuestra que el grafo de dependencias se resuelve.
