# Team Pulse

Internal ops dashboard that summarizes what each team is working on — powered by a **multi-agent AI system**. Three Claude-based agents autonomously fetch data from **GitHub** and **Linear**, then synthesize concise team snapshots for leadership.

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

Each agent runs a **tool_use loop**: Claude decides which tools to call, we execute them, send results back, repeat until Claude has enough data to produce its analysis.

### Single-Shot Mode (v1)

The original pipeline is still available as the default: fetch all data upfront, normalize, send to Claude in one prompt.

## Monorepo Structure

```
team-pulse/
├── apps/
│   └── web/                        @team-pulse/web — Next.js 14 dashboard
│       ├── src/app/                Pages + API routes
│       ├── src/components/         TeamCard, SummaryView, FreshnessIndicator
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
│       │   │   └── orchestrator.ts Orchestrator (delegates to sub-agents)
│       │   ├── github.ts           GitHub API client (Octokit)
│       │   ├── linear.ts           Linear API client (@linear/sdk)
│       │   ├── slack.ts            Slack API client
│       │   ├── claude.ts           Single-shot summarization (v1)
│       │   ├── cache.ts            In-memory cache with 15min TTL
│       │   ├── normalizer.ts       Activity normalization
│       │   ├── teams.config.ts     Team definitions
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
| `SLACK_BOT_TOKEN` | Slack data (v1) | Slack App > OAuth > Bot Token |

### Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and hit **Refresh All** to generate summaries.

## Agent Modes

### v1: Single-Shot (default)

```bash
curl -X POST http://localhost:3000/api/refresh/ops
```

Fetches all Slack + GitHub data upfront, normalizes it, sends everything to Claude in one prompt.

### v2: Multi-Agent Orchestrator

```bash
curl -X POST "http://localhost:3000/api/refresh/ops?v=2"
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
| `bun run test`     | Run all 76 tests across core and web      |
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
| POST   | `/api/summarize`       | Run full pipeline (v1 default, v2 with `v: "2"` in body) |
| POST   | `/api/refresh/[slug]`  | One-click refresh (v1 default, v2 with `?v=2`) |

## Teams Configuration

Teams are defined in `packages/core/src/teams.config.ts`:

```typescript
{
  slug: "ops",
  name: "Operations",
  slackChannels: ["ops-general", "ops-incidents"],
  githubRepos: ["acme/infra", "acme/deploy-tools"],
  linearTeamIds: [],
  color: "#4a7aff",
}
```

Add Linear team IDs to enable the Linear agent for a team:

```typescript
linearTeamIds: ["team-abc-123"],
```

## Tests

76 tests across 11 files:

**Core — 55 tests:**
- Agent runner: tool_use loop, error handling, max iterations, parallel tool calls
- GitHub Agent: tool definitions, schemas, handler wiring
- Linear Agent: tool definitions, schemas, handler wiring
- Orchestrator: tool delegation logic based on team config
- Teams config: validation, uniqueness, required fields
- Normalizer: sorting, formatting, edge cases
- Cache: set/get, TTL, overwrite

**Web — 21 tests (2 skip without tokens):**
- API route handlers (GET/POST), 404 handling
- Cache-to-API integration flow
- Ingest endpoints with token-gated tests

```bash
bun run test
```
