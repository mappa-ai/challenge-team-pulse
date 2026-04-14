import { describe, expect, it } from "bun:test";
import { makeGitHubTools } from "../../src/agents/github-agent";

describe("GitHub Agent", () => {
	describe("makeGitHubTools", () => {
		const repos = ["acme/web-app", "acme/api"];
		const tools = makeGitHubTools(repos);

		it("creates exactly 3 tools", () => {
			expect(tools).toHaveLength(3);
		});

		it("creates fetch_pull_requests tool", () => {
			const tool = tools.find((t) => t.definition.name === "fetch_pull_requests");
			expect(tool).toBeDefined();
			expect(tool!.definition.description).toContain("acme/web-app");
			expect(tool!.definition.description).toContain("acme/api");
			expect(tool!.definition.input_schema.required).toEqual(["owner", "repo"]);
		});

		it("creates fetch_issues tool", () => {
			const tool = tools.find((t) => t.definition.name === "fetch_issues");
			expect(tool).toBeDefined();
			expect(tool!.definition.input_schema.required).toEqual(["owner", "repo"]);
		});

		it("creates fetch_commits tool", () => {
			const tool = tools.find((t) => t.definition.name === "fetch_commits");
			expect(tool).toBeDefined();
			expect(tool!.definition.input_schema.required).toEqual(["owner", "repo"]);
		});

		it("all tools have valid input schemas with type object", () => {
			for (const tool of tools) {
				expect(tool.definition.input_schema.type).toBe("object");
				expect(tool.definition.input_schema.properties).toBeDefined();
			}
		});

		it("all tools have execute functions", () => {
			for (const tool of tools) {
				expect(typeof tool.execute).toBe("function");
			}
		});

		it("tool descriptions mention available repos", () => {
			for (const tool of tools) {
				expect(tool.definition.description).toContain("acme/web-app");
				expect(tool.definition.description).toContain("acme/api");
			}
		});
	});
});
