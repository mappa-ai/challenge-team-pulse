import { Sidebar } from "$/components/Sidebar";
import { teams } from "@team-pulse/core";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Team Pulse",
	description: "Vista operativa interna que explica en lenguaje natural qué hace cada equipo",
};

const sidebarTeams = teams.map((t) => ({ slug: t.slug, name: t.name, color: t.color }));

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<div className="flex min-h-screen">
					<Sidebar teams={sidebarTeams} />
					<main className="flex-1 ml-[var(--sidebar-width)]">{children}</main>
				</div>
			</body>
		</html>
	);
}
