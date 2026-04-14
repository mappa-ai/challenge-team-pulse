import { fetchLinearIssues, teams } from "@team-pulse/core";
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

function resolveDisplayName(name: string): string {
	return DISPLAY_NAMES[name] ?? name;
}

export async function GET() {
	const allLinearTeamIds = [...new Set(teams.flatMap((t) => t.linearTeamIds))];

	const allIssues = (
		await Promise.all(allLinearTeamIds.map((id) => fetchLinearIssues(id, 336)))
	).flat();

	// Group by resolved display name
	const byAuthor = new Map<
		string,
		{ total: number; done: number; inProgress: number; todo: number }
	>();

	for (const issue of allIssues) {
		if (issue.author === "unassigned") continue;
		const displayName = resolveDisplayName(issue.author);
		const current = byAuthor.get(displayName) ?? { total: 0, done: 0, inProgress: 0, todo: 0 };
		current.total++;
		const status = (issue.status ?? "").toLowerCase();
		if (DONE_STATES.has(status)) current.done++;
		else if (IN_PROGRESS_STATES.has(status)) current.inProgress++;
		else current.todo++;
		byAuthor.set(displayName, current);
	}

	const members = Array.from(byAuthor.entries())
		.map(([name, stats]) => ({
			name,
			total: stats.total,
			done: stats.done,
			inProgress: stats.inProgress,
			todo: stats.todo,
			completionRate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
		}))
		.sort((a, b) => b.total - a.total);

	return NextResponse.json({ members, totalIssues: allIssues.length });
}
