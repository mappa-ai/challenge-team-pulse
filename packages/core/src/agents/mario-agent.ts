import { fetchGitHubActivity } from "../github";
import { fetchLinearIssues } from "../linear";
import { runAgent } from "./runner";
import type { AgentResult, ToolHandler } from "./types";

const SYSTEM_PROMPT = `Eres IA Mario, un analista de rendimiento de equipos de ingeniería en una startup de tecnología. Analizas datos de sprint y brindas insights accionables en español.

Tu tono es directo, de apoyo y basado en datos — como un gran engineering manager dando un retro semanal.

Tienes herramientas para obtener datos reales de Linear y GitHub. Úsalas para recopilar información actualizada antes de dar tu análisis.

Devuelve tu análisis como JSON con estas claves exactas:
- "weekSummary": 2-3 oraciones sobre cómo se desempeñó el equipo en este período
- "velocity": 1-2 oraciones evaluando la velocidad y throughput del equipo
- "topPerformers": Array de { "name": string, "highlight": string } para los 2-3 mejores contribuidores
- "risks": 1-2 oraciones sobre bloqueos, trabajo estancado, o personas que podrían necesitar ayuda
- "recommendations": Array de 3 sugerencias accionables para mejorar el próximo sprint

Siempre devuelve JSON válido — sin markdown, sin code fences, sin texto extra.`;

export function makeMarioTools(linearTeamIds: string[], repos: string[]): ToolHandler[] {
	const tools: ToolHandler[] = [];

	if (linearTeamIds.length > 0) {
		tools.push({
			definition: {
				name: "fetch_linear_member_stats",
				description: `Obtiene issues de Linear de las últimas semanas y las agrupa por miembro del equipo. IDs disponibles: ${linearTeamIds.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						team_id: { type: "string", description: "ID del equipo en Linear" },
						hours_back: {
							type: "number",
							description: "Cuántas horas hacia atrás buscar (default: 336 = 2 semanas)",
						},
					},
					required: ["team_id"],
				},
			},
			execute: async (input: unknown) => {
				const { team_id, hours_back } = input as { team_id: string; hours_back?: number };
				const issues = await fetchLinearIssues(team_id, hours_back ?? 336);

				// Agrupa por autor y calcula métricas
				const byAuthor = new Map<
					string,
					{ total: number; done: number; inProgress: number; todo: number; issues: string[] }
				>();

				for (const issue of issues) {
					if (issue.author === "unassigned") continue;
					const current = byAuthor.get(issue.author) ?? {
						total: 0,
						done: 0,
						inProgress: 0,
						todo: 0,
						issues: [],
					};
					current.total++;
					const status = (issue.status ?? "").toLowerCase();
					if (["done", "closed", "canceled", "cancelled"].includes(status)) current.done++;
					else if (["in progress", "in review"].includes(status)) current.inProgress++;
					else current.todo++;
					current.issues.push(`${issue.identifier ?? ""}: ${issue.title} (${issue.status})`);
					byAuthor.set(issue.author, current);
				}

				return Array.from(byAuthor.entries()).map(([name, stats]) => ({
					name,
					total: stats.total,
					done: stats.done,
					inProgress: stats.inProgress,
					todo: stats.todo,
					completionRate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
					recentIssues: stats.issues.slice(0, 5),
				}));
			},
		});
	}

	if (repos.length > 0) {
		tools.push({
			definition: {
				name: "fetch_github_member_stats",
				description: `Obtiene actividad de GitHub (PRs y commits) de las últimas semanas y la agrupa por miembro. Repos disponibles: ${repos.join(", ")}`,
				input_schema: {
					type: "object" as const,
					properties: {
						hours_back: {
							type: "number",
							description: "Cuántas horas hacia atrás buscar (default: 336 = 2 semanas)",
						},
					},
					required: [],
				},
			},
			execute: async (input: unknown) => {
				const { hours_back } = (input ?? {}) as { hours_back?: number };
				const items = await fetchGitHubActivity(repos, hours_back ?? 336);

				const byAuthor = new Map<string, { prs: number; prsMerged: number; commits: number }>();

				for (const item of items) {
					if (item.author === "github-actions[bot]") continue;
					const current = byAuthor.get(item.author) ?? { prs: 0, prsMerged: 0, commits: 0 };
					if (item.type === "pr") {
						current.prs++;
						if (item.status === "merged") current.prsMerged++;
					} else if (item.type === "commit") {
						current.commits++;
					}
					byAuthor.set(item.author, current);
				}

				return Array.from(byAuthor.entries()).map(([name, stats]) => ({
					name,
					prs: stats.prs,
					prsMerged: stats.prsMerged,
					commits: stats.commits,
				}));
			},
		});
	}

	return tools;
}

export async function runMarioAgent(
	linearTeamIds: string[],
	repos: string[],
): Promise<AgentResult> {
	const tools = makeMarioTools(linearTeamIds, repos);
	return runAgent({
		systemPrompt: SYSTEM_PROMPT,
		userPrompt:
			"Analiza el rendimiento del equipo en las últimas 2 semanas. Usa tus herramientas para recopilar datos de Linear y GitHub, luego proporciona tu análisis como JSON.",
		tools,
		maxTokens: 2048,
	});
}
