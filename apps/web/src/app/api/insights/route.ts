import { fetchLinearIssues, runAgent, teams } from "@team-pulse/core";
import { NextResponse } from "next/server";

const DISPLAY_NAMES: Record<string, string> = {
	"greynner@mappa.ai": "Greynner Moreno",
	"yordi@mappa.ai": "Yordi",
	"julian@mappa.ai": "Julian",
	"sarah@mappa.ai": "Sarah",
	"pablo@mappa.ai": "Pablo",
	"rafaello@mappa.ai": "Rafaello Virgilli",
	"cristobal@mappa.ai": "Cristobal",
	"sebastian@mappa.ai": "Sebastian",
};

function resolveDisplayName(name: string): string {
	return DISPLAY_NAMES[name] ?? name;
}

export async function POST() {
	try {
		const allLinearTeamIds = [...new Set(teams.flatMap((t) => t.linearTeamIds))];

		const allIssues = (
			await Promise.all(allLinearTeamIds.map((id) => fetchLinearIssues(id, 336)))
		).flat();

		// Build per-member stats
		const byAuthor = new Map<
			string,
			{ total: number; done: number; inProgress: number; todo: number; issues: string[] }
		>();

		for (const issue of allIssues) {
			if (issue.author === "unassigned") continue;
			const displayName = resolveDisplayName(issue.author);
			const current = byAuthor.get(displayName) ?? {
				total: 0,
				done: 0,
				inProgress: 0,
				todo: 0,
				issues: [],
			};
			current.total++;
			const status = (issue.status ?? "").toLowerCase();
			if (["done", "closed", "canceled", "cancelled"].includes(status)) current.done++;
			else if (["in progress", "in review"].includes(status)) current.inProgress++;
			else current.todo++;
			current.issues.push(`${issue.identifier}: ${issue.title} (${issue.status})`);
			byAuthor.set(displayName, current);
		}

		const memberStats = Array.from(byAuthor.entries()).map(([name, stats]) => ({
			name,
			total: stats.total,
			done: stats.done,
			inProgress: stats.inProgress,
			todo: stats.todo,
			completionRate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
			recentIssues: stats.issues.slice(0, 5),
		}));

		const dataForClaude = JSON.stringify(memberStats, null, 2);

		const result = await runAgent({
			systemPrompt: `You are IA Mario, an engineering team performance analyst at a tech startup. You analyze sprint data and provide actionable insights in Spanish.

Your tone is direct, supportive, and data-driven — like a great engineering manager giving a weekly retro.

Return your analysis as JSON with these exact keys:
- "weekSummary": 2-3 sentences on how the team performed this period overall
- "velocity": 1-2 sentences assessing the team's speed and throughput
- "topPerformers": Array of { "name": string, "highlight": string } for the top 2-3 contributors
- "risks": 1-2 sentences on blockers, stalled work, or people who might need help
- "recommendations": Array of 3 actionable suggestions to improve next sprint

Always return valid JSON — no markdown, no code fences, no extra text.`,
			userPrompt: `Analyze this team's performance data from the last 2 weeks. There are ${allIssues.length} total issues across ${memberStats.length} team members.

Member data:
${dataForClaude}

Provide your analysis as JSON.`,
			tools: [],
			maxTokens: 2048,
		});

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
