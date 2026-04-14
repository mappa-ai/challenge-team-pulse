# Team Pulse

Internal engineering dashboard that tracks team performance across **GitHub** and **Linear** — powered by a **multi-agent AI system**. Claude-based agents autonomously fetch data, analyze individual and team performance, and generate actionable insights for leadership.

## Architecture

### Multi-Agent System

```
                    ┌───────────────────────┐
                    │   Orchestrator Agent   │
                    │      (Claude AI)       │
                    └───────┬───────┬───────┘
                            │       │
              tool_use      │       │      tool_use
         ┌──────────────────┘       └──────────────────┐
         ▼                                             ▼
┌─────────────────┐                          ┌─────────────────┐
│  GitHub Agent   │                          │  Linear Agent   │
│   (Claude AI)   │                          │   (Claude AI)   │
└──────┬──┬──┬────┘                          └──────┬──┬──┬────┘
       │  │  │                                      │  │  │
       │  │  └── fetch_commits                      │  │  └── fetch_linear_projects
       │  └───── fetch_issues                       │  └───── fetch_linear_cycles
       └──────── fetch_pull_requests                └──────── fetch_linear_issues
       │  │  │                                      │  │  │
       ▼  ▼  ▼                                      ▼  ▼  ▼
┌─────────────────┐                          ┌─────────────────┐
│   GitHub API    │                          │   Linear API    │
│    (Octokit)    │                          │  (@linear/sdk)  │
└─────────────────┘                          └─────────────────┘
```

### Person Search Agent

```
         ┌───────────────────────┐
         │  Person Search Agent  │
         │      (Claude AI)      │
         └───────┬───────┬───────┘
                 │       │
   Alias Map     │       │    Alias Map
  (GitHub login) │       │ (Linear name)
         ┌───────┘       └───────┐
         ▼                       ▼
   GitHub API              Linear API
   (by username)        (by assignee name)
```

A dedicated agent for searching a specific person's activity. Uses an **alias map** that bridges GitHub usernames and Linear display names automatically (e.g., searching "Juan" finds `jgtavarez` on GitHub and "Juan Gabriel Tavarez" on Linear).

### IA Mario — Team Insights Engine

Claude-powered analysis that reviews all team members' metrics and generates:
- Weekly performance summary
- Velocity assessment
- Top performers highlights
- Risk identification
- 3 actionable recommendations for the next sprint

Each agent runs a **tool_use loop**: Claude decides which tools to call, we execute them, send results back, repeat until Claude has enough data to produce its analysis.

## Dashboard Features

### Overview Dashboard
- **Team Leaderboard** — All members ranked by activity with:
  - Linear issues (done/total), PRs, commits per person
  - Completion rate progress bar with color coding
  - Click any member to see their full analytics
- **Stats Row** — Team Members, Issues Done, Pull Requests, Commits, Avg Completion %
- **Donut Chart** — Issue distribution (Done / In Progress / To Do)
- **GitHub Activity** summary card
- **IA Mario Analysis** button — generates AI team insights on demand

### Person Search (`/search`)
- Search any team member by name (supports partial matches)
- **AI Summary** — IA Mario analyzes the person's contributions
- **Circular completion chart** with % done
- **Status breakdown bars** (Done / In Progress / To Do for Linear, Merged / Open for PRs)
- **Metric cards** (total activity, issue counts)
- **Activity tables** with Linear issue IDs (DEV-2742), real Linear states (In Progress, To Do, Backlog, Done), and GitHub PR status

### Team Detail Page (`/team/[slug]`)
Two tabs:
- **Summary** — AI-generated snapshot (working on, recent changes, blocked/at risk, sources)
- **Activity** — Data tables for Pull Requests, Linear Issues (with IDs and real states), GitHub Issues, and Commits

### Sidebar Navigation
Fixed sidebar with team links, People Search shortcut, and embedded search bar.

## Monorepo Structure

```
team-pulse/
├── apps/
│   └── web/                        @team-pulse/web — Next.js 14 dashboard
│       ├── src/app/
│       │   ├── api/
│       │   │   ├── teams/          GET /api/teams, GET /api/teams/[slug]
│       │   │   ├── refresh/        POST /api/refresh/[slug] (?v=2 for multi-agent)
│       │   │   ├── activity/       GET /api/activity/[slug] — raw activity data
│       │   │   ├── members/        GET /api/members — team leaderboard data
│       │   │   ├── insights/       POST /api/insights — IA Mario team analysis
│       │   │   ├── search/person/  POST /api/search/person — person search
│       │   │   └── ingest/         POST slack/github ingestion
│       │   ├── team/[slug]/        Team detail (Summary + Activity tabs)
│       │   └── search/             Person search with analytics
│       ├── src/components/
│       │   ├── Sidebar.tsx         Fixed sidebar with nav + search
│       │   ├── ActivityTable.tsx   Dark-themed table with status badges
│       │   ├── PersonSearchResults.tsx  Analytics dashboard per person
│       │   ├── TabBar.tsx          Tab switcher
│       │   ├── StatCard.tsx        Metric card
│       │   ├── PersonSearchBar.tsx Search input
│       │   ├── TeamCard.tsx        Team card
│       │   ├── SummaryView.tsx     AI summary display
│       │   ├── FreshnessIndicator.tsx  Time-since-update badge
│       │   └── SourceLink.tsx      External source link
│       └── tests/                  Integration tests
│
├── packages/
│   └── core/                       @team-pulse/core — business logic
│       ├── src/
│       │   ├── agents/
│       │   │   ├── types.ts        ToolHandler, AgentConfig, AgentResult
│       │   │   ├── runner.ts       Generic tool_use loop (max 10 iterations)
│       │   │   ├── github-agent.ts GitHub Agent (3 tools)
│       │   │   ├── linear-agent.ts Linear Agent (3 tools)
│       │   │   ├── orchestrator.ts Orchestrator (delegates to sub-agents)
│       │   │   └── person-agent.ts Person Search Agent with alias map
│       │   ├── github.ts           GitHub API client (Octokit)
│       │   ├── linear.ts           Linear API client with assignee search
│       │   ├── slack.ts            Slack API client (channel IDs + names)
│       │   ├── claude.ts           Single-shot summarization (v1)
│       │   ├── cache.ts            In-memory cache with 15min TTL
│       │   ├── normalizer.ts       Activity normalization
│       │   ├── teams.config.ts     Team definitions
│       │   └── types.ts            Shared types (ActivityItem with identifier)
│       └── tests/                  Unit + agent tests
│
├── biome.json                      Formatter + linter (Biome)
├── tsconfig.base.json              Shared TS config
└── package.json                    Bun workspace root
```

