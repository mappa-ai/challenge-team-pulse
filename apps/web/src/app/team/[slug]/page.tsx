"use client";

import { SummaryView } from "$/components/SummaryView";
import type { TeamConfig, TeamSummary } from "@team-pulse/core";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function TeamPage() {
	const params = useParams();
	const slug = params.slug as string;

	const [team, setTeam] = useState<TeamConfig | null>(null);
	const [summary, setSummary] = useState<TeamSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
			const res = await fetch(`/api/refresh/${slug}`, { method: "POST" });
			const data = await res.json();
			setSummary(data.summary);
		} catch (err) {
			console.error("Refresh error:", err);
		}
		setRefreshing(false);
	}

	useEffect(() => {
		fetchTeam();
	}, [fetchTeam]);

	if (loading) {
		return (
			<main className="min-h-screen">
				<div className="max-w-3xl mx-auto px-6 py-12">
					<div className="animate-pulse space-y-6">
						<div className="h-6 bg-white/10 rounded w-1/4" />
						<div className="h-40 bg-white/[0.03] rounded-xl" />
						<div className="h-40 bg-white/[0.03] rounded-xl" />
					</div>
				</div>
			</main>
		);
	}

	if (error || !team) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Team not found</h1>
					<Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
						Back to dashboard
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen">
			<div className="max-w-3xl mx-auto px-6 py-12">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
				>
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
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to dashboard
				</Link>

				<div className="flex items-center justify-between mb-8">
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
								Refresh
							</>
						)}
					</button>
				</div>

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

				{summary ? (
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
				)}
			</div>
		</main>
	);
}
