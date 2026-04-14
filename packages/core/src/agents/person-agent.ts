import { fetchCommits, fetchIssues, fetchPRs } from "../github";
import { fetchLinearIssuesByAssignee } from "../linear";
import { getTeamBySlug, teams } from "../teams.config";
import type { ActivityItem } from "../types";
import { runAgent } from "./runner";
import type { AgentResult, ToolHandler } from "./types";

/**
 * Known aliases: maps search terms to GitHub usernames and Linear display names.
 * This bridges the gap between GitHub logins and Linear display names.
 */
const PERSON_ALIASES: Record<string, { github: string[]; linear: string[] }> = {
	// Juan Gabriel Tavarez — Linear name: "Juan Gabriel Tavarez", GitHub: jgtavarez
	juan: { github: ["jgtavarez"], linear: ["Juan Gabriel"] },
	"juan gabriel": { github: ["jgtavarez"], linear: ["Juan Gabriel"] },
	tavarez: { github: ["jgtavarez"], linear: ["Juan Gabriel"] },
	jgtavarez: { github: ["jgtavarez"], linear: ["Juan Gabriel"] },
	// Daniel Moretti — Linear name: "Daniel Moretti", GitHub: drsh4dow
	daniel: { github: ["drsh4dow"], linear: ["Daniel Moretti"] },
	moretti: { github: ["drsh4dow"], linear: ["Daniel Moretti"] },
	"daniel moretti": { github: ["drsh4dow"], linear: ["Daniel Moretti"] },
	drsh4dow: { github: ["drsh4dow"], linear: ["Daniel Moretti"] },
	// Mateus Meneses — Linear name: "Mateus Meneses", GitHub: mateusmenesesDev
	mateus: { github: ["mateusmenesesDev"], linear: ["Mateus Meneses"] },
	meneses: { github: ["mateusmenesesDev"], linear: ["Mateus Meneses"] },
	"mateus meneses": { github: ["mateusmenesesDev"], linear: ["Mateus Meneses"] },
	mateusmenesesdev: { github: ["mateusmenesesDev"], linear: ["Mateus Meneses"] },
	// Greynner — Linear name: "greynner@mappa.ai", GitHub: Greynner
	greynner: { github: ["Greynner"], linear: ["greynner"] },
	"greynner moreno": { github: ["Greynner"], linear: ["greynner"] },
	// Yordi — Linear name: "yordi@mappa.ai", GitHub: yordi024
	yordi: { github: ["yordi024"], linear: ["yordi"] },
	yordi024: { github: ["yordi024"], linear: ["yordi"] },
	// Robinson Ureña — Linear name: "Robinson Ureña Rodríguez", GitHub: robinsonur
	robinson: { github: ["robinsonur"], linear: ["Robinson Ureña"] },
	"robinson ureña": { github: ["robinsonur"], linear: ["Robinson Ureña"] },
	robinsonur: { github: ["robinsonur"], linear: ["Robinson Ureña"] },
	// Agustín Ale — Linear only
	agustin: { github: [], linear: ["Agustín"] },
	"agustin ale": { github: [], linear: ["Agustín"] },
	// Taylor Bryn Jackson West — Linear only
	taylor: { github: [], linear: ["Taylor"] },
	// Rafaello Virgilli — GitHub: rvirgilli, Linear name: "rafaello@mappa.ai"
	rvirgilli: { github: ["rvirgilli"], linear: ["rafaello"] },
	rafaello: { github: ["rvirgilli"], linear: ["rafaello"] },
};

function resolveAliases(query: string): { githubUsernames: string[]; linearNames: string[] } {
	const key = query.toLowerCase().trim();

	// Direct match in alias map
	const alias = PERSON_ALIASES[key];
	if (alias) {
		return { githubUsernames: alias.github, linearNames: alias.linear };
	}

	// Partial match — search all keys
	for (const [aliasKey, aliasValue] of Object.entries(PERSON_ALIASES)) {
		if (aliasKey.includes(key) || key.includes(aliasKey)) {
			return { githubUsernames: aliasValue.github, linearNames: aliasValue.linear };
		}
	}

	// No match — use query as-is for both
	return { githubUsernames: [query], linearNames: [query] };
}

const SYSTEM_PROMPT = `You are a person activity researcher. You will receive data about a person's activity across GitHub and Linear.

Analyze the data and return your final answer as JSON with these exact keys:
- "summary": A concise paragraph about what this person has been working on, their contributions, and current focus

Be specific. Use names and link to artifacts.
Always return valid JSON — no markdown, no code fences, no extra text.`;

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
				return results;
			},
		});
	}

	if (linearTeamIds.length > 0) {
		tools.push({
			definition: {
				name: "search_linear_activity",
				description: `Search for ALL of a person's Linear issues (no time limit). Available team IDs: ${linearTeamIds.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						person_name: {
							type: "string",
							description: "Person's display name to search for (case-insensitive partial match)",
						},
					},
					required: ["person_name"],
				},
			},
			execute: async (input: unknown) => {
				const { person_name } = input as { person_name: string };

				const results: ActivityItem[] = [];
				for (const teamId of linearTeamIds) {
					const issues = await fetchLinearIssuesByAssignee(teamId, person_name);
					results.push(...issues);
				}
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

	// Resolve aliases to get correct GitHub usernames and Linear names
	const { githubUsernames, linearNames } = resolveAliases(query);

	// Fetch data directly using resolved aliases (no agent needed for data)
	const allActivities: ActivityItem[] = [];

	// GitHub: search with each resolved username
	if (repos.length > 0) {
		const since = new Date(Date.now() - 336 * 3600000).toISOString();
		for (const username of githubUsernames) {
			const needle = username.toLowerCase();
			for (const repo of repos) {
				const [owner, name] = repo.split("/");
				if (!owner || !name) continue;

				const [prs, issues, commits] = await Promise.all([
					fetchPRs(owner, name, since),
					fetchIssues(owner, name, since),
					fetchCommits(owner, name, since),
				]);

				allActivities.push(
					...[...prs, ...issues, ...commits].filter((item) =>
						item.author.toLowerCase().includes(needle),
					),
				);
			}
		}
	}

	// Linear: search with each resolved name
	for (const linearName of linearNames) {
		for (const teamId of linearTeamIds) {
			const issues = await fetchLinearIssuesByAssignee(teamId, linearName);
			allActivities.push(...issues);
		}
	}

	// Deduplicate by URL
	const seen = new Set<string>();
	const dedupedActivities = allActivities.filter((item) => {
		if (seen.has(item.url)) return false;
		seen.add(item.url);
		return true;
	});

	// Run agent only for the AI summary, passing the collected data
	let summary = "";
	if (dedupedActivities.length > 0) {
		const dataForSummary = JSON.stringify(
			dedupedActivities.map((a) => ({
				source: a.source,
				type: a.type,
				title: a.title,
				status: a.status,
				identifier: a.identifier,
				url: a.url,
			})),
		);

		const result = await runAgent({
			systemPrompt: SYSTEM_PROMPT,
			userPrompt: `Here is the activity data for "${query}":\n\n${dataForSummary}\n\nAnalyze this data and provide a summary as JSON.`,
			tools: [],
			maxTokens: 2048,
		});

		try {
			const parsed = JSON.parse(result.text) as { summary: string };
			summary = parsed.summary;
		} catch {
			summary = result.text;
		}
	} else {
		summary = `No activity found for "${query}" across configured repositories and Linear teams.`;
	}

	return {
		summary,
		activities: dedupedActivities,
	};
}
