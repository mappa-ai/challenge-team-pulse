"use client";

import { PersonSearchResults } from "$/components/PersonSearchResults";
import type { ActivityItem } from "@team-pulse/core";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function SearchContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const query = searchParams.get("q") ?? "";

	const [inputValue, setInputValue] = useState(query);
	const [loading, setLoading] = useState(false);
	const [summary, setSummary] = useState<string>("");
	const [activities, setActivities] = useState<ActivityItem[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = inputValue.trim();
		if (trimmed) {
			router.push(`/search?q=${encodeURIComponent(trimmed)}`);
		}
	}

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
		setInputValue(query);
		doSearch();
	}, [doSearch, query]);

	return (
		<div className="px-8 py-8 max-w-6xl">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-white mb-1">People Search</h1>
				<p className="text-gray-500 text-sm">
					Find a person&apos;s activity across GitHub and Linear with AI analysis
				</p>
			</div>

			{/* Search Input */}
			<form onSubmit={handleSubmit} className="mb-8">
				<div className="relative">
					<svg
						aria-hidden="true"
						className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder="Type a name and press Enter... (e.g. Daniel Moretti)"
						className="w-full pl-12 pr-4 py-4 text-base bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
					/>
				</div>
			</form>

			{/* Results */}
			{!query && !searched && (
				<div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 text-center">
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
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					</div>
					<p className="text-gray-400 mb-2">Search for a team member</p>
					<p className="text-gray-600 text-sm">
						The AI agent will search across all GitHub repos and Linear issues to find their
						activity
					</p>
				</div>
			)}

			{query && loading && (
				<div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-8">
					<div className="flex items-center gap-3 mb-5">
						<div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
						<span className="text-sm text-indigo-300 font-medium">
							AI agent is analyzing activity for &ldquo;{query}&rdquo;...
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
