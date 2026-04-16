# AGENTS.md

Quick-start reference for AI agents. Every line answers: "Would an agent likely miss this without help?"

---

## Commands

```bash
# Repo root (Bun workspaces)
bun install
bun run dev          # Next.js dev server (apps/web only)
bun run build        # core typecheck THEN web build — order matters
bun run test         # core + web in separate processes (see below)
bun run check        # biome lint + format, auto-fix — run before committing
bun run typecheck    # tsc --noEmit across all packages
bun run lazycheck    # biome check + full build
```

Single-package (use `workdir`, not `cd &&`):

```bash
bun test                                             # workdir: packages/core
bun test tests/agents/runner.test.ts                 # workdir: packages/core
bun test                                             # workdir: apps/web
npx tsc --noEmit                                     # workdir: packages/core OR apps/web
```

---

## Test isolation — critical

Root script is `bash -c 'cd packages/core && bun test && cd ../../apps/web && bun test'`.

**Never merge into one `bun test` call.** `mock.module` in bun:test is process-global; both suites in one process leak mocks and cause false failures.

---

## Mocking pattern for agent tests

`@anthropic-ai/sdk` must be mocked **before** the module under test is imported:

```ts
mock.module("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic { messages = { create: mockCreate }; },
}));

const { runAgent } = await import("../../src/agents/runner"); // dynamic import AFTER mock
```

Orchestrator tests do **not** mock the runner — they test `makeOrchestratorTools` directly to avoid leakage.

---

## Monorepo layout

```
packages/core/   @team-pulse/core  — business logic, agents, API clients. No framework.
apps/web/        @team-pulse/web   — Next.js 14 App Router. Imports ONLY from @team-pulse/core.
```

- `packages/core/src/index.ts` is the sole public API surface. Web never imports from internal paths.
- `packages/core/package.json` exports `"."` → `./src/index.ts` — no compile step; tsc is type-check only.
- Path alias `$/*` → `./src/*` is per-package, not cross-package.
- `apps/web/tsconfig.json` resolves `@team-pulse/core` → `../../packages/core/src/index.ts` (source, not dist).

---

## Agent architecture

`runner.ts` is the **only** place that calls the Anthropic SDK. Every agent goes through it.
- Default model: `claude-sonnet-4-20250514`, max 10 iterations, parallel tool calls via `Promise.all`.
- Tool handlers are built dynamically; teams without `githubRepos` or `linearTeamIds` silently omit those tools.

Two summarization entry points:
- **v1** `generateTeamSummary()` — single-shot Claude call, Slack + GitHub only.
- **v2** `generateTeamSummaryV2(team)` — multi-agent orchestrator, GitHub + Linear agents. Triggered by `POST /api/refresh/[slug]?v=2`.

`/api/insights` (IA Mario) is **not** an agent loop — it is a no-tool `runAgent` call with pre-aggregated stats JSON. Output is Spanish-language JSON (`weekSummary`, `velocity`, `topPerformers`, `risks`, `recommendations`).

---

## Display name mappings — keep three files in sync

When adding or renaming a team member, update **all three**:

1. `packages/core/src/agents/person-agent.ts` — `PERSON_ALIASES` (search term → GitHub username + Linear name)
2. `apps/web/src/app/api/members/route.ts` — `DISPLAY_NAMES` (Linear email → display name) + `GITHUB_NAMES` (GitHub login → display name)
3. `apps/web/src/app/api/insights/route.ts` — `DISPLAY_NAMES` (Linear email → display name)

---

## Adding a new team

Edit only `packages/core/src/teams.config.ts`. No other wiring needed.

---

## Cache

In-memory, 15-minute TTL, keyed by `teamSlug`. Lives in the Next.js process — resets on restart. No persistent store.

---

## Web API non-obvious behavior

- `GET /api/members` fetches 336 hours (2 weeks) of Linear + GitHub on every call — no caching.
- `POST /api/refresh/[slug]` without `?v=2` → v1 (Slack + GitHub); with `?v=2` → v2 multi-agent orchestrator (no Slack).
- Route handlers are imported and invoked directly in tests with `new Request(url)` — no HTTP server needed.

---

## Code style (Biome 1.9)

- **Tabs**, line width 100, **double quotes**, **semicolons always**, **trailing commas**
- `import type` required for type-only imports (`verbatimModuleSyntax: true`)
- `noNonNullAssertion` is **off**; `noExplicitAny` is **warn** (not error)
- `bunx biome check --write .` auto-fixes; equivalent to `bun run check`

---

## Environment

`.env.local` in `apps/web/` (not the repo root). Template: `apps/web/.env.example`.

```
ANTHROPIC_API_KEY    # required for all Claude calls
GITHUB_TOKEN         # required for GitHub data (PAT, scope: repo)
LINEAR_API_KEY       # required for Linear data
SLACK_BOT_TOKEN      # required for Slack data
```

Token-gated tests use `it.skipIf(!process.env.GITHUB_TOKEN)` — they skip silently, not fail.

---

## No npm, no package-lock.json

Bun only. Never run `npm install` or commit `package-lock.json`.
