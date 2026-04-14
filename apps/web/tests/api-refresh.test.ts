import { describe, expect, it } from "bun:test";
import { POST as POST_REFRESH } from "../src/app/api/refresh/[slug]/route";
import { jsonRequest, parseJson } from "./helpers";

describe("POST /api/refresh/[slug]", () => {
	it("returns 404 for unknown slug", async () => {
		const req = jsonRequest("http://localhost/api/refresh/nonexistent");
		const res = await POST_REFRESH(req, { params: { slug: "nonexistent" } });

		expect(res.status).toBe(404);
		const data = await parseJson(res);
		expect(data.error).toBe("Team not found");
	});
});
