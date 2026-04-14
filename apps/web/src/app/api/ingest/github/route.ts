import { fetchGitHubActivity, getTeamBySlug } from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const { teamSlug } = await request.json();
	const team = getTeamBySlug(teamSlug);

	if (!team) {
		return NextResponse.json({ error: "Team not found" }, { status: 404 });
	}

	const items = await fetchGitHubActivity(team.githubRepos);

	return NextResponse.json({ source: "github", teamSlug, count: items.length, items });
}
