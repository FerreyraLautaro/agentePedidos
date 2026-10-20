# ADR 0008: Autenticación JWT, hashing con argon2 y pedidos propios

- Estado: Aceptado
- Fecha: 2026-10-20

## Contexto

Cada pedido debe pertenecer a un usuario y solo ese usuario puede verlo o modificarlo. Hasta ahora `userId` viajaba en el body, lo que permitía actuar en nombre de cualquiera. Hace falta registro, login, un guard y una regla de pertenencia.

## Decisión

**Hashing de passwords: argon2id detrás del port `PasswordHasher`.** Es lo que recomienda OWASP hoy y resiste GPU porque consume memoria. El adapter usa los parámetros por defecto de la librería `argon2`.

> **Plan B registrado: si `argon2` da problemas en Windows (el paquete usa un binario nativo), cambiar a `bcrypt`.** El cambio es acotado: se escribe un `BcryptPasswordHasher` que implemente el mismo port y se cambia una línea de `auth.module.ts`. El `AuthService` y los tests no se tocan. Al momento de escribir esto, `argon2` instaló y funcionó en Windows con su binario precompilado. Los hashes ya guardados no se migran solos: un cambio de algoritmo requiere re-hashear en el siguiente login exitoso.

**Tokens.** Solo access token (JWT firmado con `JWT_SECRET`, mínimo 32 caracteres, validado al arrancar; vence según `JWT_EXPIRES_IN`, por defecto `1h`). Sin refresh token: queda fuera del alcance del laboratorio. El `sub` del token es el id del usuario.

**Registro y login.**
- El email se normaliza (trim y minúsculas) antes de guardarse o buscarse; el unique de la base es la última defensa ante una carrera de registros.
- Contraseña de 8 a 128 caracteres: el máximo evita que hashear entradas enormes sea una forma barata de consumir CPU. Login solo valida la forma, para no invalidar passwords anteriores si cambia la regla.
- Email desconocido y password incorrecta devuelven el **mismo** error (401) y el mismo cuerpo. Con email desconocido igual se verifica contra un hash descartable para que el tiempo de respuesta sea parecido y no se pueda enumerar usuarios por latencia.

**Guard y pertenencia.**
- `JwtAuthGuard` protege `OrdersController` (`products` sigue público). Valida firma y vencimiento y deja `request.user.id`.
- El usuario sale siempre del token, nunca del body.
- `OrdersService` recibe el `userId` en todas las operaciones. Un pedido ajeno se reporta como inexistente (**404, no 403**): así un id no revela si existe.
- La base lo respalda con la FK `orders.user_id → users.id` (`ON DELETE RESTRICT`).

## Alternativas consideradas

- **bcrypt.** Muy conocido y sin binarios problemáticos en la práctica, pero trunca a 72 bytes y resiste peor al hardware especializado. Queda como plan B.
- **scrypt de `node:crypto`.** Sin dependencias, pero obliga a manejar salt y formato de almacenamiento a mano.
- **Passport.** Aporta estrategias listas, pero para un único esquema Bearer un guard de 30 líneas es más fácil de leer y de testear.
- **403 para pedidos ajenos.** Más explícito, pero confirma que el id existe.
- **Refresh tokens.** Más seguros para sesiones largas; agregan estado y complejidad que el laboratorio no necesita todavía.

## Consecuencias

- `JWT_SECRET` pasa a ser obligatorio: sin él la app no arranca.
- Un token robado sirve hasta que vence; no hay revocación. Con tokens cortos el riesgo es acotado.
- Cada operación del service exige `userId`, lo que también define el contrato que van a usar las tools del agente en la Fase 2: el agente actúa siempre en nombre de un usuario autenticado.
- Los tests de integración deben crear primero el usuario del pedido (fixture `insertUser`).
