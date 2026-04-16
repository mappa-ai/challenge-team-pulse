# Team Pulse

Dashboard interno que trackea el rendimiento del equipo en **GitHub** y **Linear**, impulsado por un sistema multi-agente con Claude.

## Agentes

| Agente | Qué hace |
|--------|----------|
| **Orchestrator** | Coordina a los sub-agentes y produce el resumen del equipo |
| **GitHub Agent** | Fetcha PRs, issues y commits |
| **Linear Agent** | Fetcha issues, cycles y proyectos |
| **Person Agent** | Busca la actividad de una persona específica (GitHub + Linear) |
| **IA Mario** | Analiza el rendimiento del equipo y genera insights en español |

Todos los agentes corren el mismo loop `tool_use` vía `runner.ts`. Claude decide qué tools llamar, las ejecutamos, devolvemos resultados, hasta que termina.

## Stack

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router)
- **AI**: Claude Sonnet via `@anthropic-ai/sdk`
- **Integraciones**: GitHub (Octokit), Linear SDK, Slack Web API
- **Linter/Formatter**: Biome
- **Tests**: bun:test

## Setup

```bash
bun install
cp apps/web/.env.example apps/web/.env.local
# llenar tokens en .env.local
bun run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

```
ANTHROPIC_API_KEY   # requerido siempre
GITHUB_TOKEN        # PAT con scope: repo
LINEAR_API_KEY      # Personal API key de Linear
SLACK_BOT_TOKEN     # Bot token con scopes: channels:read, channels:history
```

## Comandos

```bash
bun run dev        # servidor de desarrollo
bun run test       # todos los tests
bun run check      # lint + format (Biome)
bun run build      # typecheck + build
```

## Estructura

```
packages/core/   — lógica de negocio, agentes, clientes API
apps/web/        — dashboard Next.js, importa solo de @team-pulse/core
```
