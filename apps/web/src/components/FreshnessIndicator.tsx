"use client";

export function FreshnessIndicator({ generatedAt }: { generatedAt: string }) {
	const diff = Date.now() - new Date(generatedAt).getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(minutes / 60);

	let label: string;
	let color: string;

	if (minutes < 1) {
		label = "Just now";
		color = "text-emerald-400";
	} else if (minutes < 60) {
		label = `${minutes}m ago`;
		color = minutes < 15 ? "text-emerald-400" : "text-yellow-400";
	} else if (hours < 24) {
		label = `${hours}h ago`;
		color = "text-orange-400";
	} else {
		label = `${Math.floor(hours / 24)}d ago`;
		color = "text-red-400";
	}

	return (
		<span className={`text-xs font-medium ${color} flex items-center gap-1.5`}>
			<span className="relative flex h-2 w-2">
				<span
					className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color.replace("text-", "bg-")}`}
				/>
				<span
					className={`relative inline-flex rounded-full h-2 w-2 ${color.replace("text-", "bg-")}`}
				/>
			</span>
			Updated {label}
		</span>
	);
}
