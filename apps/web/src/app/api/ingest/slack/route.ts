import { fetchSlackMessages, getTeamBySlug } from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const { teamSlug } = await request.json();
	const team = getTeamBySlug(teamSlug);

	if (!team) {
		return NextResponse.json({ error: "Team not found" }, { status: 404 });
	}

	const items = await fetchSlackMessages(team.slackChannels);

	return NextResponse.json({ source: "slack", teamSlug, count: items.length, items });
}
