# Team Pulse

Internal ops dashboard that summarizes what each team is working on — powered by a **multi-agent AI system**. Claude-based agents autonomously fetch data from **GitHub**, **Linear**, and **Slack**, then synthesize concise team snapshots for leadership.

## Architecture

### Multi-Agent System (v2)

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
   tool_use      │       │      tool_use
         ┌───────┘       └───────┐
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ search_github    │   │ search_linear    │
│ _activity        │   │ _activity        │
│ (by username)    │   │ (by display name)│
└────────┬─────────┘   └────────┬─────────┘
         ▼                       ▼
   GitHub API              Linear API
```

A dedicated agent for searching a specific person's activity across all teams. Handles the GitHub username vs Linear display name mismatch automatically.

### Single-Shot Mode (v1)

The original pipeline is still available as the default: fetch all data upfront, normalize, send to Claude in one prompt.

Each agent runs a **tool_use loop**: Claude decides which tools to call, we execute them, send results back, repeat until Claude has enough data to produce its analysis.

## Monorepo Structure

```
team-pulse/
├── apps/
│   └── web/                        @team-pulse/web — Next.js 14 dashboard
│       ├── src/app/                Pages + API routes
│       │   ├── api/
│       │   │   ├── teams/          GET /api/teams, GET /api/teams/[slug]
│       │   │   ├── refresh/        POST /api/refresh/[slug] (v1/v2)
│       │   │   ├── activity/       GET /api/activity/[slug] — raw activity data
│       │   │   ├── search/person/  POST /api/search/person — person search agent
│       │   │   └── ingest/         POST slack/github ingestion
│       │   ├── team/[slug]/        Team detail page (Summary + Activity tabs)
│       │   └── search/             Person search results page
│       ├── src/components/
│       │   ├── Sidebar.tsx         Fixed sidebar with team nav + search
│       │   ├── ActivityTable.tsx   Reusable dark-themed data table
│       │   ├── TabBar.tsx          Tab switcher component
│       │   ├── StatCard.tsx        Metric card for dashboard
│       │   ├── PersonSearchBar.tsx Search input (navigates to /search)
│       │   ├── PersonSearchResults.tsx  AI summary + grouped activity tables
│       │   ├── TeamCard.tsx        Team card for dashboard grid
│       │   ├── SummaryView.tsx     AI-generated summary display
│       │   ├── FreshnessIndicator.tsx  Time-since-update badge
│       │   └── SourceLink.tsx      External source link pill
│       └── tests/                  Integration tests (API routes)
│
├── packages/
│   └── core/                       @team-pulse/core — shared business logic
│       ├── src/
│       │   ├── agents/             Multi-agent system
│       │   │   ├── types.ts        ToolHandler, AgentConfig, AgentResult
│       │   │   ├── runner.ts       Generic tool_use loop (max 10 iterations)
│       │   │   ├── github-agent.ts GitHub Agent (3 tools)
│       │   │   ├── linear-agent.ts Linear Agent (3 tools)
│       │   │   ├── orchestrator.ts Orchestrator (delegates to sub-agents)
│       │   │   └── person-agent.ts Person Search Agent (2 tools)
│       │   ├── github.ts           GitHub API client (Octokit)
│       │   ├── linear.ts           Linear API client (@linear/sdk)
│       │   ├── slack.ts            Slack API client (supports channel IDs + names)
│       │   ├── claude.ts           Single-shot summarization (v1)
│       │   ├── cache.ts            In-memory cache with 15min TTL
│       │   ├── normalizer.ts       Activity normalization
│       │   ├── teams.config.ts     Team definitions (4 teams)
│       │   └── types.ts            Shared types
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
| `LINEAR_API_KEY` | Linear data (v2) | Settings > API > Personal API keys |
| `SLACK_BOT_TOKEN` | Slack data (v1) | Slack App > OAuth > Bot Token (scopes: `channels:read`, `channels:history`, `groups:read`, `groups:history`) |

### Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and hit **Refresh All** to generate summaries.

## Dashboard Features

### Sidebar Navigation

Fixed sidebar with team links, active state highlighting, and an embedded person search bar.

### Team Detail Page

Two tabs per team:

- **Summary** — AI-generated snapshot (working on, recent changes, blocked/at risk, sources)
- **Activity** — Data tables showing:
  - Pull Requests (author, title, repo, status, timestamp)
  - Linear Issues (assignee, title, status, labels, timestamp)
  - GitHub Issues and Commits

### Person Search

Type a person's name in the sidebar search bar to run the Person Search Agent. It searches across all configured GitHub repos and Linear teams, then returns:

- An AI-generated summary of the person's recent activity
- Grouped tables of their PRs, issues, commits, and Linear items

```bash
curl -X POST http://localhost:3000/api/search/person \
  -H "Content-Type: application/json" \
  -d '{"query": "greynner"}'
```

## Agent Modes

### v1: Single-Shot (default)

```bash
curl -X POST http://localhost:3000/api/refresh/platform
```

Fetches all Slack + GitHub data upfront, normalizes it, sends everything to Claude in one prompt.

### v2: Multi-Agent Orchestrator

```bash
curl -X POST "http://localhost:3000/api/refresh/platform?v=2"
```

The orchestrator agent decides what data to gather, delegates to specialized GitHub and Linear agents, each of which autonomously uses their tools to fetch relevant data, then the orchestrator synthesizes a unified team snapshot.

**Agent flow:**
1. Orchestrator receives the request and calls `run_github_analysis` and `run_linear_analysis`
2. GitHub Agent uses `fetch_pull_requests`, `fetch_issues`, `fetch_commits` as needed
3. Linear Agent uses `fetch_linear_issues`, `fetch_linear_cycles`, `fetch_linear_projects` as needed
4. Each sub-agent returns a structured analysis to the orchestrator
5. Orchestrator synthesizes both analyses into a final `TeamSummary`

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

## API Endpoints

| Method | Route                     | Description                                    |
|--------|---------------------------|------------------------------------------------|
| GET    | `/api/teams`              | List all teams with cached summaries           |
| GET    | `/api/teams/[slug]`       | Get a specific team and its summary            |
| GET    | `/api/activity/[slug]`    | Get raw activity items (PRs, issues, commits, Linear) for a team |
| POST   | `/api/refresh/[slug]`     | One-click refresh (v1 default, v2 with `?v=2`) |
| POST   | `/api/search/person`      | Search a person's activity across all teams    |
| POST   | `/api/ingest/slack`       | Ingest recent Slack messages for a team        |
| POST   | `/api/ingest/github`      | Ingest recent PRs, issues, commits for a team  |

## Teams Configuration

Teams are defined in `packages/core/src/teams.config.ts`:

```typescript
{
  slug: "platform",
  name: "Platform",
  slackChannels: ["C0600AB9J2Y"],       // supports channel IDs or names
  githubRepos: [
    "mappa-ai/mappa-main",
    "mappa-ai/mappa-db",
    "mappa-ai/mappa-ui",
    "mappa-ai/mappa-mastra",
    "mappa-ai/mappa-studio",
  ],
  linearTeamIds: ["5fdabca0-dc12-406f-9282-8e1806a923d2"],
  color: "#4a7aff",
}
```

**Current teams:** Platform, AI & Voice, Recruiting & Agents, Data & Infrastructure.

Add Linear team IDs to enable the Linear agent for a team. Slack channels accept both channel names (`general`) and channel IDs (`C0600AB9J2Y`).

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
