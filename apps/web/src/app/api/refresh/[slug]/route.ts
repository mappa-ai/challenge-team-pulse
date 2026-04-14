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

export async function POST(request: Request, { params }: { params: { slug: string } }) {
	const team = getTeamBySlug(params.slug);

	if (!team) {
		return NextResponse.json({ error: "Team not found" }, { status: 404 });
	}

	const url = new URL(request.url);
	const version = url.searchParams.get("v");

	if (version === "2") {
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
