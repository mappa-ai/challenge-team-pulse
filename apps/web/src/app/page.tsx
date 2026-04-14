"use client";

import type { TeamSummary } from "@team-pulse/core";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface TeamWithSummary {
	slug: string;
	name: string;
	color: string;
	slackChannels: string[];
	githubRepos: string[];
	summary: TeamSummary | null;
}

interface MemberStats {
	name: string;
	total: number;
	done: number;
	inProgress: number;
	todo: number;
	completionRate: number;
}

function MiniProgress({ percent }: { percent: number }) {
	const color =
		percent >= 70 ? "#10b981" : percent >= 40 ? "#eab308" : percent > 0 ? "#ef4444" : "#374151";
	return (
		<div className="flex items-center gap-2.5">
			<div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-700"
					style={{ width: `${percent}%`, backgroundColor: color }}
				/>
			</div>
			<span className="text-xs font-mono w-9 text-right" style={{ color }}>
				{percent}%
			</span>
		</div>
	);
}

function MemberRow({ member, rank }: { member: MemberStats; rank: number }) {
	return (
		<Link
			href={`/search?q=${encodeURIComponent(member.name)}`}
			className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-all group"
		>
			<span className="text-xs text-gray-600 w-5 text-right font-mono">{rank}</span>
			<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center text-sm font-semibold text-indigo-300 flex-shrink-0">
				{member.name
					.split(" ")
					.map((n) => n[0])
					.join("")
					.slice(0, 2)
					.toUpperCase()}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
					{member.name}
				</p>
				<div className="flex items-center gap-3 mt-0.5">
					<span className="text-[10px] text-emerald-400">{member.done} done</span>
					<span className="text-[10px] text-yellow-400">{member.inProgress} in progress</span>
					<span className="text-[10px] text-gray-500">{member.todo} to do</span>
				</div>
			</div>
			<div className="w-28">
				<MiniProgress percent={member.completionRate} />
			</div>
		</Link>
	);
}

interface Insights {
	weekSummary: string;
	velocity: string;
	topPerformers: { name: string; highlight: string }[];
	risks: string;
	recommendations: string[];
}

