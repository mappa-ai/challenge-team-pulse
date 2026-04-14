import { describe, expect, it } from "bun:test";
import { POST as POST_REFRESH } from "../src/app/api/refresh/[slug]/route";
import { POST as POST_SUMMARIZE } from "../src/app/api/summarize/route";
import { jsonRequest, parseJson } from "./helpers";

describe("POST /api/summarize", () => {
	it("returns 404 for unknown team", async () => {
		const req = jsonRequest("http://localhost/api/summarize", {
			teamSlug: "nonexistent",
		});
		const res = await POST_SUMMARIZE(req);

		expect(res.status).toBe(404);
		const data = await parseJson(res);
		expect(data.error).toBe("Team not found");
	});
});

describe("POST /api/refresh/[slug]", () => {
	it("returns 404 for unknown slug", async () => {
		const req = jsonRequest("http://localhost/api/refresh/nonexistent");
		const res = await POST_REFRESH(req, { params: { slug: "nonexistent" } });

		expect(res.status).toBe(404);
		const data = await parseJson(res);
		expect(data.error).toBe("Team not found");
	});
});
