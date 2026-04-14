import { afterEach, describe, expect, it } from "bun:test";
import { getAllCachedSummaries, getCachedSummary, setCachedSummary } from "../src/cache";
import type { TeamSummary } from "../src/types";

function makeSummary(teamSlug: string, overrides?: Partial<TeamSummary>): TeamSummary {
	return {
		teamSlug,
		workingOn: `${teamSlug} is working on things`,
		recentChanges: `${teamSlug} shipped features`,
		blockedOrAtRisk: "Nothing blocked",
		sources: [{ label: "PR #1", url: "https://github.com/acme/repo/pull/1" }],
		generatedAt: new Date().toISOString(),
		...overrides,
	};
}

describe("cache", () => {
	afterEach(() => {
		// Clear cache between tests by setting expired entries
		for (const slug of ["ops", "product", "marketing", "test-team"]) {
			const existing = getCachedSummary(slug);
			if (existing) {
				// Force expiration by setting with a past timestamp won't work
				// since we can't directly manipulate the store, but we rely on
				// test isolation through unique slugs or accept shared state
			}
		}
	});

	it("returns null for a team with no cached summary", () => {
		expect(getCachedSummary("never-cached-team")).toBeNull();
	});

	it("stores and retrieves a summary", () => {
		const summary = makeSummary("cache-test-1");
		setCachedSummary(summary);

		const cached = getCachedSummary("cache-test-1");
		expect(cached).not.toBeNull();
		expect(cached!.teamSlug).toBe("cache-test-1");
		expect(cached!.workingOn).toBe(summary.workingOn);
		expect(cached!.recentChanges).toBe(summary.recentChanges);
		expect(cached!.blockedOrAtRisk).toBe(summary.blockedOrAtRisk);
		expect(cached!.sources).toEqual(summary.sources);
	});

	it("overwrites previous summary for same team", () => {
		setCachedSummary(makeSummary("cache-test-2", { workingOn: "first version" }));
		setCachedSummary(makeSummary("cache-test-2", { workingOn: "updated version" }));

		const cached = getCachedSummary("cache-test-2");
		expect(cached!.workingOn).toBe("updated version");
	});

	it("getAllCachedSummaries returns all non-expired entries", () => {
		setCachedSummary(makeSummary("cache-test-all-1"));
		setCachedSummary(makeSummary("cache-test-all-2"));
		setCachedSummary(makeSummary("cache-test-all-3"));

		const all = getAllCachedSummaries();
		const slugs = all.map((s) => s.teamSlug);

		expect(slugs).toContain("cache-test-all-1");
		expect(slugs).toContain("cache-test-all-2");
		expect(slugs).toContain("cache-test-all-3");
	});

	it("preserves sources array structure", () => {
		const sources = [
			{ label: "PR #42", url: "https://github.com/acme/repo/pull/42" },
			{ label: "Issue #99", url: "https://github.com/acme/repo/issues/99" },
		];
		setCachedSummary(makeSummary("cache-test-sources", { sources }));

		const cached = getCachedSummary("cache-test-sources");
		expect(cached!.sources).toHaveLength(2);
		expect(cached!.sources[0]!.label).toBe("PR #42");
		expect(cached!.sources[1]!.url).toContain("issues/99");
	});

	it("preserves generatedAt timestamp", () => {
		const generatedAt = "2025-01-15T12:00:00.000Z";
		setCachedSummary(makeSummary("cache-test-time", { generatedAt }));

		const cached = getCachedSummary("cache-test-time");
		expect(cached!.generatedAt).toBe(generatedAt);
	});
});
