import Anthropic from "@anthropic-ai/sdk";
import type { SourceRef, TeamSummary } from "./types";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an internal operations analyst at a tech company.
You produce concise, specific team snapshots for leadership.
Always return valid JSON — no markdown, no code fences, no extra text.`;

function buildUserPrompt(teamName: string, activityJson: string): string {
	return `Given the following activity data for the ${teamName} team, produce a concise team snapshot.

The audience is leadership — they want clarity, not raw data.

Return JSON with these exact keys:
- "workingOn": 2-3 sentences on current focus areas
- "recentChanges": What shipped or changed in the last 48h
- "blockedOrAtRisk": Any blockers, risks, or stalled items. If nothing is blocked, say so clearly.
- "sources": Array of {"label": string, "url": string} backing each claim

Be specific. Use names and link to artifacts.

Activity data:
${activityJson}`;
}

export async function generateTeamSummary(
	teamSlug: string,
	teamName: string,
	activityJson: string,
): Promise<TeamSummary> {
	const message = await anthropic.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 1024,
		system: SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				content: buildUserPrompt(teamName, activityJson),
			},
		],
	});

	const first = message.content[0];
	const text = first?.type === "text" ? first.text : "";

	const parsed = JSON.parse(text) as {
		workingOn: string;
		recentChanges: string;
		blockedOrAtRisk: string;
		sources: SourceRef[];
	};

	return {
		teamSlug,
		workingOn: parsed.workingOn,
		recentChanges: parsed.recentChanges,
		blockedOrAtRisk: parsed.blockedOrAtRisk,
		sources: parsed.sources ?? [],
		generatedAt: new Date().toISOString(),
	};
}
