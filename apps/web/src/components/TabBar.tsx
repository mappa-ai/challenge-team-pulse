"use client";

interface TabBarProps {
	tabs: string[];
	active: string;
	onChange: (tab: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
	return (
		<div className="flex gap-1 border-b border-white/[0.06]">
			{tabs.map((tab) => (
				<button
					key={tab}
					type="button"
					onClick={() => onChange(tab)}
					className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
						active === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
					}`}
				>
					{tab}
					{active === tab && (
						<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
					)}
				</button>
			))}
		</div>
	);
}
