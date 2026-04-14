import { LinearClient } from "@linear/sdk";
import type { ActivityItem } from "./types";

function getClient(): LinearClient {
	return new LinearClient({ apiKey: process.env.LINEAR_API_KEY ?? "" });
}

export async function fetchLinearIssues(teamId: string, hoursBack = 336): Promise<ActivityItem[]> {
	try {
		const linear = getClient();
		const since = new Date(Date.now() - hoursBack * 3600000);

		const items: ActivityItem[] = [];
		let hasMore = true;
		let cursor: string | undefined;

		while (hasMore) {
			const issues = await linear.issues({
				filter: {
					team: { id: { eq: teamId } },
					updatedAt: { gte: since },
				},
				first: 100,
				after: cursor,
			});

			for (const issue of issues.nodes) {
				const assignee = await issue.assignee;
				const state = await issue.state;
				const labelConnection = await issue.labels();
				const labels = labelConnection.nodes.map((l) => l.name);

				items.push({
					source: "linear",
					type: "linear_issue",
					title: issue.title,
					author: assignee?.name ?? "unassigned",
					timestamp: issue.updatedAt.toISOString(),
					url: issue.url,
					status: mapLinearState(state?.type),
					labels,
					identifier: issue.identifier,
				});
			}

			hasMore = issues.pageInfo.hasNextPage;
			cursor = issues.pageInfo.endCursor ?? undefined;
		}

		return items;
	} catch (err) {
		console.error(`Error fetching Linear issues for team "${teamId}":`, err);
		return [];
	}
}

export async function fetchLinearIssuesByAssignee(
	teamId: string,
	assigneeName: string,
): Promise<ActivityItem[]> {
	try {
		const linear = getClient();
		const items: ActivityItem[] = [];
		let hasMore = true;
		let cursor: string | undefined;

		while (hasMore) {
			const issues = await linear.issues({
				filter: {
					team: { id: { eq: teamId } },
					assignee: { name: { containsIgnoreCase: assigneeName } },
				},
				first: 100,
				after: cursor,
			});

			for (const issue of issues.nodes) {
				const assignee = await issue.assignee;
				const state = await issue.state;
				const labelConnection = await issue.labels();
				const labels = labelConnection.nodes.map((l) => l.name);

				items.push({
					source: "linear",
					type: "linear_issue",
					title: issue.title,
					author: assignee?.name ?? "unassigned",
					timestamp: issue.updatedAt.toISOString(),
					url: issue.url,
					status: mapLinearState(state?.type),
					labels,
					identifier: issue.identifier,
				});
			}

			hasMore = issues.pageInfo.hasNextPage;
			cursor = issues.pageInfo.endCursor ?? undefined;
		}

		return items;
	} catch (err) {
		console.error(`Error fetching Linear issues by assignee "${assigneeName}":`, err);
		return [];
	}
}

export async function fetchLinearCycles(teamId: string): Promise<ActivityItem[]> {
	try {
		const linear = getClient();
		const team = await linear.team(teamId);
		const cycles = await team.cycles({
			filter: { isActive: { eq: true } },
			first: 5,
		});

		const items: ActivityItem[] = [];
		for (const cycle of cycles.nodes) {
			items.push({
				source: "linear",
				type: "linear_cycle",
				title: `Cycle ${cycle.number}: ${cycle.name ?? "Unnamed"}`,
				author: "team",
				timestamp: cycle.updatedAt.toISOString(),
				url: `https://linear.app/cycle/${cycle.id}`,
				status: cycle.completedAt ? "closed" : "open",
			});
		}

		return items;
	} catch (err) {
		console.error(`Error fetching Linear cycles for team "${teamId}":`, err);
		return [];
	}
}

export async function fetchLinearProjects(teamId: string): Promise<ActivityItem[]> {
	try {
		const linear = getClient();
		const projects = await linear.projects({
			filter: {
				accessibleTeams: { some: { id: { eq: teamId } } },
			},
			first: 20,
		});

		const items: ActivityItem[] = [];
		for (const project of projects.nodes) {
			const lead = await project.lead;
			items.push({
				source: "linear",
				type: "linear_project",
				title: project.name,
				author: lead?.name ?? "no lead",
				timestamp: project.updatedAt.toISOString(),
				url: project.url,
				status: project.completedAt ? "closed" : "open",
			});
		}

		return items;
	} catch (err) {
		console.error(`Error fetching Linear projects for team "${teamId}":`, err);
		return [];
	}
}

function mapLinearState(stateType?: string): "open" | "closed" | undefined {
	if (!stateType) return undefined;
	if (stateType === "completed" || stateType === "canceled") return "closed";
	return "open";
}
