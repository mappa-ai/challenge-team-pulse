import { fetchLinearCycles, fetchLinearIssues, fetchLinearProjects } from "../linear";
import { runAgent } from "./runner";
import type { AgentResult, ToolHandler } from "./types";

const SYSTEM_PROMPT = `You are a project management analyst specializing in Linear data.
You have tools to fetch issues, cycles, and projects from Linear.
Analyze the team's work tracking to identify current focus areas, progress, and risks.

Return your final answer as JSON with these exact keys:
- "summary": Concise paragraph on current sprint/cycle focus
- "progress": What's been completed or moved forward recently
- "risks": Blocked issues, overdue items, stalled cycles
- "sources": Array of {"label": string, "url": string}

Be specific. Reference issue identifiers and assignees.
Always return valid JSON — no markdown, no code fences, no extra text.`;

export function makeLinearTools(teamIds: string[]): ToolHandler[] {
	return [
		{
			definition: {
				name: "fetch_linear_issues",
				description: `Fetch recent issues from Linear for a team. Available team IDs: ${teamIds.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						team_id: { type: "string", description: "Linear team ID" },
						hours_back: { type: "number", description: "Hours to look back (default: 48)" },
					},
					required: ["team_id"],
				},
			},
			execute: async (input: unknown) => {
				const { team_id, hours_back } = input as { team_id: string; hours_back?: number };
				return fetchLinearIssues(team_id, hours_back);
			},
		},
		{
			definition: {
				name: "fetch_linear_cycles",
				description: `Fetch active cycles/sprints for a Linear team. Available team IDs: ${teamIds.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						team_id: { type: "string", description: "Linear team ID" },
					},
					required: ["team_id"],
				},
			},
			execute: async (input: unknown) => {
				const { team_id } = input as { team_id: string };
				return fetchLinearCycles(team_id);
			},
		},
		{
			definition: {
				name: "fetch_linear_projects",
				description: `Fetch active projects for a Linear team. Available team IDs: ${teamIds.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						team_id: { type: "string", description: "Linear team ID" },
					},
					required: ["team_id"],
				},
			},
			execute: async (input: unknown) => {
				const { team_id } = input as { team_id: string };
				return fetchLinearProjects(team_id);
			},
		},
	];
}

export async function runLinearAgent(teamIds: string[], teamName: string): Promise<AgentResult> {
	const tools = makeLinearTools(teamIds);
	return runAgent({
		systemPrompt: SYSTEM_PROMPT,
		userPrompt: `Analyze recent Linear activity for the "${teamName}" team across these Linear teams: ${teamIds.join(", ")}. Use your tools to fetch data, then provide your analysis as JSON.`,
		tools,
	});
}
