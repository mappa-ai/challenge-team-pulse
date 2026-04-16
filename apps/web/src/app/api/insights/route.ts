import { runMarioAgent, teams } from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const linearTeamIds = [...new Set(teams.flatMap((t) => t.linearTeamIds))];
		const repos = [...new Set(teams.flatMap((t) => t.githubRepos))];

		const result = await runMarioAgent(linearTeamIds, repos);

		const parsed = JSON.parse(result.text);
		return NextResponse.json(parsed);
	} catch (err) {
		console.error("Insights error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to generate insights" },
			{ status: 500 },
		);
	}
}
