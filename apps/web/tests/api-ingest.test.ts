import { describe, expect, it } from "bun:test";
import { POST as POST_GITHUB } from "../src/app/api/ingest/github/route";
import { POST as POST_SLACK } from "../src/app/api/ingest/slack/route";
import { jsonRequest, parseJson } from "./helpers";

const hasSlackToken = !!process.env.SLACK_BOT_TOKEN;
const hasGithubToken = !!process.env.GITHUB_TOKEN;

describe("POST /api/ingest/slack", () => {
	it("returns 404 for unknown team", async () => {
		const req = jsonRequest("http://localhost/api/ingest/slack", {
			teamSlug: "nonexistent",
		});
		const res = await POST_SLACK(req);

		expect(res.status).toBe(404);
		const data = await parseJson(res);
		expect(data.error).toBe("Team not found");
	});

	it.skipIf(!hasSlackToken)("with token: returns structured response for valid team", async () => {
		const req = jsonRequest("http://localhost/api/ingest/slack", {
			teamSlug: "ops",
		});
		const res = await POST_SLACK(req);

		expect(res.status).toBe(200);
		const data = await parseJson(res);
		expect(data.source).toBe("slack");
		expect(data.teamSlug).toBe("ops");
		expect(typeof data.count).toBe("number");
		expect(data.items).toBeArray();
	});
});

describe("POST /api/ingest/github", () => {
	it("returns 404 for unknown team", async () => {
		const req = jsonRequest("http://localhost/api/ingest/github", {
			teamSlug: "nonexistent",
		});
		const res = await POST_GITHUB(req);

		expect(res.status).toBe(404);
		const data = await parseJson(res);
		expect(data.error).toBe("Team not found");
	});

	it.skipIf(!hasGithubToken)("with token: returns structured response for valid team", async () => {
		const req = jsonRequest("http://localhost/api/ingest/github", {
			teamSlug: "product",
		});
		const res = await POST_GITHUB(req);

		expect(res.status).toBe(200);
		const data = await parseJson(res);
		expect(data.source).toBe("github");
		expect(data.teamSlug).toBe("product");
		expect(typeof data.count).toBe("number");
		expect(data.items).toBeArray();
	});
});
