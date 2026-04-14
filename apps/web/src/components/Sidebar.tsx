"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PersonSearchBar } from "./PersonSearchBar";

interface SidebarTeam {
	slug: string;
	name: string;
	color: string;
}

export function Sidebar({ teams }: { teams: SidebarTeam[] }) {
	const pathname = usePathname();

	return (
		<aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-[#0d0d14] border-r border-white/[0.06] flex flex-col z-10">
			{/* Branding */}
			<div className="px-5 py-6 border-b border-white/[0.06]">
				<Link href="/" className="flex items-center gap-2.5">
					<div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
						<svg
							aria-hidden="true"
							className="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<span className="text-lg font-semibold text-white">Team Pulse</span>
				</Link>
			</div>

			{/* Search */}
			<div className="px-4 py-4">
				<PersonSearchBar />
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-3 overflow-y-auto">
				<div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-gray-600">
					Teams
				</div>
				{teams.map((team) => {
					const isActive =
						pathname === `/team/${team.slug}` || pathname.startsWith(`/team/${team.slug}/`);
					return (
						<Link
							key={team.slug}
							href={`/team/${team.slug}`}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
								isActive
									? "bg-white/[0.08] text-white"
									: "text-gray-400 hover:text-white hover:bg-white/[0.04]"
							}`}
						>
							<div
								className="w-2.5 h-2.5 rounded-full flex-shrink-0"
								style={{ backgroundColor: team.color }}
							/>
							{team.name}
						</Link>
					);
				})}
			</nav>

			{/* Footer */}
			<div className="px-3 py-4 border-t border-white/[0.06]">
				<Link
					href="/"
					className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
						pathname === "/"
							? "bg-white/[0.08] text-white"
							: "text-gray-400 hover:text-white hover:bg-white/[0.04]"
					}`}
				>
					<svg
						aria-hidden="true"
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					Dashboard
				</Link>
			</div>
		</aside>
	);
}
