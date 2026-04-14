# Team Pulse

Internal ops dashboard that summarizes what each team is working on — powered by AI. Ingests live data from **Slack** and **GitHub**, sends it through **Claude** for summarization, and renders concise team snapshots for leadership.

## Architecture

```
┌─────────────┐     ┌─────────────┐
│  Slack API  │     │ GitHub API  │
│  (messages) │     │ (PRs/issues)│
└──────┬──────┘     └──────┬──────┘
       │                   │
       └────────┬──────────┘
                ▼
        ┌───────────────┐
        │   Ingestion   │
        │  (normalize)  │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  Claude API   │
        │  (summarize)  │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  In-memory    │
        │  Cache (15m)  │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │   Next.js     │
        │  Dashboard    │
        └───────────────┘
```

## Monorepo Structure

```
team-pulse/
├── apps/
│   └── web/                     @team-pulse/web — Next.js 14 dashboard
│       ├── src/app/             Pages + API routes
│       ├── src/components/      TeamCard, SummaryView, FreshnessIndicator
│       └── tests/               Integration tests (API routes)
│
├── packages/
│   └── core/                    @team-pulse/core — shared business logic
│       ├── src/                 Slack, GitHub, Claude clients + cache + normalizer
│       └── tests/               Unit tests (config, normalizer, cache)
│
├── biome.json                   Formatter + linter (Biome)
├── tsconfig.base.json           Shared TS config
└── package.json                 Bun workspace root
```

## Stack

| Layer       | Tool                          |
|-------------|-------------------------------|
| Runtime/PM  | Bun                           |
| Framework   | Next.js 14 (App Router)       |
| Language    | TypeScript (strict, ESNext)   |
| Styling     | Tailwind CSS                  |
| AI          | Claude API (Sonnet)           |
| Integrations| Slack Web API, GitHub Octokit |
| Linter      | Biome                         |
| Tests       | bun:test                      |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- API tokens for Slack, GitHub, and Anthropic

### Install

```bash
bun install
```

### Configure

Copy the env example and fill in your tokens:

```bash
cp apps/web/.env.example apps/web/.env.local
```

```
SLACK_BOT_TOKEN=xoxb-your-token
GITHUB_TOKEN=ghp_your-token
ANTHROPIC_API_KEY=sk-ant-your-key
```

**Slack App scopes needed:** `channels:history`, `channels:read`, `groups:history`

**GitHub PAT scope needed:** `repo`

### Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and hit **Refresh All** to generate summaries.

## Scripts

| Command            | What it does                              |
|--------------------|-------------------------------------------|
| `bun run dev`      | Start Next.js dev server                  |
| `bun run build`    | Type-check core + build web               |
| `bun run test`     | Run all 46 tests across core and web      |
| `bun run check`    | Biome lint + format                       |
| `bun run format`   | Biome format only                         |
| `bun run typecheck`| TypeScript type-check all packages        |
| `bun run lazycheck`| Biome check + full build                  |

## API Endpoints

| Method | Route                  | Description                                    |
|--------|------------------------|------------------------------------------------|
| GET    | `/api/teams`           | List all teams with cached summaries           |
| GET    | `/api/teams/[slug]`    | Get a specific team and its summary            |
| POST   | `/api/ingest/slack`    | Ingest recent Slack messages for a team        |
| POST   | `/api/ingest/github`   | Ingest recent PRs, issues, commits for a team  |
| POST   | `/api/summarize`       | Run full pipeline: ingest + Claude + cache     |
| POST   | `/api/refresh/[slug]`  | One-click refresh for a specific team          |

## Teams Configuration

Teams are defined in `packages/core/src/teams.config.ts`. Each team maps to Slack channels and GitHub repos:

```typescript
{
  slug: "ops",
  name: "Operations",
  slackChannels: ["ops-general", "ops-incidents"],
  githubRepos: ["acme/infra", "acme/deploy-tools"],
  color: "#4a7aff",
}
```

## Tests

46 tests across 7 files, running in ~155ms:

- **Core** (25 tests): teams config validation, normalizer sorting/formatting, cache set/get/TTL
- **Web** (21 tests): API route handlers (GET/POST), 404 handling, cache-to-API integration flow
- 2 tests auto-skip without API tokens, run automatically when tokens are set

```bash
bun run test
```
