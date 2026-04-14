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
		slug: "product",
		name: "Product Team",
		slackChannels: ["C0600AB9J2Y"],
		githubRepos: [
			"mappa-ai/mappa-backoffice",
			"mappa-ai/mappa-hirings",
			"mappa-ai/hirings-db",
			"mappa-ai/mappa-backoffice-test-e2e",
			"mappa-ai/behavioral-engine",
			"mappa-ai/mappa-behavioral-engine-test-e2e",
			"mappa-ai/conduit-llm",
			"mappa-ai/conduit-voiceprint",
			"mappa-ai/agents",
			"mappa-ai/skills",
			"mappa-ai/datasets",
			"mappa-ai/slack-triage-hub",
			"mappa-ai/cohort-challenge",
			"mappa-ai/layered-lenses-survey",
		],
		linearTeamIds: ["5fdabca0-dc12-406f-9282-8e1806a923d2"],
		color: "#6366f1",
	},
];

export function getTeamBySlug(slug: string): TeamConfig | undefined {
	return teams.find((t) => t.slug === slug);
}
