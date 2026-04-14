import { describe, expect, it } from "bun:test";
import { getTeamBySlug, teams } from "../src/teams.config";

describe("teams config", () => {
	it("has exactly 4 teams defined", () => {
		expect(teams).toHaveLength(4);
	});

	it("each team has required fields", () => {
		for (const team of teams) {
			expect(team.slug).toBeString();
			expect(team.name).toBeString();
			expect(team.color).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(team.slackChannels).toBeArray();
			expect(team.slackChannels.length).toBeGreaterThan(0);
			expect(team.githubRepos).toBeArray();
			expect(team.githubRepos.length).toBeGreaterThan(0);
			expect(team.linearTeamIds).toBeArray();
		}
	});

	it("all slugs are unique", () => {
		const slugs = teams.map((t) => t.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("github repos follow org/repo format", () => {
		for (const team of teams) {
			for (const repo of team.githubRepos) {
				expect(repo).toMatch(/^[^/]+\/[^/]+$/);
			}
		}
	});

	describe("getTeamBySlug", () => {
		it("returns the correct team for a valid slug", () => {
			const platform = getTeamBySlug("platform");
			expect(platform).toBeDefined();
			expect(platform!.name).toBe("Platform");
			expect(platform!.slug).toBe("platform");
		});

		it("returns each configured team", () => {
			for (const team of teams) {
				const found = getTeamBySlug(team.slug);
				expect(found).toBeDefined();
				expect(found!.name).toBe(team.name);
			}
		});

		it("returns undefined for an unknown slug", () => {
			expect(getTeamBySlug("nonexistent")).toBeUndefined();
		});

		it("returns undefined for empty string", () => {
			expect(getTeamBySlug("")).toBeUndefined();
		});
	});
});
