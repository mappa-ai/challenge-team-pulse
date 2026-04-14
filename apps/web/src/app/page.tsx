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

	return (
		<main className="min-h-screen">
			<div className="max-w-5xl mx-auto px-6 py-12">
				<div className="flex items-end justify-between mb-10">
					<div>
						<h1 className="text-3xl font-bold text-white tracking-tight">Team Pulse</h1>
						<p className="text-gray-500 mt-1.5 text-sm">
							Vista operativa interna — resúmenes generados por IA desde Slack y GitHub
						</p>
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
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Refresh All
							</>
						)}
					</button>
				</div>

				{loading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
						{[1, 2, 3].map((i) => (
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
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
		</main>
	);
}
