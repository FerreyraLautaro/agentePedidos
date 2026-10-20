# ADR 0007: Los errores de dominio se traducen a HTTP en un filtro global

- Estado: Aceptado
- Fecha: 2026-10-20

## Contexto

El domain y los services lanzan errores con significado de negocio (`OrderRuleError`, `InsufficientStockError`, `OrderNotFoundError`, `ProductNotFoundError`, `IdempotencyKeyReuseError`). Alguien tiene que decidir qué status HTTP le corresponde a cada uno, y el domain no puede depender de Nest.

## Decisión

Un `DomainExceptionFilter` global (`APP_FILTER`) con una tabla error → status:

| Error | Status |
|---|---|
| `OrderRuleError`, `InsufficientStockError` | 409 |
| `OrderNotFoundError`, `ProductNotFoundError` | 404 |
| `IdempotencyKeyReuseError` | 422 |

Los controllers quedan sin `try/catch`. El body de la respuesta es `{ statusCode, error, message }`. Un error que el filtro no conoce sigue su camino normal y termina en 500.

La validación de input (Zod) sigue devolviendo 400 antes de llegar al service. `Idempotency-Key` es obligatorio para confirmar y se lee con un decorador propio, porque `@Headers()` no acepta pipes.

## Alternativas consideradas

- **`try/catch` en cada handler.** Explícito, pero repite el mapeo y es fácil olvidarlo al agregar un endpoint.
- **Errores de dominio que extienden `HttpException`.** Menos código, pero el domain pasaría a depender de Nest y no se podría reutilizar con otro borde.

## Consecuencias

- Agregar un error de dominio exige sumarlo a la tabla; el unit test del filtro cubre el mapeo.
- Las tools del agente (Fase 2) reutilizan los mismos services y traducen los mismos errores a mensajes para el LLM, no a status codes.
- Los e2e del borde HTTP corren con el service sobre fakes en memoria: validan routing, validación y status, no reglas de negocio.
