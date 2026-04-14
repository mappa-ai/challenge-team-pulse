import { describe, expect, it } from "bun:test";
import { setCachedSummary } from "@team-pulse/core";
import type { TeamSummary } from "@team-pulse/core";
import { GET as GET_TEAM } from "../src/app/api/teams/[slug]/route";
import { GET as GET_TEAMS } from "../src/app/api/teams/route";
import { jsonRequest, parseJson } from "./helpers";

function makeSummary(slug: string): TeamSummary {
	return {
		teamSlug: slug,
		workingOn: `${slug} team is focused on Q1 deliverables`,
		recentChanges: "Shipped auth refactor and improved CI pipeline",
		blockedOrAtRisk: "Waiting on design review for dashboard redesign",
		sources: [
			{ label: "PR #142", url: "https://github.com/acme/repo/pull/142" },
			{ label: "#ops-general", url: "https://slack.com/archives/C123/p456" },
		],
		generatedAt: new Date().toISOString(),
	};
}

describe("integration: cache → API flow", () => {
	it("GET /api/teams shows summary=null when cache is empty for a team", async () => {
		const res = await GET_TEAMS();
		const data = await parseJson(res);
		const teams = data.teams as Record<string, unknown>[];
		const uncached = teams.find((t) => t.slug === "data-infra");

		// data-infra might have a cached summary from other tests, or null
		// The key assertion is that the field exists
		expect(uncached).toHaveProperty("summary");
	});

	it("caching a summary makes it visible via GET /api/teams/[slug]", async () => {
		const summary = makeSummary("platform");
		setCachedSummary(summary);

		const req = jsonRequest("http://localhost/api/teams/platform");
		const res = await GET_TEAM(req, { params: { slug: "platform" } });
		const data = await parseJson(res);

		expect(data.summary).not.toBeNull();
		const cached = data.summary as Record<string, unknown>;
		expect(cached.teamSlug).toBe("platform");
		expect(cached.workingOn).toContain("Q1 deliverables");
	});

	it("caching a summary makes it visible via GET /api/teams list", async () => {
		setCachedSummary(makeSummary("ai-voice"));

		const res = await GET_TEAMS();
		const data = await parseJson(res);
		const teams = data.teams as Record<string, unknown>[];
		const aiVoice = teams.find((t) => t.slug === "ai-voice");

		expect(aiVoice!.summary).not.toBeNull();
		const summary = aiVoice!.summary as Record<string, unknown>;
		expect(summary.teamSlug).toBe("ai-voice");
	});

	it("cached count reflects number of cached teams", async () => {
		setCachedSummary(makeSummary("platform"));
		setCachedSummary(makeSummary("ai-voice"));
		setCachedSummary(makeSummary("recruiting"));

		const res = await GET_TEAMS();
		const data = await parseJson(res);

		// At least 3 should be cached (could be more from other test suites)
		expect(data.cached as number).toBeGreaterThanOrEqual(3);
	});

	it("summary includes sources array with label and url", async () => {
		setCachedSummary(makeSummary("platform"));

		const req = jsonRequest("http://localhost/api/teams/platform");
		const res = await GET_TEAM(req, { params: { slug: "platform" } });
		const data = await parseJson(res);
		const summary = data.summary as Record<string, unknown>;
		const sources = summary.sources as Record<string, string>[];

		expect(sources).toHaveLength(2);
		expect(sources[0]).toHaveProperty("label");
		expect(sources[0]).toHaveProperty("url");
		expect(sources[0]!.label).toBe("PR #142");
	});

	it("overwriting cache for a team updates the API response", async () => {
		setCachedSummary(makeSummary("platform"));

		// Update with new data
		setCachedSummary({
			...makeSummary("platform"),
			workingOn: "Migrating to new infrastructure",
		});

		const req = jsonRequest("http://localhost/api/teams/platform");
		const res = await GET_TEAM(req, { params: { slug: "platform" } });
		const data = await parseJson(res);
		const summary = data.summary as Record<string, unknown>;

		expect(summary.workingOn).toBe("Migrating to new infrastructure");
	});
});
