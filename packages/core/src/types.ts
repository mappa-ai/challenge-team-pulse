export interface ActivityItem {
	source: "slack" | "github";
	type: "message" | "pr" | "issue" | "commit";
	title: string;
	author: string;
	timestamp: string;
	url: string;
	status?: "open" | "merged" | "closed";
	labels?: string[];
}

export interface SourceRef {
	label: string;
	url: string;
}

export interface TeamSummary {
	teamSlug: string;
	workingOn: string;
	recentChanges: string;
	blockedOrAtRisk: string;
	sources: SourceRef[];
	generatedAt: string;
}
