// Types
export type { ActivityItem, SourceRef, TeamSummary } from "./types";
export type { TeamConfig } from "./teams.config";
export type { AgentConfig, AgentResult, ToolHandler } from "./agents/types";

// Config
export { teams, getTeamBySlug } from "./teams.config";

// Data clients
export { fetchSlackMessages } from "./slack";
export { fetchGitHubActivity, fetchPRs, fetchIssues, fetchCommits } from "./github";
export {
	fetchLinearIssues,
	fetchLinearIssuesByAssignee,
	fetchLinearCycles,
	fetchLinearProjects,
} from "./linear";

// Summarization (v1: single-shot)
export { generateTeamSummary } from "./claude";
export { normalizeAndSort, formatForPrompt } from "./normalizer";

// Agents (v2: multi-agent orchestrator)
export { runAgent } from "./agents/runner";
export { runGitHubAgent } from "./agents/github-agent";
export { runLinearAgent } from "./agents/linear-agent";
export { generateTeamSummaryV2 } from "./agents/orchestrator";
export { runPersonAgent, searchPerson } from "./agents/person-agent";
export { makeMarioTools, runMarioAgent } from "./agents/mario-agent";

// Cache
export {
	getCachedSummary,
	setCachedSummary,
	getAllCachedSummaries,
	getSwrCache,
	setSwrCache,
	isRevalidating,
	setRevalidating,
} from "./cache";
