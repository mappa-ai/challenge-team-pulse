import { describe, expect, it } from "bun:test";
import { GET as GET_SLUG } from "../src/app/api/teams/[slug]/route";
import { GET } from "../src/app/api/teams/route";
import { jsonRequest, parseJson } from "./helpers";

describe("GET /api/teams", () => {
	it("returns 200 with a teams array", async () => {
		const res = await GET();
		expect(res.status).toBe(200);

		const data = await parseJson(res);
		expect(data.teams).toBeArray();
	});

	it("returns exactly 4 teams", async () => {
		const res = await GET();
		const data = await parseJson(res);
		const teams = data.teams as unknown[];
		expect(teams).toHaveLength(4);
	});

	it("each team has slug, name, color, and summary fields", async () => {
		const res = await GET();
		const data = await parseJson(res);
		const teams = data.teams as Record<string, unknown>[];

		for (const team of teams) {
			expect(team).toHaveProperty("slug");
			expect(team).toHaveProperty("name");
			expect(team).toHaveProperty("color");
			expect(team).toHaveProperty("summary");
		}
	});

	it("includes the expected team slugs", async () => {
		const res = await GET();
		const data = await parseJson(res);
		const slugs = (data.teams as Record<string, string>[]).map((t) => t.slug);

		expect(slugs).toContain("platform");
		expect(slugs).toContain("ai-voice");
		expect(slugs).toContain("recruiting");
		expect(slugs).toContain("data-infra");
	});

	it("returns cached count", async () => {
		const res = await GET();
		const data = await parseJson(res);
		expect(data).toHaveProperty("cached");
		expect(typeof data.cached).toBe("number");
	});
});

describe("GET /api/teams/[slug]", () => {
	it("returns 200 with team data for a valid slug", async () => {
		const req = jsonRequest("http://localhost/api/teams/platform");
		const res = await GET_SLUG(req, { params: { slug: "platform" } });

		expect(res.status).toBe(200);

		const data = await parseJson(res);
		expect(data.team).toBeDefined();

		const team = data.team as Record<string, unknown>;
		expect(team.slug).toBe("platform");
		expect(team.name).toBe("Platform");
	});

	it("returns team config with slackChannels and githubRepos", async () => {
		const req = jsonRequest("http://localhost/api/teams/ai-voice");
		const res = await GET_SLUG(req, { params: { slug: "ai-voice" } });
		const data = await parseJson(res);
		const team = data.team as Record<string, unknown>;

		expect(team.slackChannels).toBeArray();
		expect(team.githubRepos).toBeArray();
	});

	it("returns 404 for unknown slug", async () => {
		const req = jsonRequest("http://localhost/api/teams/nonexistent");
		const res = await GET_SLUG(req, { params: { slug: "nonexistent" } });

		expect(res.status).toBe(404);

		const data = await parseJson(res);
		expect(data.error).toBe("Team not found");
	});

	it("returns summary field (null when not cached)", async () => {
		const req = jsonRequest("http://localhost/api/teams/recruiting");
		const res = await GET_SLUG(req, { params: { slug: "recruiting" } });
		const data = await parseJson(res);

		expect(data).toHaveProperty("summary");
	});
});
