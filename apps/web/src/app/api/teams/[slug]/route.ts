import { getCachedSummary, getTeamBySlug } from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
	const team = getTeamBySlug(params.slug);
	if (!team) {
		return NextResponse.json({ error: "Team not found" }, { status: 404 });
	}

	const summary = getCachedSummary(team.slug);

	return NextResponse.json({ team, summary });
}
