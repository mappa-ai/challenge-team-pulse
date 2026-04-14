import type { ActivityItem } from "./types";

export function normalizeAndSort(items: ActivityItem[]): ActivityItem[] {
	return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function formatForPrompt(items: ActivityItem[]): string {
	return JSON.stringify(
		items.map((item) => ({
			source: item.source,
			type: item.type,
			title: item.title,
			author: item.author,
			timestamp: item.timestamp,
			url: item.url,
			...(item.status && { status: item.status }),
			...(item.labels?.length && { labels: item.labels }),
		})),
		null,
		2,
	);
}
