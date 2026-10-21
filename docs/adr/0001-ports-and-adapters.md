# ADR 0001: Ports and adapters para las dependencias externas

- Estado: Aceptado
- Fecha: 2026-10-15 (registrado a posteriori; decidido en la fase 0)

## Contexto

El agente depende de un provider de LLM, y la tesis compara varios providers (fase 9). La lógica de negocio también necesita persistencia. Si los services llaman directamente a los SDKs de los providers o a la base de datos, cambiar de provider o testear la lógica sin red ni base de datos se vuelve caro.

## Decisión

Los contratos que ve el domain son interfaces de TypeScript en archivos `*.port.ts`, cada una acompañada de un injection token `Symbol`, porque las interfaces no existen en runtime y Nest inyecta por token. Los adapters, en una carpeta `adapters/`, implementan el port y traducen en ambos sentidos entre los tipos del port y el SDK del provider.

- El port nunca expone tipos del SDK.
- El `useFactory` del módulo es el único lugar que sabe qué adapter se usa.
- Los consumers inyectan con `@Inject(TOKEN)` e importan la interfaz con `import type`.

Para el LLM, `LlmProvider` expone `chat()` y `stream()`, con tool calls, un `stopReason` normalizado (`end | tool_use | max_tokens | refusal`) y token usage. Hay adapters para Anthropic y Gemini. Tres invariantes valen para todo adapter:

1. `providerState` es opaco: el adapter guarda el contenido crudo del assistant y lo reenvía tal cual (replay). Así se preservan los thinking blocks de Anthropic y las thought signatures de Gemini entre turnos con tools.
2. Los mensajes `tool` consecutivos se fusionan (merge) en un único turno de usuario (parallel tool results).
3. Los stop o finish reasons desconocidos lanzan un error (throw) en vez de adivinarse.

Los ports se introducen solo donde hay lógica que aislar. El catálogo `products`, de solo lectura, inyecta Drizzle directamente y se cubre con integration tests.

## Alternativas consideradas

- **Llamar a los SDKs directamente desde los services.** Menos código, pero acopla el loop del agente a un solo provider y convierte la comparación de providers en una reescritura.
- **Una abstracción de framework (LangChain, Vercel AI SDK).** Más rápida para empezar, pero oculta las diferencias entre providers que la tesis necesita estudiar, como las thought signatures y los stop reasons.
- **Ports en todas partes, incluido el catálogo.** Es uniforme, pero agrega indirección sin nada que aislar.

## Consecuencias

- Agregar un provider implica un nuevo adapter, una entrada en el enum `LLM_PROVIDER` y su API key en `API_KEY_BY_PROVIDER`. El agente no cambia.
- Los adapters se testean con el cliente del SDK inyectado por constructor y reemplazado por un fake, así que los tests nunca tocan la red.
- El contrato normalizado puede ocultar features propias de un provider. Lo que no encaje viaja en `providerState` o exige extender el port.
