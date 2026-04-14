import { describe, expect, it } from "bun:test";
import { makeLinearTools } from "../../src/agents/linear-agent";

describe("Linear Agent", () => {
	describe("makeLinearTools", () => {
		const teamIds = ["team-abc-123", "team-def-456"];
		const tools = makeLinearTools(teamIds);

		it("creates exactly 3 tools", () => {
			expect(tools).toHaveLength(3);
		});

		it("creates fetch_linear_issues tool", () => {
			const tool = tools.find((t) => t.definition.name === "fetch_linear_issues");
			expect(tool).toBeDefined();
			expect(tool!.definition.description).toContain("team-abc-123");
			expect(tool!.definition.input_schema.required).toEqual(["team_id"]);
		});

		it("creates fetch_linear_cycles tool", () => {
			const tool = tools.find((t) => t.definition.name === "fetch_linear_cycles");
			expect(tool).toBeDefined();
			expect(tool!.definition.input_schema.required).toEqual(["team_id"]);
		});

		it("creates fetch_linear_projects tool", () => {
			const tool = tools.find((t) => t.definition.name === "fetch_linear_projects");
			expect(tool).toBeDefined();
			expect(tool!.definition.input_schema.required).toEqual(["team_id"]);
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

		it("tool descriptions mention available team IDs", () => {
			for (const tool of tools) {
				expect(tool.definition.description).toContain("team-abc-123");
				expect(tool.definition.description).toContain("team-def-456");
			}
		});
	});
});
