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
			<div className="px-8 py-8">
				<h1 className="text-2xl font-bold text-white mb-2">Search</h1>
				<p className="text-gray-500">Use the search bar to look up a person&apos;s activity.</p>
			</div>
		);
	}

	return (
		<div className="px-8 py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-white mb-1">Search: &ldquo;{query}&rdquo;</h1>
				<p className="text-gray-500 text-sm">
					Searching across all teams for activity matching this person
				</p>
			</div>

			{loading && (
				<div className="space-y-4">
					<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 animate-pulse">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
							<span className="text-sm text-gray-400">
								AI agent is searching GitHub and Linear...
							</span>
						</div>
						<div className="h-3 bg-white/5 rounded w-full mb-2" />
						<div className="h-3 bg-white/5 rounded w-3/4 mb-2" />
						<div className="h-3 bg-white/5 rounded w-1/2" />
					</div>
				</div>
			)}

			{error && (
				<div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-red-300 text-sm">
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
					<div className="animate-pulse h-6 bg-white/10 rounded w-1/4" />
				</div>
			}
		>
			<SearchContent />
		</Suspense>
	);
}
