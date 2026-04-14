import { describe, expect, it } from "bun:test";
import { makeOrchestratorTools } from "../../src/agents/orchestrator";
import type { TeamConfig } from "../../src/teams.config";

const baseTeam: TeamConfig = {
	slug: "ops",
	name: "Operations",
	slackChannels: ["ops-general"],
	githubRepos: ["acme/infra"],
	linearTeamIds: ["team-abc"],
	color: "#4a7aff",
};

describe("Orchestrator Agent", () => {
	describe("makeOrchestratorTools", () => {
		it("creates both github and linear tools when team has both", () => {
			const tools = makeOrchestratorTools(baseTeam);
			const names = tools.map((t) => t.definition.name);

			expect(names).toContain("run_github_analysis");
			expect(names).toContain("run_linear_analysis");
			expect(tools).toHaveLength(2);
		});

		it("only creates github tool when team has no linearTeamIds", () => {
			const team: TeamConfig = { ...baseTeam, linearTeamIds: [] };
			const tools = makeOrchestratorTools(team);
			const names = tools.map((t) => t.definition.name);

			expect(names).toContain("run_github_analysis");
			expect(names).not.toContain("run_linear_analysis");
			expect(tools).toHaveLength(1);
		});

		it("only creates linear tool when team has no githubRepos", () => {
			const team: TeamConfig = { ...baseTeam, githubRepos: [] };
			const tools = makeOrchestratorTools(team);
			const names = tools.map((t) => t.definition.name);

			expect(names).not.toContain("run_github_analysis");
			expect(names).toContain("run_linear_analysis");
			expect(tools).toHaveLength(1);
		});

		it("creates no tools when team has neither repos nor linear IDs", () => {
			const team: TeamConfig = { ...baseTeam, githubRepos: [], linearTeamIds: [] };
			const tools = makeOrchestratorTools(team);

			expect(tools).toHaveLength(0);
		});

		it("all tools have valid definitions with name and description", () => {
			const tools = makeOrchestratorTools(baseTeam);

			for (const tool of tools) {
				expect(tool.definition.name).toBeString();
				expect(tool.definition.description).toBeString();
				expect(tool.definition.input_schema.type).toBe("object");
				expect(typeof tool.execute).toBe("function");
			}
		});

		it("github tool description mentions analysis", () => {
			const tools = makeOrchestratorTools(baseTeam);
			const ghTool = tools.find((t) => t.definition.name === "run_github_analysis");

			expect(ghTool!.definition.description).toContain("GitHub");
		});

		it("linear tool description mentions analysis", () => {
			const tools = makeOrchestratorTools(baseTeam);
			const linTool = tools.find((t) => t.definition.name === "run_linear_analysis");

			expect(linTool!.definition.description).toContain("Linear");
		});
	});
});
