import { fetchCommits, fetchIssues, fetchPRs } from "../github";
import { runAgent } from "./runner";
import type { AgentResult, ToolHandler } from "./types";

const SYSTEM_PROMPT = `You are a GitHub activity analyst. You have tools to fetch PRs, issues, and commits from GitHub repositories.
Given a list of repositories, use your tools to gather recent activity, then produce a structured analysis.

Return your final answer as JSON with these exact keys:
- "summary": A concise paragraph describing what the team is working on based on GitHub activity
- "recentChanges": What shipped or changed recently (merged PRs, significant commits)
- "risks": Any concerning patterns (stale PRs, bug issues, blocked items)
- "sources": Array of {"label": string, "url": string} for key artifacts

Be specific. Use author names and link to artifacts.
Always return valid JSON — no markdown, no code fences, no extra text.`;

export function makeGitHubTools(repos: string[]): ToolHandler[] {
	return [
		{
			definition: {
				name: "fetch_pull_requests",
				description: `Fetch recent pull requests for a GitHub repository. Available repos: ${repos.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						owner: { type: "string", description: "Repository owner/org" },
						repo: { type: "string", description: "Repository name" },
						hours_back: {
							type: "number",
							description: "How many hours back to look (default: 48)",
						},
					},
					required: ["owner", "repo"],
				},
			},
			execute: async (input: unknown) => {
				const { owner, repo, hours_back } = input as {
					owner: string;
					repo: string;
					hours_back?: number;
				};
				const since = new Date(Date.now() - (hours_back ?? 48) * 3600000).toISOString();
				return fetchPRs(owner, repo, since);
			},
		},
		{
			definition: {
				name: "fetch_issues",
				description: `Fetch recent issues for a GitHub repository. Available repos: ${repos.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						owner: { type: "string", description: "Repository owner/org" },
						repo: { type: "string", description: "Repository name" },
						hours_back: {
							type: "number",
							description: "How many hours back to look (default: 48)",
						},
					},
					required: ["owner", "repo"],
				},
			},
			execute: async (input: unknown) => {
				const { owner, repo, hours_back } = input as {
					owner: string;
					repo: string;
					hours_back?: number;
				};
				const since = new Date(Date.now() - (hours_back ?? 48) * 3600000).toISOString();
				return fetchIssues(owner, repo, since);
			},
		},
		{
			definition: {
				name: "fetch_commits",
				description: `Fetch recent commits for a GitHub repository. Available repos: ${repos.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						owner: { type: "string", description: "Repository owner/org" },
						repo: { type: "string", description: "Repository name" },
						hours_back: {
							type: "number",
							description: "How many hours back to look (default: 48)",
						},
					},
					required: ["owner", "repo"],
				},
			},
			execute: async (input: unknown) => {
				const { owner, repo, hours_back } = input as {
					owner: string;
					repo: string;
					hours_back?: number;
				};
				const since = new Date(Date.now() - (hours_back ?? 48) * 3600000).toISOString();
				return fetchCommits(owner, repo, since);
			},
		},
	];
}

export async function runGitHubAgent(repos: string[], teamName: string): Promise<AgentResult> {
	const tools = makeGitHubTools(repos);
	return runAgent({
		systemPrompt: SYSTEM_PROMPT,
		userPrompt: `Analyze recent GitHub activity for the "${teamName}" team across these repositories: ${repos.join(", ")}. Use your tools to fetch data, then provide your analysis as JSON.`,
		tools,
	});
}
