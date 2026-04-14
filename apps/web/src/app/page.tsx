"use client";

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
				await fetch(`/api/refresh/${team.slug}?v=2`, { method: "POST" });
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
		<div className="px-8 py-8 max-w-6xl">
			{/* Header */}
			<div className="flex items-end justify-between mb-8">
				<div>
					<h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
					<p className="text-gray-500 mt-1 text-sm">Team activity and AI-generated summaries</p>
				</div>
				<button
					type="button"
					onClick={refreshAll}
					disabled={refreshing !== null}
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
						"Refresh All"
					)}
				</button>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-3 gap-4 mb-8">
				<div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
					<p className="text-xs text-gray-500 mb-1">Teams</p>
					<p className="text-3xl font-bold text-white">{teams.length}</p>
				</div>
				<div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
					<p className="text-xs text-gray-500 mb-1">Repositories</p>
					<p className="text-3xl font-bold text-white">{totalRepos}</p>
				</div>
				<div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
					<p className="text-xs text-gray-500 mb-1">Summaries Ready</p>
					<p className="text-3xl font-bold text-white">
						{cachedCount}
						<span className="text-lg text-gray-600 font-normal">/{teams.length}</span>
					</p>
				</div>
			</div>

			{/* Team Cards */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{[1, 2].map((i) => (
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