export default function Dashboard() {
	const [teams, setTeams] = useState<TeamWithSummary[]>([]);
	const [members, setMembers] = useState<MemberStats[]>([]);
	const [totalIssues, setTotalIssues] = useState(0);
	const [loading, setLoading] = useState(true);
	const [membersLoading, setMembersLoading] = useState(true);
	const [insights, setInsights] = useState<Insights | null>(null);
	const [insightsLoading, setInsightsLoading] = useState(false);

	const fetchTeams = useCallback(async () => {
		const res = await fetch("/api/teams");
		const data = await res.json();
		setTeams(data.teams);
		setLoading(false);
	}, []);

	const fetchMembers = useCallback(async () => {
		const res = await fetch("/api/members");
		const data = await res.json();
		setMembers(data.members);
		setTotalIssues(data.totalIssues);
		setMembersLoading(false);
	}, []);

	async function generateInsights() {
		setInsightsLoading(true);
		try {
			const res = await fetch("/api/insights", { method: "POST" });
			const data = await res.json();
			setInsights(data);
		} catch (err) {
			console.error("Insights error:", err);
		}
		setInsightsLoading(false);
	}

	useEffect(() => {
		fetchTeams();
		fetchMembers();
	}, [fetchTeams, fetchMembers]);

	const totalRepos = teams.reduce((sum, t) => sum + t.githubRepos.length, 0);
	const avgCompletion =
		members.length > 0
			? Math.round(members.reduce((sum, m) => sum + m.completionRate, 0) / members.length)
			: 0;
	const totalDone = members.reduce((sum, m) => sum + m.done, 0);
	const totalInProgress = members.reduce((sum, m) => sum + m.inProgress, 0);

	return (
		<div className="px-8 py-8 max-w-6xl">
			{/* Header */}
			<div className="flex items-end justify-between mb-8">
				<div>
					<h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
					<p className="text-gray-500 mt-1 text-sm">Team performance overview — last 2 weeks</p>
				</div>
				<button
					type="button"
					onClick={generateInsights}
					disabled={insightsLoading}
					className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
				>
					{insightsLoading ? (
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
							IA Mario analyzing...
						</>
					) : (
						<>
							<svg
								aria-hidden="true"
								className="w-4 h-4"
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
							IA Mario Analysis
						</>
					)}
				</button>
			</div>

			{/* Stats Row */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 p-5">
					<p className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold mb-1">
						Team Members
					</p>
					<p className="text-3xl font-bold text-white">{members.length}</p>
				</div>
				<div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-5">
					<p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
						Issues Done
					</p>
					<p className="text-3xl font-bold text-white">{totalDone}</p>
				</div>
				<div className="rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 p-5">
					<p className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold mb-1">
						In Progress
					</p>
					<p className="text-3xl font-bold text-white">{totalInProgress}</p>
				</div>
				<div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-5">
					<p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold mb-1">
						Avg Completion
					</p>
					<p className="text-3xl font-bold text-white">
						{avgCompletion}
						<span className="text-lg text-gray-500">%</span>
					</p>
				</div>
			</div>

			{/* IA Mario Insights */}
			{insightsLoading && (
				<div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-8">
					<div className="flex items-center gap-3">
						<div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
						<span className="text-sm text-indigo-300 font-medium">
							IA Mario is analyzing team performance...
						</span>
					</div>
					<div className="mt-4 space-y-3">
						<div className="h-3 bg-white/5 rounded w-full animate-pulse" />
						<div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
						<div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
					</div>
				</div>
			)}

			{insights && !insightsLoading && (
				<div className="mb-8 space-y-4">
					{/* Summary + Velocity */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
								<h3 className="text-sm font-semibold text-indigo-300">Weekly Summary</h3>
							</div>
							<p className="text-sm text-gray-200 leading-relaxed">{insights.weekSummary}</p>
						</div>
						<div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-6">
							<div className="flex items-center gap-2 mb-3">
								<div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
									<svg
										aria-hidden="true"
										className="w-3.5 h-3.5 text-emerald-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
										/>
									</svg>
								</div>
								<h3 className="text-sm font-semibold text-emerald-300">Velocity</h3>
							</div>
							<p className="text-sm text-gray-200 leading-relaxed">{insights.velocity}</p>
						</div>
					</div>

					{/* Top Performers + Risks */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
							<h3 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2">
								<svg
									aria-hidden="true"
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
									/>
								</svg>
								Top Performers
							</h3>
							<div className="space-y-3">
								{insights.topPerformers.map((p) => (
									<div key={p.name} className="flex items-start gap-3">
										<div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center text-[10px] font-bold text-yellow-400 flex-shrink-0 mt-0.5">
											{p.name
												.split(" ")
												.map((n) => n[0])
												.join("")
												.slice(0, 2)
												.toUpperCase()}
										</div>
										<div>
											<p className="text-sm font-medium text-gray-200">{p.name}</p>
											<p className="text-xs text-gray-500">{p.highlight}</p>
										</div>
									</div>
								))}
							</div>
						</div>
						<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
							<h3 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
								<svg
									aria-hidden="true"
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
								Risks
							</h3>
							<p className="text-sm text-gray-200 leading-relaxed">{insights.risks}</p>
						</div>
					</div>

					{/* Recommendations */}
					<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
						<h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
							<svg
								aria-hidden="true"
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
								/>
							</svg>
							Recommendations
						</h3>
						<div className="space-y-2">
							{insights.recommendations.map((rec, i) => (
								<div key={rec} className="flex items-start gap-3">
									<span className="text-xs text-purple-400 bg-purple-500/10 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-mono mt-0.5">
										{i + 1}
									</span>
									<p className="text-sm text-gray-300">{rec}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Main Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Team Members Leaderboard */}
				<div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
					<div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
						<h2 className="text-sm font-semibold text-white">Team Leaderboard</h2>
						<span className="text-[10px] text-gray-500 uppercase tracking-wider">
							Completion Rate
						</span>
					</div>
					{membersLoading ? (
						<div className="p-4 space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
									<div className="w-5 h-4 bg-white/10 rounded" />
									<div className="w-8 h-8 bg-white/10 rounded-lg" />
									<div className="flex-1">
										<div className="h-3 bg-white/10 rounded w-1/3 mb-2" />
										<div className="h-2 bg-white/5 rounded w-1/2" />
									</div>
									<div className="w-28 h-2 bg-white/5 rounded" />
								</div>
							))}
						</div>
					) : (
						<div className="p-2">
							{members.map((member, i) => (
								<MemberRow key={member.name} member={member} rank={i + 1} />
							))}
						</div>
					)}
				</div>

				{/* Right Column */}
				<div className="space-y-6">
					{/* Team Overview Donut */}
					<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
						<h2 className="text-sm font-semibold text-white mb-4">Issue Distribution</h2>
						<div className="flex justify-center mb-4">
							<DonutChart
								done={totalDone}
								inProgress={totalInProgress}
								todo={totalIssues - totalDone - totalInProgress}
							/>
						</div>
						<div className="space-y-2">
							<LegendItem color="#10b981" label="Done" value={totalDone} />
							<LegendItem color="#eab308" label="In Progress" value={totalInProgress} />
							<LegendItem
								color="#6366f1"
								label="To Do / Backlog"
								value={totalIssues - totalDone - totalInProgress}
							/>
						</div>
					</div>

					{/* Quick Links */}
					<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
						<h2 className="text-sm font-semibold text-white mb-3">Quick Access</h2>
						<div className="space-y-2">
							{teams.map((team) => (
								<Link
									key={team.slug}
									href={`/team/${team.slug}`}
									className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all group"
								>
									<div className="flex items-center gap-2.5">
										<div
											className="w-2.5 h-2.5 rounded-full"
											style={{ backgroundColor: team.color }}
										/>
										<span className="text-sm text-gray-300 group-hover:text-white transition-colors">
											{team.name}
										</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-600">
										<span>{team.githubRepos.length} repos</span>
										<svg
											aria-hidden="true"
											className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								</Link>
							))}
						</div>
					</div>

					{/* Repos */}
					<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
						<h2 className="text-sm font-semibold text-white mb-1">Repositories</h2>
						<p className="text-xs text-gray-500 mb-3">{totalRepos} active repos tracked</p>
						{!loading && teams[0] && (
							<div className="flex flex-wrap gap-1.5">
								{teams[0].githubRepos.slice(0, 8).map((repo) => (
									<span
										key={repo}
										className="text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-gray-500 font-mono"
									>
										{repo.split("/")[1]}
									</span>
								))}
								{teams[0].githubRepos.length > 8 && (
									<span className="text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-gray-500">
										+{teams[0].githubRepos.length - 8} more
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function DonutChart({
	done,
	inProgress,
	todo,
}: {
	done: number;
	inProgress: number;
	todo: number;
}) {
	const total = done + inProgress + todo;
	if (total === 0) {
		return (
			<div className="w-32 h-32 rounded-full border-8 border-white/[0.06] flex items-center justify-center">
				<span className="text-gray-600 text-xs">No data</span>
			</div>
		);
	}

	const size = 128;
	const strokeWidth = 12;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const doneLen = (done / total) * circumference;
	const inProgressLen = (inProgress / total) * circumference;
	const todoLen = (todo / total) * circumference;

	const doneOffset = 0;
	const inProgressOffset = -doneLen;
	const todoOffset = -(doneLen + inProgressLen);

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg aria-hidden="true" width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke="rgba(255,255,255,0.04)"
					fill="none"
				/>
				{/* Done */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke="#10b981"
					fill="none"
					strokeLinecap="round"
					strokeDasharray={`${doneLen} ${circumference - doneLen}`}
					strokeDashoffset={doneOffset}
				/>
				{/* In Progress */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke="#eab308"
					fill="none"
					strokeLinecap="round"
					strokeDasharray={`${inProgressLen} ${circumference - inProgressLen}`}
					strokeDashoffset={inProgressOffset}
				/>
				{/* Todo */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke="#6366f1"
					fill="none"
					strokeLinecap="round"
					strokeDasharray={`${todoLen} ${circumference - todoLen}`}
					strokeDashoffset={todoOffset}
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-2xl font-bold text-white">{total}</span>
				<span className="text-[10px] text-gray-500">issues</span>
			</div>
		</div>
	);
}

function LegendItem({
	color,
	label,
	value,
}: {
	color: string;
	label: string;
	value: number;
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
				<span className="text-xs text-gray-400">{label}</span>
			</div>
			<span className="text-xs font-mono text-gray-300">{value}</span>
		</div>
	);
}
