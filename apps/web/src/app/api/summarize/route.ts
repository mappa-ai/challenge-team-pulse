import {
	fetchGitHubActivity,
	fetchSlackMessages,
	formatForPrompt,
	generateTeamSummary,
	generateTeamSummaryV2,
	getTeamBySlug,
	normalizeAndSort,
	setCachedSummary,
} from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const body = await request.json();
	const { teamSlug, v } = body as { teamSlug: string; v?: string };
	const team = getTeamBySlug(teamSlug);

	if (!team) {
		return NextResponse.json({ error: "Team not found" }, { status: 404 });
	}

	if (v === "2") {
		const summary = await generateTeamSummaryV2(team);
		setCachedSummary(summary);
		return NextResponse.json({ summary, agent: true });
	}

	const [slackItems, githubItems] = await Promise.all([
		fetchSlackMessages(team.slackChannels),
		fetchGitHubActivity(team.githubRepos),
	]);

	const allItems = normalizeAndSort([...slackItems, ...githubItems]);
	const activityJson = formatForPrompt(allItems);
	const summary = await generateTeamSummary(team.slug, team.name, activityJson);

	setCachedSummary(summary);

	return NextResponse.json({ summary, activityCount: allItems.length });
}
