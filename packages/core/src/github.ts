import { Octokit } from "octokit";
import type { ActivityItem } from "./types";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function fetchGitHubActivity(
	repos: string[],
	hoursBack = 48,
): Promise<ActivityItem[]> {
	const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
	const items: ActivityItem[] = [];

	for (const repo of repos) {
		const [owner, name] = repo.split("/");
		if (!owner || !name) continue;

		const [prs, issues, commits] = await Promise.all([
			fetchPRs(owner, name, since),
			fetchIssues(owner, name, since),
			fetchCommits(owner, name, since),
		]);

		items.push(...prs, ...issues, ...commits);
	}

	return items;
}

async function fetchPRs(owner: string, repo: string, since: string): Promise<ActivityItem[]> {
	try {
		const { data } = await octokit.rest.pulls.list({
			owner,
			repo,
			state: "all",
			sort: "updated",
			direction: "desc",
			per_page: 30,
		});

		return data
			.filter((pr) => new Date(pr.updated_at) >= new Date(since))
			.map((pr) => ({
				source: "github" as const,
				type: "pr" as const,
				title: pr.title,
				author: pr.user?.login ?? "unknown",
				timestamp: pr.updated_at,
				url: pr.html_url,
				status: pr.merged_at
					? ("merged" as const)
					: pr.state === "closed"
						? ("closed" as const)
						: ("open" as const),
				labels: pr.labels.map((l) => l.name ?? ""),
			}));
	} catch (err) {
		console.error(`Error fetching PRs for ${owner}/${repo}:`, err);
		return [];
	}
}

async function fetchIssues(owner: string, repo: string, since: string): Promise<ActivityItem[]> {
	try {
		const { data } = await octokit.rest.issues.listForRepo({
			owner,
			repo,
			since,
			state: "all",
			sort: "updated",
			direction: "desc",
			per_page: 30,
		});

		return data
			.filter((issue) => !issue.pull_request)
			.map((issue) => ({
				source: "github" as const,
				type: "issue" as const,
				title: issue.title,
				author: issue.user?.login ?? "unknown",
				timestamp: issue.updated_at,
				url: issue.html_url,
				status: issue.state === "closed" ? ("closed" as const) : ("open" as const),
				labels: issue.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))),
			}));
	} catch (err) {
		console.error(`Error fetching issues for ${owner}/${repo}:`, err);
		return [];
	}
}

async function fetchCommits(owner: string, repo: string, since: string): Promise<ActivityItem[]> {
	try {
		const { data } = await octokit.rest.repos.listCommits({
			owner,
			repo,
			since,
			per_page: 30,
		});

		return data.map((commit) => ({
			source: "github" as const,
			type: "commit" as const,
			title: commit.commit.message.split("\n")[0] ?? "",
			author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
			timestamp: commit.commit.author?.date ?? new Date().toISOString(),
			url: commit.html_url,
		}));
	} catch (err) {
		console.error(`Error fetching commits for ${owner}/${repo}:`, err);
		return [];
	}
}
