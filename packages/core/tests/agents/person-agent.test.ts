import { describe, expect, it } from "bun:test";
import { makePersonTools } from "../../src/agents/person-agent";

describe("Person Agent", () => {
	describe("makePersonTools", () => {
		it("creates 2 tools when both repos and linearTeamIds are provided", () => {
			const tools = makePersonTools(["acme/web-app"], ["team-123"]);
			expect(tools).toHaveLength(2);
		});

		it("creates only github tool when no linearTeamIds", () => {
			const tools = makePersonTools(["acme/web-app", "acme/api"], []);
			expect(tools).toHaveLength(1);
			expect(tools[0]!.definition.name).toBe("search_github_activity");
		});

		it("creates only linear tool when no repos", () => {
			const tools = makePersonTools([], ["team-123"]);
			expect(tools).toHaveLength(1);
			expect(tools[0]!.definition.name).toBe("search_linear_activity");
		});

		it("creates no tools when no repos and no linearTeamIds", () => {
			const tools = makePersonTools([], []);
			expect(tools).toHaveLength(0);
		});

		it("creates search_github_activity tool with correct schema", () => {
			const tools = makePersonTools(["acme/web-app"], []);
			const tool = tools.find((t) => t.definition.name === "search_github_activity");
			expect(tool).toBeDefined();
			expect(tool!.definition.input_schema.type).toBe("object");
			expect(tool!.definition.input_schema.required).toEqual(["username"]);
		});

		it("creates search_linear_activity tool with correct schema", () => {
			const tools = makePersonTools([], ["team-123"]);
			const tool = tools.find((t) => t.definition.name === "search_linear_activity");
			expect(tool).toBeDefined();
			expect(tool!.definition.input_schema.type).toBe("object");
			expect(tool!.definition.input_schema.required).toEqual(["person_name"]);
		});

		it("tool descriptions mention available repos", () => {
			const tools = makePersonTools(["acme/web-app", "acme/api"], []);
			const tool = tools[0]!;
			expect(tool.definition.description).toContain("acme/web-app");
			expect(tool.definition.description).toContain("acme/api");
		});

		it("tool descriptions mention available team IDs", () => {
			const tools = makePersonTools([], ["team-123", "team-456"]);
			const tool = tools[0]!;
			expect(tool.definition.description).toContain("team-123");
			expect(tool.definition.description).toContain("team-456");
		});

		it("all tools have execute functions", () => {
			const tools = makePersonTools(["acme/web-app"], ["team-123"]);
			for (const tool of tools) {
				expect(typeof tool.execute).toBe("function");
			}
		});
	});
});
