import { getCachedInsights, runMarioAgent, setCachedInsights, teams } from "@team-pulse/core";
import { NextResponse } from "next/server";

const CACHE_KEY = "mario-insights";

export async function POST() {
	try {
		const cached = getCachedInsights(CACHE_KEY);
		if (cached) {
			return NextResponse.json({ ...cached, cached: true });
		}

		const linearTeamIds = [...new Set(teams.flatMap((t) => t.linearTeamIds))];
		const repos = [...new Set(teams.flatMap((t) => t.githubRepos))];

		const result = await runMarioAgent(linearTeamIds, repos);
		const parsed = JSON.parse(result.text) as Record<string, unknown>;

		setCachedInsights(CACHE_KEY, parsed);

		return NextResponse.json({ ...parsed, cached: false });
	} catch (err) {
		console.error("Insights error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to generate insights" },
			{ status: 500 },
		);
	}
}
