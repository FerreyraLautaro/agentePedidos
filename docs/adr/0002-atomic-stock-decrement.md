# ADR 0002: Stock decrement atómico, todo o nada

- Estado: Aceptado
- Fecha: 2026-10-15 (registrado a posteriori; decidido en la fase 1)

## Contexto

El stock se descuenta cuando se confirma un pedido. Dos clientes pueden confirmar pedidos por la última unidad al mismo tiempo, y un pedido puede tener varios productos. El negocio nunca debe vender de más (oversell), y un pedido nunca debe cumplirse a medias.

## Decisión

`StockRepository.decrement(lines)` es todo o nada (all or nothing):

- Corre en una sola transacción.
- Cada línea usa un conditional update, `UPDATE stock SET quantity = quantity - n WHERE product_id = $1 AND quantity >= n`. Una línea que actualiza cero filas no tiene stock suficiente.
- Las líneas duplicadas del mismo producto se fusionan (merge) antes de verificar, de modo que dos líneas de 1 se verifican como 2.
- Las líneas se ordenan por id de producto, así las transacciones concurrentes toman los locks de las filas en el mismo orden y no pueden generar un deadlock.
- Si algún producto no tiene stock, la transacción hace rollback y `InsufficientStockError` lista todos los productos que fallan, no solo el primero.
- Una constraint `CHECK (quantity >= 0)` en la base de datos es la última línea de defensa.

## Alternativas consideradas

- **Leer, verificar en código y luego escribir.** Dos requests concurrentes pueden leer 1 y escribir 0 las dos: un lost update que hace oversell.
- **`SELECT ... FOR UPDATE` y luego update.** Es correcto, pero necesita un round trip extra por línea para la misma garantía que el conditional update da en una sola sentencia.
- **Optimistic locking con una columna de versión.** Sirve para ediciones largas, pero ante contención obliga a hacer retry sobre un producto muy pedido.
- **Reservar stock al agregar una línea al borrador.** Los borradores abandonados retendrían stock y habría que hacerlos expirar. Se puede retomar si el agente llega a necesitar reservas.

## Consecuencias

- La corrección se demuestra con integration tests contra Postgres real, incluidos dos decrements concurrentes de la última unidad donde exactamente uno tiene éxito.
- Listar todos los productos que fallan permite que el agente le diga al cliente todo lo que falta en un solo turno.
- El decrement debe correr dentro de la transacción del caller cuando otras escrituras dependen de él. Ver ADR 0003.
