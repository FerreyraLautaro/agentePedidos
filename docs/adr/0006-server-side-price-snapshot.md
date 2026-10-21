# ADR 0006: El precio de una línea sale del catálogo, nunca del cliente

- Estado: Aceptado
- Fecha: 2026-10-20

## Contexto

`addLine` del domain recibe `unitPriceCents`. Si ese valor llegara en el request, quien llama (un cliente malicioso o un LLM que alucina) decidiría cuánto paga. Además, el precio de un producto puede cambiar después de armar el pedido, y el pedido no debe cambiar con él.

## Decisión

- `OrdersService.addLine(orderId, productId, quantity)` no recibe precio. Lo lee del catálogo mediante el port `ProductCatalog.findPrices` y lo congela en la línea (snapshot).
- El body del endpoint no tiene campo de precio. El schema Zod descarta las claves desconocidas, así que un `unitPriceCents` enviado se ignora.
- La lectura del catálogo ocurre **antes** de abrir la transacción: así no se mantiene el lock de la fila del pedido (ADR 0005) mientras se consulta otra tabla. No pierde consistencia, porque el precio es un snapshot por diseño.
- Un producto inexistente lanza `ProductNotFoundError`.

## Alternativas consideradas

- **Inyectar `ProductsService` en `OrdersService`.** Menos código, pero acopla orders a Drizzle y a una excepción HTTP, y los unit tests dejarían de usar fakes.
- **Exponer el catálogo dentro de `TransactionalRepositories`.** Lee en la misma transacción, pero ensancha el contrato del transaction manager sin aportar consistencia útil.

## Consecuencias

- Un solo lugar decide el precio, y el agente de la Fase 2 solo manda `productId` y cantidad.
- Si el precio cambia entre dos `addLine` del mismo producto, la línea se actualiza al precio vigente (regla del domain). Las líneas ya confirmadas no cambian.
- Hay un puerto más, con su fake en memoria y su adapter Drizzle.
