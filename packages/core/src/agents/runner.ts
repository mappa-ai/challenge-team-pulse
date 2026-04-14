import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import type { AgentConfig, AgentResult, ToolHandler } from "./types";

const MAX_ITERATIONS = 10;

export async function runAgent(config: AgentConfig): Promise<AgentResult> {
	const anthropic = new Anthropic();
	const messages: MessageParam[] = [{ role: "user", content: config.userPrompt }];

	const toolHandlers = new Map<string, ToolHandler>(
		config.tools.map((t) => [t.definition.name, t]),
	);

	let iterations = 0;

	while (iterations < MAX_ITERATIONS) {
		iterations++;

		const response = await anthropic.messages.create({
			model: config.model ?? "claude-sonnet-4-20250514",
			max_tokens: config.maxTokens ?? 4096,
			system: config.systemPrompt,
			messages,
			tools: config.tools.map((t) => t.definition),
		});

		messages.push({ role: "assistant", content: response.content });

		if (response.stop_reason === "end_turn") {
			const textBlocks = response.content.filter((b) => b.type === "text");
			const finalText = textBlocks.map((b) => ("text" in b ? b.text : "")).join("\n");
			return { text: finalText, messages, iterations };
		}

		if (response.stop_reason === "tool_use") {
			const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

			const toolResults = await Promise.all(
				toolUseBlocks.map(async (block) => {
					if (block.type !== "tool_use") {
						return {
							type: "tool_result" as const,
							tool_use_id: "",
							content: "Invalid block",
							is_error: true,
						};
					}

					const handler = toolHandlers.get(block.name);
					if (!handler) {
						return {
							type: "tool_result" as const,
							tool_use_id: block.id,
							content: `Unknown tool: ${block.name}`,
							is_error: true,
						};
					}

					try {
						const result = await handler.execute(block.input);
						return {
							type: "tool_result" as const,
							tool_use_id: block.id,
							content: typeof result === "string" ? result : JSON.stringify(result),
						};
					} catch (err) {
						return {
							type: "tool_result" as const,
							tool_use_id: block.id,
							content: `Tool error: ${err instanceof Error ? err.message : String(err)}`,
							is_error: true,
						};
					}
				}),
			);

			messages.push({ role: "user", content: toolResults });
		}
	}

	const lastAssistant = messages.filter((m) => m.role === "assistant").pop();
	const fallbackText = lastAssistant
		? JSON.stringify(lastAssistant.content)
		: "Agent exceeded maximum iterations";
	return { text: fallbackText, messages, iterations: MAX_ITERATIONS };
}
