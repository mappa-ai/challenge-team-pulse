import { describe, expect, it } from "bun:test";
import { makeMarioTools } from "../../src/agents/mario-agent";

describe("Mario Agent", () => {
	describe("makeMarioTools", () => {
		const linearTeamIds = ["team-abc-123", "team-def-456"];
		const repos = ["acme/web-app", "acme/api"];

		it("creates both tools when team has linear IDs and repos", () => {
			const tools = makeMarioTools(linearTeamIds, repos);
			const names = tools.map((t) => t.definition.name);

			expect(names).toContain("fetch_linear_member_stats");
			expect(names).toContain("fetch_github_member_stats");
			expect(tools).toHaveLength(2);
		});

		it("only creates linear tool when repos is empty", () => {
			const tools = makeMarioTools(linearTeamIds, []);
			const names = tools.map((t) => t.definition.name);

			expect(names).toContain("fetch_linear_member_stats");
			expect(names).not.toContain("fetch_github_member_stats");
			expect(tools).toHaveLength(1);
		});

		it("only creates github tool when linearTeamIds is empty", () => {
			const tools = makeMarioTools([], repos);
			const names = tools.map((t) => t.definition.name);

			expect(names).not.toContain("fetch_linear_member_stats");
			expect(names).toContain("fetch_github_member_stats");
			expect(tools).toHaveLength(1);
		});

		it("creates no tools when both are empty", () => {
			const tools = makeMarioTools([], []);
			expect(tools).toHaveLength(0);
		});

		it("all tools have valid definitions with name, description, and object schema", () => {
			const tools = makeMarioTools(linearTeamIds, repos);

			for (const tool of tools) {
				expect(tool.definition.name).toBeString();
				expect(tool.definition.description).toBeString();
				expect(tool.definition.input_schema.type).toBe("object");
				expect(typeof tool.execute).toBe("function");
			}
		});

		it("linear tool description mentions available team IDs", () => {
			const tools = makeMarioTools(linearTeamIds, repos);
			const tool = tools.find((t) => t.definition.name === "fetch_linear_member_stats");

			expect(tool!.definition.description).toContain("team-abc-123");
			expect(tool!.definition.description).toContain("team-def-456");
		});

		it("github tool description mentions available repos", () => {
			const tools = makeMarioTools(linearTeamIds, repos);
			const tool = tools.find((t) => t.definition.name === "fetch_github_member_stats");

			expect(tool!.definition.description).toContain("acme/web-app");
			expect(tool!.definition.description).toContain("acme/api");
		});

		it("linear tool requires team_id", () => {
			const tools = makeMarioTools(linearTeamIds, []);
			const tool = tools.find((t) => t.definition.name === "fetch_linear_member_stats");

			expect(tool!.definition.input_schema.required).toEqual(["team_id"]);
		});

		it("github tool has no required fields", () => {
			const tools = makeMarioTools([], repos);
			const tool = tools.find((t) => t.definition.name === "fetch_github_member_stats");

			expect(tool!.definition.input_schema.required).toEqual([]);
		});
	});
});
