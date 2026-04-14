import { fetchLinearIssues, teams } from "@team-pulse/core";
import { NextResponse } from "next/server";

const DONE_STATES = new Set(["done", "closed", "canceled", "cancelled"]);
const IN_PROGRESS_STATES = new Set(["in progress", "in review"]);

export async function GET() {
	const allLinearTeamIds = [...new Set(teams.flatMap((t) => t.linearTeamIds))];

	// Fetch all Linear issues (last 2 weeks for recent activity)
	const allIssues = (
		await Promise.all(allLinearTeamIds.map((id) => fetchLinearIssues(id, 336)))
	).flat();

	// Group by author
	const byAuthor = new Map<
		string,
		{ total: number; done: number; inProgress: number; todo: number }
	>();

	for (const issue of allIssues) {
		if (issue.author === "unassigned") continue;
		const current = byAuthor.get(issue.author) ?? { total: 0, done: 0, inProgress: 0, todo: 0 };
		current.total++;
		const status = (issue.status ?? "").toLowerCase();
		if (DONE_STATES.has(status)) current.done++;
		else if (IN_PROGRESS_STATES.has(status)) current.inProgress++;
		else current.todo++;
		byAuthor.set(issue.author, current);
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
