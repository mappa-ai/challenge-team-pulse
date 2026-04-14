export interface TeamConfig {
	slug: string;
	name: string;
	slackChannels: string[];
	githubRepos: string[];
	linearTeamIds: string[];
	color: string;
}

export const teams: TeamConfig[] = [
	{
		slug: "platform",
		name: "Platform",
		slackChannels: ["C0600AB9J2Y"],
		githubRepos: [
			"mappa-ai/mappa-backoffice",
			"mappa-ai/mappa-backoffice-test-e2e",
			"mappa-ai/hirings-db",
			"mappa-ai/mappa-hirings",
			"mappa-ai/skills",
		],
		linearTeamIds: ["5fdabca0-dc12-406f-9282-8e1806a923d2"],
		color: "#4a7aff",
	},
	{
		slug: "ai-voice",
		name: "AI & Voice",
		slackChannels: ["C03PHSKBH39"],
		githubRepos: [
			"mappa-ai/behavioral-engine",
			"mappa-ai/mappa-behavioral-engine-test-e2e",
			"mappa-ai/conduit-llm",
			"mappa-ai/conduit-voiceprint",
			"mappa-ai/datasets",
		],
		linearTeamIds: ["5fdabca0-dc12-406f-9282-8e1806a923d2"],
		color: "#a06aff",
	},
	{
		slug: "recruiting",
		name: "Recruiting & Agents",
		slackChannels: ["C08TR4JHBV2"],
		githubRepos: [
			"mappa-ai/agents",
			"mappa-ai/mappa-hirings",
			"mappa-ai/cohort-challenge",
			"mappa-ai/layered-lenses-survey",
		],
		linearTeamIds: ["5fdabca0-dc12-406f-9282-8e1806a923d2"],
		color: "#ff6ab0",
	},
	{
		slug: "data-infra",
		name: "Data & Infrastructure",
		slackChannels: ["C08A44LUKQ8"],
		githubRepos: [
			"mappa-ai/slack-triage-hub",
			"mappa-ai/challenge-team-pulse",
			"mappa-ai/hirings-db",
		],
		linearTeamIds: ["5fdabca0-dc12-406f-9282-8e1806a923d2"],
		color: "#ff9f43",
	},
];

export function getTeamBySlug(slug: string): TeamConfig | undefined {
	return teams.find((t) => t.slug === slug);
}
