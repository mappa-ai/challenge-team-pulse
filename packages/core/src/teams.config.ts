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
			"mappa-ai/mappa-main",
			"mappa-ai/mappa-db",
			"mappa-ai/mappa-ui",
			"mappa-ai/mappa-mastra",
			"mappa-ai/mappa-studio",
		],
		linearTeamIds: ["5fdabca0-dc12-406f-9282-8e1806a923d2"],
		color: "#4a7aff",
	},
	{
		slug: "ai-voice",
		name: "AI & Voice",
		slackChannels: ["C03PHSKBH39"],
		githubRepos: [
			"mappa-ai/voice-analysis-system",
			"mappa-ai/speech-inference-api",
			"mappa-ai/hti-voice-analysis",
			"mappa-ai/hti-prosody-extractor",
			"mappa-ai/speech-emotion-recognition",
			"mappa-ai/english-fluency",
			"mappa-ai/hti-english-fluency",
			"mappa-ai/hti-stress-analysis",
		],
		linearTeamIds: [],
		color: "#a06aff",
	},
	{
		slug: "recruiting",
		name: "Recruiting & Agents",
		slackChannels: ["C08TR4JHBV2"],
		githubRepos: [
			"mappa-ai/recruiting-agent-server",
			"mappa-ai/vetting-agent",
			"mappa-ai/maria-llm-agent",
			"mappa-ai/mappa-copilot",
			"mappa-ai/copilot-core",
			"mappa-ai/mappa-executives",
			"mappa-ai/langgraph-server",
		],
		linearTeamIds: [],
		color: "#ff6ab0",
	},
	{
		slug: "data-infra",
		name: "Data & Infrastructure",
		slackChannels: ["C08A44LUKQ8"],
		githubRepos: [
			"mappa-ai/smart_crawler",
			"mappa-ai/mappa-company-scraper",
			"mappa-ai/linkedin-company-scraper",
			"mappa-ai/mappa-scraper-cli-tools",
			"mappa-ai/hti-syphon",
			"mappa-ai/observability-stack",
			"mappa-ai/mappa-loadbalancer-scrapers",
		],
		linearTeamIds: [],
		color: "#ff9f43",
	},
];

export function getTeamBySlug(slug: string): TeamConfig | undefined {
	return teams.find((t) => t.slug === slug);
}