## Stack

| Layer        | Tool                                     |
|--------------|------------------------------------------|
| Runtime/PM   | Bun                                      |
| Framework    | Next.js 14 (App Router)                  |
| Language     | TypeScript (strict, ESNext)              |
| Styling      | Tailwind CSS                             |
| AI           | Claude API (Sonnet) with tool_use        |
| Integrations | GitHub Octokit, Linear SDK, Slack Web API|
| Linter       | Biome                                    |
| Tests        | bun:test                                 |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- API tokens for Anthropic, GitHub, and optionally Linear and Slack

### Install

```bash
bun install
```

### Configure

```bash
cp apps/web/.env.example apps/web/.env.local
```

```
SLACK_BOT_TOKEN=xoxb-your-token
GITHUB_TOKEN=ghp_your-token
ANTHROPIC_API_KEY=sk-ant-your-key
LINEAR_API_KEY=lin_api_your-key
```

| Token | Required for | How to get it |
|-------|-------------|---------------|
| `ANTHROPIC_API_KEY` | All modes | [console.anthropic.com](https://console.anthropic.com) |
| `GITHUB_TOKEN` | GitHub data | Settings > Developer > PAT (scope: `repo`) |
| `LINEAR_API_KEY` | Linear data | Settings > API > Personal API keys |
| `SLACK_BOT_TOKEN` | Slack data | Slack App > OAuth > Bot Token (scopes: `channels:read`, `channels:history`, `groups:read`, `groups:history`) |

### Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard with team leaderboard. Click **IA Mario Analysis** to generate AI insights.

## Person Alias Map

The person search bridges GitHub usernames and Linear display names automatically:

| Search Term | GitHub Username | Linear Name |
|-------------|----------------|-------------|
| Juan | jgtavarez | Juan Gabriel Tavarez |
| Daniel Moretti | drsh4dow | Daniel Moretti |
| Mateus | mateusmenesesDev | Mateus Meneses |
| Greynner | Greynner | greynner@mappa.ai |
| Yordi | yordi024 | yordi@mappa.ai |
| Robinson | robinsonur | Robinson Ureña Rodríguez |

Aliases are defined in `packages/core/src/agents/person-agent.ts`. Add new team members there.

## API Endpoints

| Method | Route                     | Description                                    |
|--------|---------------------------|------------------------------------------------|
| GET    | `/api/teams`              | List all teams with cached summaries           |
| GET    | `/api/teams/[slug]`       | Get a specific team and its summary            |
| GET    | `/api/activity/[slug]`    | Raw activity items (PRs, issues, Linear) for a team |
| GET    | `/api/members`            | Team leaderboard with per-member GitHub + Linear stats |
| POST   | `/api/refresh/[slug]`     | Generate AI summary (v2 multi-agent with `?v=2`) |
| POST   | `/api/search/person`      | Person search with AI analysis + all activity  |
| POST   | `/api/insights`           | IA Mario team performance analysis             |
| POST   | `/api/ingest/slack`       | Ingest recent Slack messages for a team        |
| POST   | `/api/ingest/github`      | Ingest recent PRs, issues, commits for a team  |

## Scripts

| Command            | What it does                              |
|--------------------|-------------------------------------------|
| `bun run dev`      | Start Next.js dev server                  |
| `bun run build`    | Type-check core + build web               |
| `bun run test`     | Run all 82 tests across core and web      |
| `bun run check`    | Biome lint + format                       |
| `bun run format`   | Biome format only                         |
| `bun run typecheck`| TypeScript type-check all packages        |
| `bun run lazycheck`| Biome check + full build                  |

## Tests

82 tests across 12 files:

**Core — 64 tests:**
- Agent runner: tool_use loop, error handling, max iterations, parallel tool calls
- GitHub Agent: tool definitions, schemas, handler wiring
- Linear Agent: tool definitions, schemas, handler wiring
- Orchestrator: tool delegation logic based on team config
- Person Agent: tool creation, schemas, conditional tools based on config
- Teams config: validation, uniqueness, required fields
- Normalizer: sorting, formatting, edge cases
- Cache: set/get, TTL, overwrite

**Web — 18 tests (2 skip without tokens):**
- API route handlers (GET/POST), 404 handling
- Cache-to-API integration flow
- Ingest endpoints with token-gated tests

```bash
bun run test
```
