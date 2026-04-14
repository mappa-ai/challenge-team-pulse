# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
bun install                # install all workspace dependencies
bun run dev                # start Next.js dev server (apps/web)
bun run build              # type-check core then build web (core must build first)
bun run test               # run all tests (core + web in separate processes)
bun run check              # biome lint + format (auto-fix)
bun run format             # biome format only
bun run typecheck          # tsc --noEmit across all packages
bun run lazycheck          # biome check + full build
```

Running tests for a single package (must `cd` into the package first):
```bash
cd packages/core && bun test                    # all core tests
cd apps/web && bun test                         # all web tests
cd packages/core && bun test tests/agents/runner.test.ts   # single test file
```

Type-check a single package:
```bash
cd packages/core && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

Environment setup:
```bash
cp apps/web/.env.example apps/web/.env.local    # then fill in real tokens
```

## Code Style (enforced by Biome)

- **Tabs** for indentation, **100** char line width
- **Double quotes**, **semicolons always**, **trailing commas**
- Imports auto-sorted by Biome (`bunx biome check --write`)
- `import type` required for type-only imports (`verbatimModuleSyntax` enabled)
- Path alias: `$/*` maps to `./src/*` within each package
- Cross-package imports use `@team-pulse/core` (workspace dependency)
- **No npm** — Bun only. `package-lock.json` should not exist.

## Architecture

Bun monorepo with two workspaces:

- **`packages/core`** (`@team-pulse/core`) — business logic, API clients, AI agents. No framework dependency.
- **`apps/web`** (`@team-pulse/web`) — Next.js 14 App Router dashboard. Imports everything from `@team-pulse/core`.

### Multi-Agent System (`packages/core/src/agents/`)

Three Claude-based agents using the tool_use loop pattern (default model: `claude-sonnet-4-20250514`, 4096 max tokens):

1. **Runner** (`runner.ts`) — Generic agent loop. Sends messages to Claude, executes tool calls in parallel via `Promise.all`, feeds results back. Max 10 iterations. Every agent uses this.
2. **GitHub Agent** (`github-agent.ts`) — 3 tools (`fetch_pull_requests`, `fetch_issues`, `fetch_commits`) wrapping clients from `github.ts`. Default 48h lookback.
3. **Linear Agent** (`linear-agent.ts`) — 3 tools (`fetch_linear_issues`, `fetch_linear_cycles`, `fetch_linear_projects`) wrapping clients from `linear.ts`.
4. **Orchestrator** (`orchestrator.ts`) — Meta-tools that delegate to the GitHub and Linear agents. Produces the final `TeamSummary`. Entry point: `generateTeamSummaryV2(team)`.

Agent type abstractions (`agents/types.ts`): `ToolHandler` (definition + execute fn), `AgentConfig`, `AgentResult`.

Tools are built dynamically from team config — if a team has no `linearTeamIds`, the Linear tool is not offered to the orchestrator. If no `githubRepos`, the GitHub tool is omitted.

### API Route Versioning

- **Default (v1):** Fetches all Slack + GitHub data, normalizes, single-shot Claude call via `generateTeamSummary()`.
- **`?v=2` (v2):** Multi-agent orchestrator via `generateTeamSummaryV2()`. Activated by query param on refresh routes or `v: "2"` in summarize body.

### Key Types (`packages/core/src/types.ts`)

- `ActivityItem` — normalized data from any source. `source`: slack | github | linear. `type`: message | pr | issue | commit | linear_issue | linear_cycle | linear_project.
- `TeamSummary` — Claude's output (workingOn, recentChanges, blockedOrAtRisk, sources)
- `TeamConfig` — team definition with slackChannels, githubRepos, linearTeamIds
- `SourceRef` — label + url pair for linking back to data sources

### Other Key Modules

- **`cache.ts`** — In-memory cache with 15-minute TTL for team summaries.
- **`teams.config.ts`** — Team definitions array and `getTeamBySlug()` helper. Add new teams here.
- **`normalizer.ts`** — Normalizes `ActivityItem[]` from all sources and formats for Claude prompts (v1).

### Barrel Export

All public API is exported from `packages/core/src/index.ts`. Web app imports exclusively from `@team-pulse/core`, never from internal paths.

## Testing Patterns

- **bun:test** with `describe`/`it`/`expect`
- Core and web tests must run in **separate processes** — this is why `bun run test` uses `bash -c` to `cd` into each package sequentially. `mock.module` in bun:test is global and leaks across files if run in one process.
- Agent runner tests mock `@anthropic-ai/sdk` at module level, then import runner via `await import()` **after** mocking
- Orchestrator tests do NOT mock the runner — they test `makeOrchestratorTools` directly to avoid mock leaking
- API route tests import Next.js handler functions directly and call them with `new Request()`
- Tests requiring real API tokens use `it.skipIf(!hasToken)` pattern

## Environment Variables

```
ANTHROPIC_API_KEY    # required for all Claude calls
GITHUB_TOKEN         # required for GitHub data
LINEAR_API_KEY       # required for Linear data (v2 agents)
SLACK_BOT_TOKEN      # required for Slack data (v1)
```

Stored in `apps/web/.env.local` (gitignored). Template at `apps/web/.env.example`.
