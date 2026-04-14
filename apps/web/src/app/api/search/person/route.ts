import { searchPerson } from "@team-pulse/core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { query?: string; teamSlug?: string };

		if (!body.query || typeof body.query !== "string") {
			return NextResponse.json({ error: "query is required" }, { status: 400 });
		}

		const result = await searchPerson(body.query.trim(), body.teamSlug);
		return NextResponse.json(result);
	} catch (err) {
		console.error("Person search error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Search failed" },
			{ status: 500 },
		);
	}
}
