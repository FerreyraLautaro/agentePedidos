# ADR 0004: Order confirmation idempotente

- Estado: Aceptado
- Fecha: 2026-10-15

## Contexto

Un cliente que confirma un pedido y pierde la response no puede saber si la confirmación ocurrió, así que hace retry. El agente vuelve esto frecuente: un LLM que reintenta una tool call tras un timeout es el caso típico. Sin idempotencia, un retry falla con "ya confirmado" aunque la intención del cliente se cumplió o, en una race, descuenta el stock dos veces.

## Decisión

`OrdersService.confirm(orderId, idempotencyKey)` exige una key generada por el cliente, única por intento de operación y acotada por usuario. La key se guarda en el pedido, y el unique index `(user_id, idempotency_key)` la hace cumplir en la base de datos.

| Situación | Resultado |
|---|---|
| Key nueva | Confirma el pedido y guarda la key en él |
| Misma key, mismo pedido (retry) | Devuelve el pedido guardado; el stock no se toca |
| Misma key, otro pedido | `IdempotencyKeyReuseError` (HTTP 422): un bug del cliente |
| Key distinta, pedido ya confirmado | `OrderRuleError` (HTTP 409), como antes |

Dentro de la transacción, el service carga el pedido, busca la key con `findByIdempotencyKey(order.userId, key)` y recién después aplica la transición del domain. El check de la key tiene que ir primero: de lo contrario un retry llegaría a `transition(confirmed → confirmed)` y fallaría.

Un retry devuelve el pedido en su estado actual. Si el pedido se confirmó con una key y después se canceló, un retry con esa key devuelve el pedido cancelado. Así se informa la verdad en vez de repetir una response vieja.

## Alternativas consideradas

- **Sin key, tratar "ya confirmado" como éxito.** Es más simple, pero el cliente no puede distinguir su propio retry de la confirmación de otro, y oculta bugs del cliente.
- **Replay de la response guardada (estilo Stripe).** Conserva la response original byte a byte, pero necesita una tabla aparte con fingerprints de los requests y expiración. Es excesivo mientras la confirmación sea la única operación idempotente.
- **Key en una tabla `idempotency_keys` separada.** Se generaliza a otras operaciones, pero agrega un join y una segunda escritura para un solo caso de uso. Se puede extraer cuando aparezca una segunda operación idempotente.

## Consecuencias

- Los retries secuenciales son seguros y están cubiertos por unit tests con fakes en memoria.
- Dos requests concurrentes con la misma key ven ambos una key nueva dentro de su propia transacción. La protección recae en la base de datos: un row lock sobre el pedido o un conditional update de estado, más el unique index. Esto se cubre con integration tests del adapter Drizzle.
- La capa HTTP tomará la key de un header `Idempotency-Key`, y la tool del agente generará una por cada intento de confirmación.
