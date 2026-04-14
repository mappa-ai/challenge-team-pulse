import type { TeamConfig } from "../teams.config";
import type { SourceRef, TeamSummary } from "../types";
import { runGitHubAgent } from "./github-agent";
import { runLinearAgent } from "./linear-agent";
import { runAgent } from "./runner";
import type { ToolHandler } from "./types";

const SYSTEM_PROMPT = `You are an operations analyst synthesizing team activity into an executive summary.
You have tools to run specialized analyses of GitHub and Linear data.
Call your available tools to gather data, then synthesize a unified team snapshot.

Return your final answer as JSON with these exact keys:
- "workingOn": 2-3 sentences on current focus areas
- "recentChanges": What shipped or changed in the last 48h
- "blockedOrAtRisk": Any blockers, risks, or stalled items. If nothing is blocked, say so clearly.
- "sources": Array of {"label": string, "url": string} backing each claim

Be specific. Use names and link to artifacts.
Always return valid JSON — no markdown, no code fences, no extra text.`;

export function makeOrchestratorTools(team: TeamConfig): ToolHandler[] {
	const tools: ToolHandler[] = [];

	if (team.githubRepos.length > 0) {
		tools.push({
			definition: {
				name: "run_github_analysis",
				description:
					"Run the GitHub analysis agent to fetch and analyze PRs, issues, and commits across the team's repositories.",
				input_schema: {
					type: "object" as const,
					properties: {},
				},
			},
			execute: async () => {
				const result = await runGitHubAgent(team.githubRepos, team.name);
				return result.text;
			},
		});
	}

	if (team.linearTeamIds.length > 0) {
		tools.push({
			definition: {
				name: "run_linear_analysis",
				description:
					"Run the Linear analysis agent to fetch and analyze issues, cycles, and projects from the team's Linear workspace.",
				input_schema: {
					type: "object" as const,
					properties: {},
				},
			},
			execute: async () => {
				const result = await runLinearAgent(team.linearTeamIds, team.name);
				return result.text;
			},
		});
	}

	return tools;
}

export async function generateTeamSummaryV2(team: TeamConfig): Promise<TeamSummary> {
	const tools = makeOrchestratorTools(team);

	const result = await runAgent({
		systemPrompt: SYSTEM_PROMPT,
		userPrompt: `Generate a team snapshot for the "${team.name}" team. Use your available tools to gather activity data, then synthesize into a unified summary as JSON.`,
		tools,
		maxTokens: 2048,
	});

	const parsed = JSON.parse(result.text) as {
		workingOn: string;
		recentChanges: string;
		blockedOrAtRisk: string;
		sources: SourceRef[];
	};

	return {
		teamSlug: team.slug,
		workingOn: parsed.workingOn,
		recentChanges: parsed.recentChanges,
		blockedOrAtRisk: parsed.blockedOrAtRisk,
		sources: parsed.sources ?? [],
		generatedAt: new Date().toISOString(),
	};
}
