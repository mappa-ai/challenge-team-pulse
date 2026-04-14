import type { TeamSummary } from "@team-pulse/core";
import { FreshnessIndicator } from "./FreshnessIndicator";
import { SourceLink } from "./SourceLink";

interface SummaryViewProps {
	summary: TeamSummary;
}

function Section({
	icon,
	title,
	content,
	accentColor,
}: {
	icon: string;
	title: string;
	content: string;
	accentColor: string;
}) {
	return (
		<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="text-lg">{icon}</span>
				<h3 className={`text-sm font-semibold ${accentColor}`}>{title}</h3>
			</div>
			<p className="text-sm text-gray-300 leading-relaxed">{content}</p>
		</div>
	);
}

export function SummaryView({ summary }: SummaryViewProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-white">Team Snapshot</h2>
				<FreshnessIndicator generatedAt={summary.generatedAt} />
			</div>

			<div className="grid gap-4">
				<Section
					icon="🎯"
					title="Working On"
					content={summary.workingOn}
					accentColor="text-blue-400"
				/>
				<Section
					icon="🚀"
					title="Recent Changes"
					content={summary.recentChanges}
					accentColor="text-emerald-400"
				/>
				<Section
					icon="⚠️"
					title="Blocked or At Risk"
					content={summary.blockedOrAtRisk}
					accentColor="text-amber-400"
				/>
			</div>

			{summary.sources.length > 0 && (
				<div className="pt-2">
					<h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
						Sources
					</h3>
					<div className="flex flex-wrap gap-2">
						{summary.sources.map((src) => (
							<SourceLink key={src.url} source={src} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
