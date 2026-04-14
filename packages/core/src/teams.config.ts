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
		slug: "ops",
		name: "Operations",
		slackChannels: ["ops-general", "ops-incidents"],
		githubRepos: ["acme/infra", "acme/deploy-tools"],
		linearTeamIds: [],
		color: "#4a7aff",
	},
	{
		slug: "product",
		name: "Product",
		slackChannels: ["product-dev", "product-design"],
		githubRepos: ["acme/web-app", "acme/mobile-app"],
		linearTeamIds: [],
		color: "#a06aff",
	},
	{
		slug: "marketing",
		name: "Marketing",
		slackChannels: ["marketing-general", "marketing-campaigns"],
		githubRepos: ["acme/landing-page", "acme/blog"],
		linearTeamIds: [],
		color: "#ff6ab0",
	},
];

export function getTeamBySlug(slug: string): TeamConfig | undefined {
	return teams.find((t) => t.slug === slug);
}
