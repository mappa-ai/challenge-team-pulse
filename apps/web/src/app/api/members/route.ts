import { fetchGitHubActivity, fetchLinearIssues, teams } from "@team-pulse/core";
import { NextResponse } from "next/server";

const DONE_STATES = new Set(["done", "closed", "canceled", "cancelled"]);
const IN_PROGRESS_STATES = new Set(["in progress", "in review"]);

/** Map raw Linear names (emails, etc.) to proper display names */
const DISPLAY_NAMES: Record<string, string> = {
	"greynner@mappa.ai": "Greynner Moreno",
	"yordi@mappa.ai": "Yordi",
	"julian@mappa.ai": "Julian",
	"sarah@mappa.ai": "Sarah",
	"pablo@mappa.ai": "Pablo",
	"rafaello@mappa.ai": "Rafaello Virgilli",
	"cristobal@mappa.ai": "Cristobal",
	"sebastian@mappa.ai": "Sebastian",
};

/** Map GitHub usernames to display names */
const GITHUB_NAMES: Record<string, string> = {
	Greynner: "Greynner Moreno",
	jgtavarez: "Juan Gabriel Tavarez",
	drsh4dow: "Daniel Moretti",
	mateusmenesesDev: "Mateus Meneses",
	yordi024: "Yordi",
	robinsonur: "Robinson Ureña Rodríguez",
	rvirgilli: "Rafaello Virgilli",
};

function resolveDisplayName(name: string, source: "linear" | "github"): string {
	if (source === "github") return GITHUB_NAMES[name] ?? name;
	return DISPLAY_NAMES[name] ?? name;
}

export async function GET() {
	const allLinearTeamIds = [...new Set(teams.flatMap((t) => t.linearTeamIds))];
	const allRepos = [...new Set(teams.flatMap((t) => t.githubRepos))];

	const [linearIssues, githubItems] = await Promise.all([
		Promise.all(allLinearTeamIds.map((id) => fetchLinearIssues(id, 336))).then((arrs) =>
			arrs.flat(),
		),
		fetchGitHubActivity(allRepos, 336),
	]);

	// Group by resolved display name
	const byAuthor = new Map<
		string,
		{
			linearTotal: number;
			linearDone: number;
			linearInProgress: number;
			linearTodo: number;
			prs: number;
			prsMerged: number;
			commits: number;
		}
	>();

	const empty = () => ({
		linearTotal: 0,
		linearDone: 0,
		linearInProgress: 0,
		linearTodo: 0,
		prs: 0,
		prsMerged: 0,
		commits: 0,
	});

	for (const issue of linearIssues) {
		if (issue.author === "unassigned") continue;
		const name = resolveDisplayName(issue.author, "linear");
		const current = byAuthor.get(name) ?? empty();
		current.linearTotal++;
		const status = (issue.status ?? "").toLowerCase();
		if (DONE_STATES.has(status)) current.linearDone++;
		else if (IN_PROGRESS_STATES.has(status)) current.linearInProgress++;
		else current.linearTodo++;
		byAuthor.set(name, current);
	}

	for (const item of githubItems) {
		if (item.author === "github-actions[bot]") continue;
		const name = resolveDisplayName(item.author, "github");
		const current = byAuthor.get(name) ?? empty();
		if (item.type === "pr") {
			current.prs++;
			if (item.status === "merged") current.prsMerged++;
		} else if (item.type === "commit") {
			current.commits++;
		}
		byAuthor.set(name, current);
	}

	const members = Array.from(byAuthor.entries())
		.map(([name, stats]) => ({
			name,
			linearTotal: stats.linearTotal,
			linearDone: stats.linearDone,
			linearInProgress: stats.linearInProgress,
			linearTodo: stats.linearTodo,
			prs: stats.prs,
			prsMerged: stats.prsMerged,
			commits: stats.commits,
			totalActivity: stats.linearTotal + stats.prs + stats.commits,
			completionRate:
				stats.linearTotal > 0 ? Math.round((stats.linearDone / stats.linearTotal) * 100) : 0,
		}))
		.sort((a, b) => b.totalActivity - a.totalActivity);

	return NextResponse.json({
		members,
		totalIssues: linearIssues.length,
		totalPRs: githubItems.filter((i) => i.type === "pr").length,
		totalCommits: githubItems.filter((i) => i.type === "commit").length,
	});
}
