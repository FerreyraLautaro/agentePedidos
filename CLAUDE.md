# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A NestJS lab project: an LLM-powered ordering agent for a neighborhood grocery store, built phase by phase as the base of a master's thesis (TFM). The roadmap lives in `Laboratorio agente de pedidos en NestJS (TFM + entrevista).md`. Phases proceed in order; the checkboxes and the "Próximos pasos" list of the current phase are the source of truth for progress and the resume point between sessions.

## Working mode

- The user is learning. Before implementing, explain the concept and where each piece is instantiated or wired; then advance one step at a time and wait for confirmation. By default give instructions for the user to implement; write code directly only when asked.
- Talk to the user in Spanish. Code, comments, identifiers, commit messages, and PR descriptions are in English, using Conventional Commits.
- ADRs in `docs/adr/` (`NNNN-slug.md`: Contexto, Decisión, Alternativas consideradas, Consecuencias) are the user's study material: write them in Spanish, keeping technical terms in English (port, adapter, fake, lock, rollback, race, retry, unique index, etc.). File names stay in English. Add one whenever a design decision is explained.

## Commands

```bash
docker compose up -d                  # PostgreSQL 17 + pgvector, Redis 7 (reads .env)
docker compose down -v                # also wipes volumes; needed to re-run init SQL
npm run start:dev                     # Nest in watch mode (.env is read only at startup)
npx vitest run                        # unit tests (**/*.spec.ts)
npx vitest run src/llm/adapters/gemini.llm.spec.ts   # single file
npx vitest run -t "groups consecutive"               # single test by name
npm run test:int                      # integration tests (**/*.int-spec.ts) against agente_pedidos_test; needs Docker
npm run test:e2e                      # e2e tests (**/*.e2e-spec.ts)
npx tsc --noEmit                      # typecheck (source of truth when the editor shows stale errors)
npm run lint                          # oxlint --type-aware
npm run db:generate                   # drizzle-kit: generate a migration from src/database/schema.ts (read it before applying)
npm run db:migrate                    # apply pending migrations to the dev database
npm run db:seed                       # idempotent upsert of the catalog (src/database/seed/catalog.ts)
```

Integration tests create `<POSTGRES_DB>_test` if missing and apply the `drizzle/` migrations in a global setup; each test truncates and inserts its own fixtures, and files run sequentially.

`docker/postgres/init/*.sql` runs only when the Postgres volume is empty; it enables the `vector` extension. Later schema changes belong in migrations, not init scripts.

On Windows Git Bash (UCRT64), container paths passed to `docker exec` get rewritten to Windows paths; prefix the command with `MSYS_NO_PATHCONV=1`.

## Architecture

**Ports and adapters.** Domain-facing contracts are TypeScript interfaces in `*.port.ts` files, each paired with a `Symbol` injection token (interfaces do not exist at runtime, so Nest injects by token). Adapters in an `adapters/` folder implement the port and translate both ways between the port's types and a vendor SDK. The port must never expose SDK types. The module's `useFactory` is the only place that knows which adapter is used. Consumers inject with `@Inject(TOKEN)` and import the interface with `import type`.

**Configuration.** `src/config/env.schema.ts` validates `process.env` with Zod through `ConfigModule.forRoot({ isGlobal: true, validate })`, so the app fails at startup on bad config. The same `.env` feeds Docker Compose and Nest. Read config through `ConfigService<Env, true>` with `{ infer: true }`, never `process.env` directly. Adding a provider means extending the `LLM_PROVIDER` enum and `API_KEY_BY_PROVIDER`, so the matching key becomes required.

**LLM module (`src/llm/`).** `LlmProvider` (`llm-provider.port.ts`) exposes `chat()` and `stream()`, where `stream()` is an async generator yielding `text_delta` events and a final `done` event. It carries tool calls, a normalized `stopReason` (`end | tool_use | max_tokens | refusal`), and token usage. Adapters: `AnthropicLlm` (`@anthropic-ai/sdk`) and `GeminiLlm` (`@google/genai`); `openai` is in the enum but throws at startup until implemented. Key invariants every adapter must keep:
- `providerState` is opaque: the adapter stores the raw assistant content in it and replays it verbatim when that message is sent back. It preserves Anthropic thinking blocks and Gemini thought signatures across tool-use turns.
- Consecutive `tool` messages are merged into a single user turn (parallel tool results).
- Unknown provider stop/finish reasons throw instead of being guessed.

**Database (`src/database/`).** `DatabaseModule` is `@Global`: it builds a `pg` `Pool` (`PG_POOL`, fails startup if Postgres is unreachable, closed on shutdown) and a Drizzle instance exported as `DRIZZLE` (type `Database`). The schema in `schema.ts` is the single source for migrations in `drizzle/`. Money is stored as integer cents; invariants are also enforced by `CHECK` constraints. Scripts outside Nest (`drizzle.config.ts`, seed, test setup) read `.env` with `process.loadEnvFile()`.

**Domain modules — ports only where there is logic to isolate.** `products` is read-only catalog: `ProductsService` injects `DRIZZLE` directly and is covered by integration tests. `stock` and `orders` hold business rules, so they use repository ports (`STOCK_REPOSITORY`, ...) consumed by services that are unit-tested with in-memory fakes. `DrizzleStockRepository.decrement` is all-or-nothing in one transaction, uses a conditional `UPDATE ... WHERE quantity >= n`, merges duplicate lines and sorts by product id to avoid deadlocks. `src/orders/domain/order.ts` is pure (no framework imports): immutable functions and an explicit transition table (`draft → confirmed | cancelled`, `confirmed → cancelled`). Domain errors (`OrderRuleError`, `InsufficientStockError`) are plain `Error` subclasses; mapping them to HTTP status codes happens at the controller edge. Request input is validated with Zod through `ZodValidationPipe` (`src/common/`).

The plan's later phases build on this: an agent loop that consumes `LlmProvider`, a `ConversationStore` port with in-memory then Redis adapters, and tools that call domain services rather than the database.

## Conventions

- ESM with `module: nodenext`: relative imports must end in `.js`.
- Adapters are tested first (RED, then GREEN). The SDK client is injected through the constructor and replaced by a `vi.fn()` fake, so tests never hit the network. Assert both what the adapter returns and what it sends to the SDK (`mock.calls`).
- Model IDs come from env (`ANTHROPIC_MODEL`, `GEMINI_MODEL`); do not hardcode them in adapters.
