# ADR 0001: Ports and adapters for external dependencies

- Status: Accepted
- Date: 2026-10-15 (recorded retroactively; decided in phase 0)

## Context

The agent depends on an LLM vendor, and the thesis compares several providers (phase 9). Business logic also needs persistence. If services call vendor SDKs or the database directly, swapping a provider or testing the logic without network and database becomes expensive.

## Decision

Domain-facing contracts are TypeScript interfaces in `*.port.ts` files, each paired with a `Symbol` injection token, because interfaces do not exist at runtime and Nest injects by token. Adapters in an `adapters/` folder implement the port and translate in both directions between the port's types and the vendor SDK.

- The port never exposes SDK types.
- The module's `useFactory` is the only place that knows which adapter is used.
- Consumers inject with `@Inject(TOKEN)` and import the interface with `import type`.

For the LLM, `LlmProvider` exposes `chat()` and `stream()`, with tool calls, a normalized `stopReason` (`end | tool_use | max_tokens | refusal`) and token usage. Adapters exist for Anthropic and Gemini. Three invariants hold for every adapter:

1. `providerState` is opaque: the adapter stores the raw assistant content and replays it verbatim. This preserves Anthropic thinking blocks and Gemini thought signatures across tool-use turns.
2. Consecutive `tool` messages are merged into a single user turn (parallel tool results).
3. Unknown stop or finish reasons throw instead of being guessed.

Ports are introduced only where there is logic to isolate. The read-only `products` catalog injects Drizzle directly and is covered by integration tests.

## Alternatives considered

- **Call SDKs directly from services.** Less code, but it couples the agent loop to one vendor and makes provider comparison a rewrite.
- **A framework abstraction (LangChain, Vercel AI SDK).** Faster to start, but it hides the provider differences the thesis needs to study, such as thought signatures and stop reasons.
- **Ports everywhere, including the catalog.** Uniform, but it adds indirection with nothing to isolate.

## Consequences

- Adding a provider means a new adapter, an entry in the `LLM_PROVIDER` enum and its API key in `API_KEY_BY_PROVIDER`. The agent does not change.
- Adapters are tested with the SDK client injected through the constructor and replaced by a fake, so tests never hit the network.
- The normalized contract can hide vendor-specific features. Anything that does not fit travels in `providerState` or requires extending the port.
