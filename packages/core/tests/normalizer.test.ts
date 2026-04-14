import { describe, expect, it } from "bun:test";
import { formatForPrompt, normalizeAndSort } from "../src/normalizer";
import type { ActivityItem } from "../src/types";

const mockItems: ActivityItem[] = [
	{
		source: "slack",
		type: "message",
		title: "Deploying v2.3 to production",
		author: "alice",
		timestamp: "2025-01-15T10:00:00Z",
		url: "https://slack.com/archives/C123/p1234",
	},
	{
		source: "github",
		type: "pr",
		title: "feat: add user dashboard",
		author: "bob",
		timestamp: "2025-01-15T14:00:00Z",
		url: "https://github.com/acme/web-app/pull/42",
		status: "open",
		labels: ["feature", "frontend"],
	},
	{
		source: "github",
		type: "commit",
		title: "fix: resolve login redirect loop",
		author: "charlie",
		timestamp: "2025-01-15T08:00:00Z",
		url: "https://github.com/acme/web-app/commit/abc123",
	},
	{
		source: "github",
		type: "issue",
		title: "Bug: API timeout on large payloads",
		author: "diana",
		timestamp: "2025-01-15T12:00:00Z",
		url: "https://github.com/acme/web-app/issues/99",
		status: "open",
		labels: ["bug", "blocked"],
	},
];

describe("normalizeAndSort", () => {
	it("sorts items by timestamp descending (newest first)", () => {
		const sorted = normalizeAndSort([...mockItems]);

		for (let i = 1; i < sorted.length; i++) {
			const prev = new Date(sorted[i - 1]!.timestamp).getTime();
			const curr = new Date(sorted[i]!.timestamp).getTime();
			expect(prev).toBeGreaterThanOrEqual(curr);
		}
	});

	it("preserves all items without losing any", () => {
		const sorted = normalizeAndSort([...mockItems]);
		expect(sorted).toHaveLength(mockItems.length);
	});

	it("handles empty array", () => {
		const sorted = normalizeAndSort([]);
		expect(sorted).toHaveLength(0);
	});

	it("handles single item", () => {
		const sorted = normalizeAndSort([mockItems[0]!]);
		expect(sorted).toHaveLength(1);
		expect(sorted[0]!.title).toBe(mockItems[0]!.title);
	});

	it("newest item is first after sort", () => {
		const sorted = normalizeAndSort([...mockItems]);
		expect(sorted[0]!.author).toBe("bob"); // 14:00 is latest
		expect(sorted[sorted.length - 1]!.author).toBe("charlie"); // 08:00 is earliest
	});
});

describe("formatForPrompt", () => {
	it("returns valid JSON string", () => {
		const json = formatForPrompt(mockItems);
		expect(() => JSON.parse(json)).not.toThrow();
	});

	it("includes all items in output", () => {
		const json = formatForPrompt(mockItems);
		const parsed = JSON.parse(json);
		expect(parsed).toHaveLength(mockItems.length);
	});

	it("includes required fields for each item", () => {
		const json = formatForPrompt(mockItems);
		const parsed = JSON.parse(json);

		for (const item of parsed) {
			expect(item).toHaveProperty("source");
			expect(item).toHaveProperty("type");
			expect(item).toHaveProperty("title");
			expect(item).toHaveProperty("author");
			expect(item).toHaveProperty("timestamp");
			expect(item).toHaveProperty("url");
		}
	});

	it("includes status only when present", () => {
		const json = formatForPrompt(mockItems);
		const parsed = JSON.parse(json);

		const prItem = parsed.find((i: Record<string, unknown>) => i.type === "pr");
		expect(prItem.status).toBe("open");

		const commitItem = parsed.find((i: Record<string, unknown>) => i.type === "commit");
		expect(commitItem.status).toBeUndefined();
	});

	it("includes labels only when non-empty", () => {
		const json = formatForPrompt(mockItems);
		const parsed = JSON.parse(json);

		const prItem = parsed.find((i: Record<string, unknown>) => i.type === "pr");
		expect(prItem.labels).toEqual(["feature", "frontend"]);

		const slackItem = parsed.find((i: Record<string, unknown>) => i.type === "message");
		expect(slackItem.labels).toBeUndefined();
	});

	it("handles empty array", () => {
		const json = formatForPrompt([]);
		expect(JSON.parse(json)).toEqual([]);
	});
});
