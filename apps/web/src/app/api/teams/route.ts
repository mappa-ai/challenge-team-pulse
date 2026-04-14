import { getAllCachedSummaries, getCachedSummary, teams } from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function GET() {
	const summaries = getAllCachedSummaries();

	const data = teams.map((team) => ({
		...team,
		summary: getCachedSummary(team.slug) ?? null,
	}));

	return NextResponse.json({ teams: data, cached: summaries.length });
}
