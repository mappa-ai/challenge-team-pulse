"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PersonSearchBar() {
	const [query, setQuery] = useState("");
	const router = useRouter();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = query.trim();
		if (trimmed) {
			router.push(`/search?q=${encodeURIComponent(trimmed)}`);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="relative">
			<svg
				aria-hidden="true"
				className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
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
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Search person..."
				className="w-full pl-10 pr-3 py-2 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-colors"
			/>
		</form>
	);
}
