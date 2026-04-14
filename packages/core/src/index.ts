export type { ActivityItem, SourceRef, TeamSummary } from "./types";
export type { TeamConfig } from "./teams.config";

export { teams, getTeamBySlug } from "./teams.config";
export { fetchSlackMessages } from "./slack";
export { fetchGitHubActivity } from "./github";
export { normalizeAndSort, formatForPrompt } from "./normalizer";
export { generateTeamSummary } from "./claude";
export { getCachedSummary, setCachedSummary, getAllCachedSummaries } from "./cache";
