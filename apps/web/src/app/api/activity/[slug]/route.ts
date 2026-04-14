import {
	fetchGitHubActivity,
	fetchLinearIssues,
	getTeamBySlug,
	normalizeAndSort,
} from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
	const team = getTeamBySlug(params.slug);

	if (!team) {
		return NextResponse.json({ error: "Team not found" }, { status: 404 });
	}

	const [githubItems, linearItems] = await Promise.all([
		fetchGitHubActivity(team.githubRepos),
		Promise.all(team.linearTeamIds.map((id) => fetchLinearIssues(id))).then((arrs) => arrs.flat()),
	]);

	const items = normalizeAndSort([...githubItems, ...linearItems]);

	return NextResponse.json({ teamSlug: team.slug, items });
}
