import type { SourceRef } from "@team-pulse/core";

export function SourceLink({ source }: { source: SourceRef }) {
	return (
		<a
			href={source.url}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-indigo-300 hover:bg-white/10 hover:text-indigo-200 transition-colors"
		>
			<svg
				aria-hidden="true"
				className="w-3 h-3"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
				/>
			</svg>
			{source.label}
		</a>
	);
}
