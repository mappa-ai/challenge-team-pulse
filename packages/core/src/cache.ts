import type { TeamSummary } from "./types";

interface CacheEntry {
	summary: TeamSummary;
	expiresAt: number;
}

const TTL_MS = 15 * 60 * 1000; // 15 minutes
const store = new Map<string, CacheEntry>();

export function getCachedSummary(teamSlug: string): TeamSummary | null {
	const entry = store.get(teamSlug);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		store.delete(teamSlug);
		return null;
	}
	return entry.summary;
}

export function setCachedSummary(summary: TeamSummary): void {
	store.set(summary.teamSlug, {
		summary,
		expiresAt: Date.now() + TTL_MS,
	});
}

export function getAllCachedSummaries(): TeamSummary[] {
	const results: TeamSummary[] = [];
	for (const [slug, entry] of Array.from(store.entries())) {
		if (Date.now() > entry.expiresAt) {
			store.delete(slug);
		} else {
			results.push(entry.summary);
		}
	}
	return results;
}
