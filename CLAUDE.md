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

Claude-based agents using the tool_use loop pattern (default model: `claude-sonnet-4-20250514`, 4096 max tokens):

1. **Runner** (`runner.ts`) — Generic agent loop. Sends messages to Claude, executes tool calls in parallel via `Promise.all`, feeds results back. Max 10 iterations. Every agent uses this.
2. **GitHub Agent** (`github-agent.ts`) — 3 tools (`fetch_pull_requests`, `fetch_issues`, `fetch_commits`) wrapping clients from `github.ts`. Default 48h lookback.
3. **Linear Agent** (`linear-agent.ts`) — 3 tools (`fetch_linear_issues`, `fetch_linear_cycles`, `fetch_linear_projects`) wrapping clients from `linear.ts`.
4. **Orchestrator** (`orchestrator.ts`) — Meta-tools that delegate to the GitHub and Linear agents. Produces the final `TeamSummary`. Entry point: `generateTeamSummaryV2(team)`.
5. **Person Agent** (`person-agent.ts`) — Searches a person's activity across GitHub and Linear using an alias map. Two entry points: `runPersonAgent()` (agent-based, unused) and `searchPerson()` (direct fetch + Claude summary, 2048 max tokens). The alias map (`PERSON_ALIASES`) bridges search terms to GitHub usernames and Linear display names.

Agent type abstractions (`agents/types.ts`): `ToolHandler` (definition + execute fn), `AgentConfig`, `AgentResult`.

Tools are built dynamically from team config — if a team has no `linearTeamIds`, the Linear tool is not offered to the orchestrator. If no `githubRepos`, the GitHub tool is omitted.

### IA Mario — Team Insights (`/api/insights`)

Not an agent — a direct Claude call with pre-aggregated stats. Fetches 2-week Linear issues, computes per-member metrics (done/total/completion%), and sends structured JSON to Claude. Output is Spanish-language JSON with `weekSummary`, `velocity`, `topPerformers`, `risks`, `recommendations` (2048 max tokens).

### Display Name Mappings (3 locations — keep in sync)

Person names are hardcoded in three places:
- `packages/core/src/agents/person-agent.ts` — `PERSON_ALIASES` (search term → GitHub username + Linear name)
- `apps/web/src/app/api/members/route.ts` — `DISPLAY_NAMES` (Linear email → name) + `GITHUB_NAMES` (GitHub login → name)
- `apps/web/src/app/api/insights/route.ts` — `DISPLAY_NAMES` (Linear email → name)

When adding or renaming a team member, update all three.

### API Routes (`apps/web/src/app/api/`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/teams` | List all teams with cached summaries |
| GET | `/api/teams/[slug]` | Single team + summary |
| GET | `/api/activity/[slug]` | Raw normalized activity items for a team |
| GET | `/api/members` | Leaderboard: per-member Linear issues (done/total), PRs, commits, completionRate |
| POST | `/api/refresh/[slug]` | Generate AI summary (`?v=2` for multi-agent) |
| POST | `/api/search/person` | Person search with AI summary + all activity |
| POST | `/api/insights` | IA Mario team analysis (2-week performance) |
| POST | `/api/ingest/slack` | Ingest Slack messages for a team |
| POST | `/api/ingest/github` | Ingest GitHub data for a team |

**Versioning on refresh/summarize:** Default (v1) uses single-shot Claude via `generateTeamSummary()`. `?v=2` uses multi-agent orchestrator via `generateTeamSummaryV2()`.

### Key Types (`packages/core/src/types.ts`)

- `ActivityItem` — normalized data from any source. `source`: slack | github | linear. `type`: message | pr | issue | commit | linear_issue | linear_cycle | linear_project. Has an optional `identifier` field (e.g. "DEV-2742", PR #123) used as the primary link label in the UI.
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
