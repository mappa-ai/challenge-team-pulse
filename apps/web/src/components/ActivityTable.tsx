"use client";

import type { ActivityItem } from "@team-pulse/core";

type Column = "author" | "title" | "status" | "labels" | "timestamp" | "repo" | "id";

interface ActivityTableProps {
	items: ActivityItem[];
	columns?: Column[];
	emptyMessage?: string;
}

function relativeTime(timestamp: string): string {
	const diff = Date.now() - new Date(timestamp).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function extractRepo(url: string): string {
	const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
	return match ? match[1]! : "";
}

function StatusBadge({ status }: { status?: string }) {
	if (!status) return <span className="text-gray-600">-</span>;

	const key = status.toLowerCase();
	const styles: Record<string, string> = {
		// GitHub statuses
		merged: "bg-purple-500/15 text-purple-300 border-purple-500/20",
		closed: "bg-gray-500/15 text-gray-400 border-gray-500/20",
		open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
		// Linear statuses
		"in progress": "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
		"to do": "bg-blue-500/15 text-blue-300 border-blue-500/20",
		todo: "bg-blue-500/15 text-blue-300 border-blue-500/20",
		done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
		canceled: "bg-gray-500/15 text-gray-400 border-gray-500/20",
		cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/20",
		backlog: "bg-gray-500/15 text-gray-500 border-gray-500/20",
		triage: "bg-orange-500/15 text-orange-300 border-orange-500/20",
		"in review": "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
	};

	return (
		<span
			className={`inline-flex px-2 py-0.5 text-xs rounded-md border ${styles[key] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20"}`}
		>
			{status}
		</span>
	);
}

export function ActivityTable({
	items,
	columns = ["author", "title", "status", "timestamp"],
	emptyMessage = "No activity found",
}: ActivityTableProps) {
	if (items.length === 0) {
		return (
			<div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-8 text-center text-gray-500 text-sm">
				{emptyMessage}
			</div>
		);
	}

	const columnLabels: Record<Column, string> = {
		id: "ID",
		author: "Author",
		title: "Title",
		status: "Status",
		labels: "Labels",
		timestamp: "Updated",
		repo: "Repo",
	};

	return (
		<div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-white/[0.06]">
						{columns.map((col) => (
							<th
								key={col}
								className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								{columnLabels[col]}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{items.map((item, i) => (
						<tr
							key={`${item.url}-${i}`}
							className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
						>
							{columns.map((col) => (
								<td key={col} className="px-4 py-3">
									{col === "id" && (
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-indigo-400 hover:text-indigo-300 text-xs font-mono whitespace-nowrap"
										>
											{item.identifier ?? "-"}
										</a>
									)}
									{col === "author" && (
										<span className="text-gray-300 font-medium">{item.author}</span>
									)}
									{col === "title" && (
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-gray-200 hover:text-indigo-300 transition-colors line-clamp-1"
											title={item.title}
										>
											{item.title}
										</a>
									)}
									{col === "status" && <StatusBadge status={item.status} />}
									{col === "labels" && (
										<div className="flex gap-1 flex-wrap">
											{item.labels?.slice(0, 3).map((label) => (
												<span
													key={label}
													className="inline-flex px-1.5 py-0.5 text-[10px] rounded bg-white/[0.06] text-gray-400"
												>
													{label}
												</span>
											))}
										</div>
									)}
									{col === "timestamp" && (
										<span className="text-gray-500 text-xs whitespace-nowrap">
											{relativeTime(item.timestamp)}
										</span>
									)}
									{col === "repo" && (
										<span className="text-gray-500 text-xs font-mono">{extractRepo(item.url)}</span>
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
