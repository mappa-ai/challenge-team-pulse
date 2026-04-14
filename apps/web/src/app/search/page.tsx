"use client";

import { PersonSearchResults } from "$/components/PersonSearchResults";
import type { ActivityItem } from "@team-pulse/core";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function SearchContent() {
	const searchParams = useSearchParams();
	const query = searchParams.get("q") ?? "";

	const [loading, setLoading] = useState(false);
	const [summary, setSummary] = useState<string>("");
	const [activities, setActivities] = useState<ActivityItem[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);

	const doSearch = useCallback(async () => {
		if (!query) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/search/person", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query }),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error ?? "Search failed");
			}
			const data = await res.json();
			setSummary(data.summary ?? "");
			setActivities(data.activities ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Search failed");
		}
		setLoading(false);
		setSearched(true);
	}, [query]);

	useEffect(() => {
		doSearch();
	}, [doSearch]);

	if (!query) {
		return (
			<div className="px-8 py-8 max-w-6xl">
				<h1 className="text-2xl font-bold text-white mb-2">People Search</h1>
				<p className="text-gray-500 text-sm">
					Use the search bar to look up a person&apos;s activity across GitHub and Linear.
				</p>
			</div>
		);
	}

	return (
		<div className="px-8 py-8 max-w-6xl">
			<div className="mb-6">
				<div className="flex items-center gap-3 mb-1">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
						{query[0]?.toUpperCase()}
					</div>
					<div>
						<h1 className="text-2xl font-bold text-white">{query}</h1>
						<p className="text-sm text-gray-500">Activity across all teams</p>
					</div>
				</div>
			</div>

			{loading && (
				<div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-8">
					<div className="flex items-center gap-3 mb-5">
						<div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
						<span className="text-sm text-indigo-300 font-medium">
							AI agent is analyzing activity...
						</span>
					</div>
					<div className="space-y-3">
						<div className="h-3 bg-white/5 rounded w-full animate-pulse" />
						<div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
						<div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
					</div>
				</div>
			)}

			{error && (
				<div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-red-300 text-sm">
					{error}
				</div>
			)}

			{!loading && searched && !error && (
				<PersonSearchResults query={query} summary={summary} activities={activities} />
			)}
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense
			fallback={
				<div className="px-8 py-8">
					<div className="animate-pulse h-8 bg-white/10 rounded w-1/4" />
				</div>
			}
		>
			<SearchContent />
		</Suspense>
	);
}
