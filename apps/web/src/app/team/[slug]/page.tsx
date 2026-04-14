"use client";

import { ActivityTable } from "$/components/ActivityTable";
import { SummaryView } from "$/components/SummaryView";
import { TabBar } from "$/components/TabBar";
import type { ActivityItem, TeamConfig, TeamSummary } from "@team-pulse/core";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Tab = "Summary" | "Activity";

export default function TeamPage() {
	const params = useParams();
	const slug = params.slug as string;

	const [team, setTeam] = useState<TeamConfig | null>(null);
	const [summary, setSummary] = useState<TeamSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [activeTab, setActiveTab] = useState<Tab>("Summary");
	const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
	const [activityLoading, setActivityLoading] = useState(false);
	const [activityLoaded, setActivityLoaded] = useState(false);

	const fetchTeam = useCallback(async () => {
		const res = await fetch(`/api/teams/${slug}`);
		if (!res.ok) {
			setError("Team not found");
			setLoading(false);
			return;
		}
		const data = await res.json();
		setTeam(data.team);
		setSummary(data.summary);
		setLoading(false);
	}, [slug]);

	async function refresh() {
		setRefreshing(true);
		try {
			const res = await fetch(`/api/refresh/${slug}?v=2`, { method: "POST" });
			const data = await res.json();
			setSummary(data.summary);
		} catch (err) {
			console.error("Refresh error:", err);
		}
		setRefreshing(false);
	}

	async function fetchActivity() {
		if (activityLoaded) return;
		setActivityLoading(true);
		try {
			const res = await fetch(`/api/activity/${slug}`);
			const data = await res.json();
			setActivityItems(data.items ?? []);
			setActivityLoaded(true);
		} catch (err) {
			console.error("Activity fetch error:", err);
		}
		setActivityLoading(false);
	}

	function handleTabChange(tab: string) {
		setActiveTab(tab as Tab);
		if (tab === "Activity") {
			fetchActivity();
		}
	}

	useEffect(() => {
		fetchTeam();
	}, [fetchTeam]);

	if (loading) {
		return (
			<div className="px-8 py-8">
				<div className="animate-pulse space-y-6">
					<div className="h-6 bg-white/10 rounded w-1/4" />
					<div className="h-40 bg-white/[0.03] rounded-xl" />
					<div className="h-40 bg-white/[0.03] rounded-xl" />
				</div>
			</div>
		);
	}

	if (error || !team) {
		return (
			<div className="px-8 py-8 flex items-center justify-center min-h-[50vh]">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Team not found</h1>
					<p className="text-gray-500 text-sm">Check the URL or select a team from the sidebar</p>
				</div>
			</div>
		);
	}

	const prs = activityItems.filter((i) => i.type === "pr");
	const linearIssues = activityItems.filter((i) => i.type === "linear_issue");
	const issues = activityItems.filter((i) => i.type === "issue");
	const commits = activityItems.filter((i) => i.type === "commit");

	return (
		<div className="px-8 py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
					<h1 className="text-2xl font-bold text-white">{team.name}</h1>
				</div>
				<button
					type="button"
					onClick={refresh}
					disabled={refreshing}
					className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{refreshing ? (
						<>
							<svg
								aria-hidden="true"
								className="animate-spin h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
							Generating...
						</>
					) : (
						"Refresh"
					)}
				</button>
			</div>

			{/* Source badges */}
			<div className="mb-6 flex flex-wrap gap-2">
				{team.slackChannels.map((ch) => (
					<span
						key={ch}
						className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300"
					>
						# {ch}
					</span>
				))}
				{team.githubRepos.map((repo) => (
					<span
						key={repo}
						className="text-xs px-2.5 py-1 rounded-md bg-gray-500/10 border border-gray-500/20 text-gray-400"
					>
						{repo}
					</span>
				))}
			</div>

			{/* Tabs */}
			<TabBar tabs={["Summary", "Activity"]} active={activeTab} onChange={handleTabChange} />

			{/* Tab content */}
			<div className="mt-6">
				{activeTab === "Summary" &&
					(summary ? (
						<SummaryView summary={summary} />
					) : (
						<div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-10 text-center">
							<p className="text-gray-500 mb-4">No summary generated yet for this team.</p>
							<button
								type="button"
								onClick={refresh}
								disabled={refreshing}
								className="px-5 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
							>
								Generate Summary
							</button>
						</div>
					))}

				{activeTab === "Activity" &&
					(activityLoading ? (
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 animate-pulse"
								>
									<div className="h-3 bg-white/10 rounded w-1/4 mb-3" />
									<div className="h-2 bg-white/5 rounded w-full mb-2" />
									<div className="h-2 bg-white/5 rounded w-3/4" />
								</div>
							))}
						</div>
					) : (
						<div className="space-y-8">
							{/* PR Table */}
							<div>
								<h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
									Pull Requests
									<span className="text-xs text-gray-600 bg-white/[0.05] px-1.5 py-0.5 rounded">
										{prs.length}
									</span>
								</h3>
								<ActivityTable
									items={prs}
									columns={["author", "title", "repo", "status", "timestamp"]}
									emptyMessage="No recent pull requests"
								/>
							</div>

							{/* Linear Issues Table */}
							{linearIssues.length > 0 && (
								<div>
									<h3 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
										Linear Issues
										<span className="text-xs text-gray-600 bg-white/[0.05] px-1.5 py-0.5 rounded">
											{linearIssues.length}
										</span>
									</h3>
									<ActivityTable
										items={linearIssues}
										columns={["author", "title", "status", "labels", "timestamp"]}
										emptyMessage="No recent Linear issues"
									/>
								</div>
							)}

							{/* GitHub Issues */}
							{issues.length > 0 && (
								<div>
									<h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
										Issues
										<span className="text-xs text-gray-600 bg-white/[0.05] px-1.5 py-0.5 rounded">
											{issues.length}
										</span>
									</h3>
									<ActivityTable
										items={issues}
										columns={["author", "title", "repo", "status", "timestamp"]}
										emptyMessage="No recent issues"
									/>
								</div>
							)}

							{/* Commits */}
							{commits.length > 0 && (
								<div>
									<h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
										Commits
										<span className="text-xs text-gray-600 bg-white/[0.05] px-1.5 py-0.5 rounded">
											{commits.length}
										</span>
									</h3>
									<ActivityTable
										items={commits}
										columns={["author", "title", "repo", "timestamp"]}
										emptyMessage="No recent commits"
									/>
								</div>
							)}
						</div>
					))}
			</div>
		</div>
	);
}
