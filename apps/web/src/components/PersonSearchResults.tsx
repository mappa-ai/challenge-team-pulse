"use client";

import type { ActivityItem } from "@team-pulse/core";
import { ActivityTable } from "./ActivityTable";

interface PersonSearchResultsProps {
	query: string;
	summary: string;
	activities: ActivityItem[];
}

function computeMetrics(activities: ActivityItem[]) {
	const linearIssues = activities.filter((a) => a.type === "linear_issue");
	const prs = activities.filter((a) => a.type === "pr");
	const closed = linearIssues.filter((a) => a.status === "closed").length;
	const open = linearIssues.filter((a) => a.status === "open").length;
	const total = linearIssues.length;
	const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

	const mergedPrs = prs.filter((a) => a.status === "merged").length;
	const openPrs = prs.filter((a) => a.status === "open").length;

	return { closed, open, total, completionRate, mergedPrs, openPrs, totalPrs: prs.length };
}

function CircularProgress({ percent, size = 120 }: { percent: number; size?: number }) {
	const strokeWidth = 8;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percent / 100) * circumference;
	const color =
		percent >= 70 ? "#10b981" : percent >= 40 ? "#f59e0b" : percent > 0 ? "#ef4444" : "#374151";

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg aria-hidden="true" width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke="rgba(255,255,255,0.06)"
					fill="none"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke={color}
					fill="none"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className="transition-all duration-1000 ease-out"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-2xl font-bold text-white">{percent}%</span>
				<span className="text-[10px] text-gray-500 uppercase tracking-wider">completed</span>
			</div>
		</div>
	);
}

function StatusBar({
	label,
	value,
	total,
	color,
}: {
	label: string;
	value: number;
	total: number;
	color: string;
}) {
	const pct = total > 0 ? (value / total) * 100 : 0;
	return (
		<div className="flex items-center gap-3">
			<span className="text-xs text-gray-500 w-16 text-right">{label}</span>
			<div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-700 ease-out"
					style={{ width: `${pct}%`, backgroundColor: color }}
				/>
			</div>
			<span className="text-xs text-gray-400 w-8 font-mono">{value}</span>
		</div>
	);
}

function MetricCard({
	label,
	value,
	sub,
	color,
}: {
	label: string;
	value: number | string;
	sub?: string;
	color?: string;
}) {
	return (
		<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
			<p className="text-xs text-gray-500 mb-1">{label}</p>
			<p className="text-2xl font-bold" style={{ color: color ?? "#fff" }}>
				{value}
			</p>
			{sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
		</div>
	);
}

export function PersonSearchResults({ query, summary, activities }: PersonSearchResultsProps) {
	const prs = activities.filter((a) => a.type === "pr");
	const issues = activities.filter((a) => a.type === "issue");
	const commits = activities.filter((a) => a.type === "commit");
	const linearIssues = activities.filter((a) => a.type === "linear_issue");
	const metrics = computeMetrics(activities);

	return (
		<div className="space-y-6">
			{/* AI Summary */}
			<div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-6">
				<div className="flex items-center gap-2 mb-3">
					<div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
						<svg
							aria-hidden="true"
							className="w-3.5 h-3.5 text-indigo-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
							/>
						</svg>
					</div>
					<h3 className="text-sm font-semibold text-indigo-300">IA Mario</h3>
				</div>
				<p className="text-gray-200 text-sm leading-relaxed">{summary}</p>
			</div>

			{/* Analytics Grid */}
			{activities.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					{/* Completion Circle */}
					<div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 flex flex-col items-center justify-center">
						<CircularProgress percent={metrics.completionRate} />
						<p className="text-xs text-gray-500 mt-3">
							{metrics.closed} of {metrics.total} issues resolved
						</p>
					</div>

					{/* Status Breakdown */}
					<div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
						<h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
							Linear Status
						</h4>
						<div className="space-y-3">
							<StatusBar
								label="Closed"
								value={metrics.closed}
								total={metrics.total}
								color="#10b981"
							/>
							<StatusBar label="Open" value={metrics.open} total={metrics.total} color="#6366f1" />
						</div>
						{metrics.totalPrs > 0 && (
							<>
								<h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 mt-6">
									Pull Requests
								</h4>
								<div className="space-y-3">
									<StatusBar
										label="Merged"
										value={metrics.mergedPrs}
										total={metrics.totalPrs}
										color="#a855f7"
									/>
									<StatusBar
										label="Open"
										value={metrics.openPrs}
										total={metrics.totalPrs}
										color="#6366f1"
									/>
								</div>
							</>
						)}
					</div>

					{/* Quick Metrics */}
					<div className="grid grid-rows-2 gap-3">
						<MetricCard label="Total Activity" value={activities.length} sub="across all sources" />
						<MetricCard
							label="Linear Issues"
							value={metrics.total}
							sub={`${metrics.closed} closed · ${metrics.open} open`}
							color="#818cf8"
						/>
					</div>
				</div>
			)}

			{/* Linear Issues */}
			{linearIssues.length > 0 && (
				<Section title="Linear Issues" count={linearIssues.length} color="text-blue-400">
					<ActivityTable
						items={linearIssues}
						columns={["id", "title", "status", "labels", "timestamp"]}
					/>
				</Section>
			)}

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

			{activities.length === 0 && (
				<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 text-center text-gray-500">
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
