import { fetchCommits, fetchIssues, fetchPRs } from "../github";
import { fetchLinearIssues } from "../linear";
import { getTeamBySlug, teams } from "../teams.config";
import type { ActivityItem } from "../types";
import { runAgent } from "./runner";
import type { AgentResult, ToolHandler } from "./types";

const SYSTEM_PROMPT = `You are a person activity researcher. You have tools to search for a specific person's activity across GitHub and Linear.

IMPORTANT: GitHub uses login usernames (e.g. "greynnermorenomarcano") while Linear uses display names (e.g. "Greynner Moreno"). The user may provide either format. Use both tools and try variations of the name.

After gathering data, return your final answer as JSON with these exact keys:
- "summary": A concise paragraph about what this person has been working on, their contributions, and current focus

Be specific. Use names and link to artifacts.
Always return valid JSON — no markdown, no code fences, no extra text.`;

/** Collected activities from tool executions — populated as side effect during agent run */
let collectedActivities: ActivityItem[] = [];

export function makePersonTools(repos: string[], linearTeamIds: string[]): ToolHandler[] {
	const tools: ToolHandler[] = [];

	if (repos.length > 0) {
		tools.push({
			definition: {
				name: "search_github_activity",
				description: `Search for a person's recent GitHub activity (PRs, issues, commits) across repositories. Available repos: ${repos.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						username: {
							type: "string",
							description: "GitHub username to search for",
						},
						hours_back: {
							type: "number",
							description: "How many hours back to look (default: 336 = 2 weeks)",
						},
					},
					required: ["username"],
				},
			},
			execute: async (input: unknown) => {
				const { username, hours_back } = input as {
					username: string;
					hours_back?: number;
				};
				const since = new Date(Date.now() - (hours_back ?? 336) * 3600000).toISOString();
				const needle = username.toLowerCase();

				const results: ActivityItem[] = [];
				for (const repo of repos) {
					const [owner, name] = repo.split("/");
					if (!owner || !name) continue;

					const [prs, issues, commits] = await Promise.all([
						fetchPRs(owner, name, since),
						fetchIssues(owner, name, since),
						fetchCommits(owner, name, since),
					]);

					results.push(
						...[...prs, ...issues, ...commits].filter((item) =>
							item.author.toLowerCase().includes(needle),
						),
					);
				}
				collectedActivities.push(...results);
				return results;
			},
		});
	}

	if (linearTeamIds.length > 0) {
		tools.push({
			definition: {
				name: "search_linear_activity",
				description: `Search for a person's recent Linear activity (issues, assignments) across teams. Available team IDs: ${linearTeamIds.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						person_name: {
							type: "string",
							description: "Person's display name to search for (case-insensitive partial match)",
						},
						hours_back: {
							type: "number",
							description: "How many hours back to look (default: 336 = 2 weeks)",
						},
					},
					required: ["person_name"],
				},
			},
			execute: async (input: unknown) => {
				const { person_name, hours_back } = input as {
					person_name: string;
					hours_back?: number;
				};
				const needle = person_name.toLowerCase();

				const results: ActivityItem[] = [];
				for (const teamId of linearTeamIds) {
					const issues = await fetchLinearIssues(teamId, hours_back ?? 336);
					results.push(...issues.filter((item) => item.author.toLowerCase().includes(needle)));
				}
				collectedActivities.push(...results);
				return results;
			},
		});
	}

	return tools;
}

export async function runPersonAgent(
	query: string,
	repos: string[],
	linearTeamIds: string[],
): Promise<AgentResult> {
	const tools = makePersonTools(repos, linearTeamIds);
	return runAgent({
		systemPrompt: SYSTEM_PROMPT,
		userPrompt: `Search for all recent activity from "${query}". Use your available tools to gather their GitHub and Linear activity, then provide your analysis as JSON.`,
		tools,
		maxTokens: 4096,
	});
}

export async function searchPerson(
	query: string,
	teamSlug?: string,
): Promise<{ summary: string; activities: ActivityItem[] }> {
	let repos: string[] = [];
	let linearTeamIds: string[] = [];

	if (teamSlug) {
		const team = getTeamBySlug(teamSlug);
		if (team) {
			repos = team.githubRepos;
			linearTeamIds = team.linearTeamIds;
		}
	} else {
		for (const team of teams) {
			repos.push(...team.githubRepos);
			linearTeamIds.push(...team.linearTeamIds);
		}
		repos = [...new Set(repos)];
		linearTeamIds = [...new Set(linearTeamIds)];
	}

	// Reset collected activities before agent run
	collectedActivities = [];

	const result = await runPersonAgent(query, repos, linearTeamIds);

	// Parse summary from Claude, but use directly collected activities
	let summary = "";
	try {
		const parsed = JSON.parse(result.text) as { summary: string };
		summary = parsed.summary;
	} catch {
		summary = result.text;
	}

	return {
		summary,
		activities: collectedActivities,
	};
}
