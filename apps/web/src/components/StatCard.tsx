import type { ReactNode } from "react";

interface StatCardProps {
	label: string;
	value: string | number;
	icon?: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
	return (
		<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4">
			{icon && (
				<div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400 flex-shrink-0">
					{icon}
				</div>
			)}
			<div>
				<div className="text-2xl font-bold text-white">{value}</div>
				<div className="text-xs text-gray-500 mt-0.5">{label}</div>
			</div>
		</div>
	);
}
