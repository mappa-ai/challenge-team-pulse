import {
	getSwrCache,
	isRevalidating,
	runMarioAgent,
	setRevalidating,
	setSwrCache,
	teams,
} from "@team-pulse/core";
import { NextResponse } from "next/server";

const CACHE_KEY = "mario-insights";

async function fetchInsights() {
	const linearTeamIds = [...new Set(teams.flatMap((t) => t.linearTeamIds))];
	const repos = [...new Set(teams.flatMap((t) => t.githubRepos))];
	const result = await runMarioAgent(linearTeamIds, repos);
	return JSON.parse(result.text) as Record<string, unknown>;
}

export async function POST() {
	try {
		const cached = getSwrCache(CACHE_KEY);

		if (cached) {
			// stale: devuelve dato viejo e inicia revalidación en background
			if (cached.stale && !isRevalidating(CACHE_KEY)) {
				setRevalidating(CACHE_KEY, true);
				fetchInsights()
					.then((data) => setSwrCache(CACHE_KEY, data))
					.catch(console.error)
					.finally(() => setRevalidating(CACHE_KEY, false));
			}
			return NextResponse.json({ ...cached.data, cached: true });
		}

		// cold cache: bloquea solo la primera vez
		const data = await fetchInsights();
		setSwrCache(CACHE_KEY, data);
		return NextResponse.json({ ...data, cached: false });
	} catch (err) {
		console.error("Insights error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to generate insights" },
			{ status: 500 },
		);
	}
}
