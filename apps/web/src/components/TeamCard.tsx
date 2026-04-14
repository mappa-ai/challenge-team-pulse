"use client";

import type { TeamSummary } from "@team-pulse/core";
import Link from "next/link";
import { FreshnessIndicator } from "./FreshnessIndicator";

interface TeamCardProps {
	slug: string;
	name: string;
	color: string;
	summary: TeamSummary | null;
}

export function TeamCard({ slug, name, color, summary }: TeamCardProps) {
	return (
		<Link href={`/team/${slug}`}>
			<div className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer">
				<div
					className="absolute top-0 left-0 w-full h-1 rounded-t-2xl opacity-60"
					style={{ backgroundColor: color }}
				/>

				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-3">
						<div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
						<h3 className="text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
							{name}
						</h3>
					</div>
					{summary && <FreshnessIndicator generatedAt={summary.generatedAt} />}
				</div>

				{summary ? (
					<div className="space-y-3">
						<p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
							{summary.workingOn}
						</p>
						{summary.blockedOrAtRisk &&
							!summary.blockedOrAtRisk.toLowerCase().includes("no block") &&
							!summary.blockedOrAtRisk.toLowerCase().includes("nothing is blocked") && (
								<div className="flex items-center gap-1.5 text-xs text-amber-400/80">
									<span>⚠️</span>
									<span className="line-clamp-1">{summary.blockedOrAtRisk}</span>
								</div>
							)}
					</div>
				) : (
					<p className="text-sm text-gray-600 italic">No summary yet — click to refresh</p>
				)}

				<div className="mt-4 flex items-center text-xs text-gray-500 group-hover:text-indigo-400 transition-colors">
					View details
					<svg
						aria-hidden="true"
						className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</Link>
	);
}
