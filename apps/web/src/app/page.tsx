"use client";

import { StatCard } from "$/components/StatCard";
import { TeamCard } from "$/components/TeamCard";
import type { TeamSummary } from "@team-pulse/core";
import { useCallback, useEffect, useState } from "react";

interface TeamWithSummary {
	slug: string;
	name: string;
	color: string;
	slackChannels: string[];
	githubRepos: string[];
	summary: TeamSummary | null;
}

export default function Dashboard() {
	const [teams, setTeams] = useState<TeamWithSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState<string | null>(null);

	const fetchTeams = useCallback(async () => {
		const res = await fetch("/api/teams");
		const data = await res.json();
		setTeams(data.teams);
		setLoading(false);
	}, []);

	async function refreshAll() {
		setRefreshing("all");
		for (const team of teams) {
			try {
				await fetch(`/api/refresh/${team.slug}`, { method: "POST" });
			} catch (err) {
				console.error(`Error refreshing ${team.slug}:`, err);
			}
		}
		await fetchTeams();
		setRefreshing(null);
	}

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams]);

	const totalRepos = teams.reduce((sum, t) => sum + t.githubRepos.length, 0);
	const cachedCount = teams.filter((t) => t.summary !== null).length;

	return (
		<div className="px-8 py-8">
			{/* Header */}
			<div className="flex items-end justify-between mb-8">
				<div>
					<h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
					<p className="text-gray-500 mt-1 text-sm">Overview of all team activity and summaries</p>
				</div>
				<button
					type="button"
					onClick={refreshAll}
					disabled={refreshing !== null}
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
							Refreshing...
						</>
					) : (
						"Refresh All"
					)}
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<StatCard
					label="Teams"
					value={teams.length}
					icon={
						<svg
							aria-hidden="true"
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					}
				/>
				<StatCard
					label="Repositories"
					value={totalRepos}
					icon={
						<svg
							aria-hidden="true"
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
					}
				/>
				<StatCard
					label="Summaries Cached"
					value={cachedCount}
					icon={
						<svg
							aria-hidden="true"
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					}
				/>
				<StatCard
					label="Data Sources"
					value="3"
					icon={
						<svg
							aria-hidden="true"
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
							/>
						</svg>
					}
				/>
			</div>

			{/* Team Cards */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 animate-pulse"
						>
							<div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
							<div className="h-3 bg-white/5 rounded w-full mb-2" />
							<div className="h-3 bg-white/5 rounded w-2/3" />
						</div>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{teams.map((team) => (
						<TeamCard
							key={team.slug}
							slug={team.slug}
							name={team.name}
							color={team.color}
							summary={team.summary}
						/>
					))}
				</div>
			)}
		</div>
	);
}
