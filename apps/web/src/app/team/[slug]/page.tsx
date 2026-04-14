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
					<div className="h-8 bg-white/10 rounded w-1/4" />
					<div className="h-48 bg-white/[0.03] rounded-2xl" />
					<div className="h-48 bg-white/[0.03] rounded-2xl" />
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
		<div className="px-8 py-8 max-w-6xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-4">
					<div
						className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
						style={{
							background: `linear-gradient(135deg, ${team.color}, ${team.color}80)`,
							boxShadow: `0 4px 14px ${team.color}30`,
						}}
					>
						{team.name[0]}
					</div>
					<div>
						<h1 className="text-2xl font-bold text-white">{team.name}</h1>
						<p className="text-sm text-gray-500 mt-0.5">
							{team.githubRepos.length} repos &middot;{" "}
							{team.linearTeamIds.length > 0 ? "Linear connected" : "GitHub only"}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={refresh}
					disabled={refreshing}
					className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
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

			{/* Tabs */}
			<TabBar tabs={["Summary", "Activity"]} active={activeTab} onChange={handleTabChange} />

			{/* Tab content */}
			<div className="mt-6">
				{activeTab === "Summary" &&
					(summary ? (
						<SummaryView summary={summary} />
					) : (
						<div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12 text-center">
							<div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
								<svg
									aria-hidden="true"
									className="w-8 h-8 text-indigo-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
							</div>
							<p className="text-gray-400 mb-4">No AI summary yet. Generate one to get started.</p>
							<button
								type="button"
								onClick={refresh}
								disabled={refreshing}
								className="px-5 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
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
							<ActivitySection title="Pull Requests" count={prs.length} color="text-purple-400">
								<ActivityTable
									items={prs}
									columns={["author", "title", "repo", "status", "timestamp"]}
									emptyMessage="No recent pull requests"
								/>
							</ActivitySection>

							{/* Linear Issues */}
							{linearIssues.length > 0 && (
								<ActivitySection
									title="Linear Issues"
									count={linearIssues.length}
									color="text-blue-400"
								>
									<ActivityTable
										items={linearIssues}
										columns={["id", "author", "title", "status", "labels", "timestamp"]}
										emptyMessage="No recent Linear issues"
									/>
								</ActivitySection>
							)}

							{/* GitHub Issues */}
							{issues.length > 0 && (
								<ActivitySection title="Issues" count={issues.length} color="text-amber-400">
									<ActivityTable
										items={issues}
										columns={["author", "title", "repo", "status", "timestamp"]}
										emptyMessage="No recent issues"
									/>
								</ActivitySection>
							)}

							{/* Commits */}
							{commits.length > 0 && (
								<ActivitySection title="Commits" count={commits.length} color="text-emerald-400">
									<ActivityTable
										items={commits}
										columns={["author", "title", "repo", "timestamp"]}
										emptyMessage="No recent commits"
									/>
								</ActivitySection>
							)}
						</div>
					))}
			</div>
		</div>
	);
}

function ActivitySection({
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
			<div className="flex items-center gap-2.5 mb-3">
				<h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
				<span className="text-[11px] text-gray-500 bg-white/[0.06] px-2 py-0.5 rounded-full font-medium">
					{count}
				</span>
			</div>
			{children}
		</div>
	);
}
