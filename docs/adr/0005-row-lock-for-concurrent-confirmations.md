# ADR 0005: Row lock para confirmaciones concurrentes de pedidos

- Estado: Aceptado
- Fecha: 2026-10-15

## Contexto

Postgres corre por defecto en `READ COMMITTED`: un `SELECT` común no toma ningún lock y lee la última versión confirmada (committed). Dos confirmaciones del mismo pedido que corren en paralelo leen ambas `draft`, ambas pasan la transición del domain y ambas descuentan el stock. El conditional update del stock (ADR 0002) evita el oversell, pero no que se descuente dos veces por el mismo pedido: son invariantes distintas.

El unique index `(user_id, idempotency_key)` tampoco alcanza:

| Race | ¿La frena el unique index? |
|---|---|
| Misma key, pedidos distintos | Sí: la segunda transacción espera a la primera y falla con `23505` |
| Misma key, mismo pedido | No: las dos escriben la misma key en la misma fila |
| Keys distintas, mismo pedido | No: no hay nada duplicado |

## Decisión

La confirmación carga el pedido con `SELECT ... FOR UPDATE` mediante un método dedicado del port, `OrderRepository.findByIdForUpdate`. La segunda transacción espera en ese select hasta que la primera termina, y entonces lee el estado ya confirmado. A partir de ahí, la lógica del service, ya cubierta por unit tests, decide bien: la misma key devuelve el pedido (ADR 0004) y una key distinta hace fallar la transición con `OrderRuleError`.

Decisiones de apoyo:

- `findById` sigue sin tomar locks, porque lecturas como `GET /orders/:id` no deben frenar las confirmaciones.
- El fake en memoria implementa `findByIdForUpdate` igual que `findById`. Un unit test no puede observar un lock; espiar la llamada (spy) testearía la implementación y no el comportamiento. El locking se demuestra con integration tests.
- No se introduce ningún deadlock: toda confirmación toma primero el lock del pedido y después el de las filas de stock ordenadas por id de producto.
- Los repositories reciben un `DbExecutor` (la base de datos o una transacción abierta). Sus propias llamadas a `.transaction()` se convierten en savepoints cuando están anidadas, así conservan su garantía de todo o nada tanto standalone como dentro del transaction manager.

## Alternativas consideradas

- **Conditional update de estado (`UPDATE orders ... WHERE status = 'draft'`).** Detecta la race perdida en una sola sentencia, pero el perdedor siempre recibe un error, incluso cuando es un retry con la misma key, lo que rompe el ADR 0004. Además mueve una regla del domain al `save`.
- **Isolation level `SERIALIZABLE`.** Es correcto, pero Postgres aborta una transacción con `40001` y la aplicación necesita un retry loop. Es más pesado de operar y de explicar.
- **Optimistic locking con una columna de versión.** Sirve para ediciones largas; en una race de confirmaciones también convierte un retry válido en un error, salvo que se vuelva a leer y reintentar.

## Consecuencias

- Los integration tests hacen competir dos confirmaciones contra Postgres real: con keys distintas, exactamente una tiene éxito y el stock baja una sola vez; con la misma key, ambas devuelven el mismo pedido confirmado y el stock baja una sola vez. Sin el lock los tests fallan (el stock termina en 6 en lugar de 8), y cuál falla varía entre corridas, como pasa con las races.
- Las confirmaciones concurrentes del mismo pedido se serializan. Para un solo pedido es despreciable, pero implica que una transacción lenta mantiene el lock; las transacciones deben ser cortas.
- La misma key en pedidos distintos sigue dependiendo del unique index. `DrizzleOrderRepository` traduce esa violación a `IdempotencyKeyReuseError` (ver más abajo).

## Anexo: traducción de la unique violation

El row lock no puede serializar dos pedidos distintos, así que ambos pueden ver la key como nueva y llegar a `save`. El segundo choca con el unique index y Postgres lanza `23505`. Sin traducción, el error crudo `Failed query` se filtraría más allá del port, y ni la capa HTTP ni el agente podrían mapearlo.

- Drizzle 0.45 envuelve los errores del driver en `DrizzleQueryError`; el `DatabaseError` de `pg`, con `code` y `constraint`, es su `cause`.
- El adapter compara tanto el código `23505` como el nombre de la constraint `orders_user_idempotency_key_unique`. Una violación de cualquier otro unique index se relanza (rethrow) sin cambios en vez de disfrazarse de problema de idempotencia.
- El `try/catch` envuelve solo el upsert del header, la única sentencia que puede violar ese índice.
- La key se verifica dos veces a propósito (defense in depth): el lookup del service cubre los retries secuenciales con un error claro, y el unique index es la garantía bajo races. La transacción perdedora hace rollback, incluido su stock decrement, lo cual el integration test verifica.
