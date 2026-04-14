"use client";

import type { ActivityItem } from "@team-pulse/core";
import { ActivityTable } from "./ActivityTable";

interface PersonSearchResultsProps {
	query: string;
	summary: string;
	activities: ActivityItem[];
}

export function PersonSearchResults({ query, summary, activities }: PersonSearchResultsProps) {
	const prs = activities.filter((a) => a.type === "pr");
	const issues = activities.filter((a) => a.type === "issue");
	const commits = activities.filter((a) => a.type === "commit");
	const linearIssues = activities.filter((a) => a.type === "linear_issue");

	return (
		<div className="space-y-6">
			{/* AI Summary */}
			<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
				<div className="flex items-center gap-2 mb-3">
					<div className="w-2 h-2 rounded-full bg-indigo-500" />
					<h3 className="text-sm font-medium text-gray-400">
						AI Summary for &ldquo;{query}&rdquo;
					</h3>
				</div>
				<p className="text-gray-200 text-sm leading-relaxed">{summary}</p>
			</div>

			{/* GitHub PRs */}
			{prs.length > 0 && (
				<Section title="Pull Requests" count={prs.length} color="text-purple-400">
					<ActivityTable items={prs} columns={["title", "repo", "status", "timestamp"]} />
				</Section>
			)}

			{/* GitHub Issues */}
			{issues.length > 0 && (
				<Section title="Issues" count={issues.length} color="text-amber-400">
					<ActivityTable items={issues} columns={["title", "repo", "status", "timestamp"]} />
				</Section>
			)}

			{/* Commits */}
			{commits.length > 0 && (
				<Section title="Commits" count={commits.length} color="text-emerald-400">
					<ActivityTable items={commits} columns={["title", "repo", "timestamp"]} />
				</Section>
			)}

			{/* Linear Issues */}
			{linearIssues.length > 0 && (
				<Section title="Linear Issues" count={linearIssues.length} color="text-blue-400">
					<ActivityTable
						items={linearIssues}
						columns={["title", "status", "labels", "timestamp"]}
					/>
				</Section>
			)}

			{activities.length === 0 && (
				<div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-10 text-center text-gray-500">
					No activity found for &ldquo;{query}&rdquo;
				</div>
			)}
		</div>
	);
}

function Section({
	title,
	count,
	color,
	children,
}: {
	title: string;
	count: number;
	color: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className="flex items-center gap-2 mb-3">
				<h3 className={`text-sm font-medium ${color}`}>{title}</h3>
				<span className="text-xs text-gray-600 bg-white/[0.05] px-1.5 py-0.5 rounded">{count}</span>
			</div>
			{children}
		</div>
	);
}
