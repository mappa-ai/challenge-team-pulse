import type { TeamSummary } from "./types";

interface CacheEntry {
	summary: TeamSummary;
	expiresAt: number;
}

interface SwrEntry {
	data: Record<string, unknown>;
	staleAt: number; // when to start revalidating in background
	expiresAt: number; // when to discard entirely (fallback)
}

const TTL_MS = 15 * 60 * 1000; // 15 minutes
const STALE_MS = 5 * 60 * 1000; // fresh for 5 min, stale-while-revalidate for next 10

const store = new Map<string, CacheEntry>();
const swrStore = new Map<string, SwrEntry>();
const revalidating = new Set<string>(); // prevents parallel revalidations

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

/**
 * Stale-while-revalidate cache.
 *
 * Returns { data, stale } where:
 * - data: the cached value (always returned if exists, even if stale)
 * - stale: true means caller should revalidate in background
 *
 * Returns null only on the very first call (cold cache).
 */
export function getSwrCache(key: string): { data: Record<string, unknown>; stale: boolean } | null {
	const entry = swrStore.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		swrStore.delete(key);
		return null;
	}
	return { data: entry.data, stale: Date.now() > entry.staleAt };
}

export function setSwrCache(key: string, data: Record<string, unknown>): void {
	swrStore.set(key, {
		data,
		staleAt: Date.now() + STALE_MS,
		expiresAt: Date.now() + TTL_MS,
	});
}

export function isRevalidating(key: string): boolean {
	return revalidating.has(key);
}

export function setRevalidating(key: string, value: boolean): void {
	if (value) revalidating.add(key);
	else revalidating.delete(key);
}
