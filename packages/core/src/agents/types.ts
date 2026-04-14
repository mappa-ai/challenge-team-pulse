import type { MessageParam, Tool, ToolChoice } from "@anthropic-ai/sdk/resources/messages/messages";

export interface ToolHandler {
	definition: Tool;
	execute: (input: unknown) => Promise<unknown>;
}

export interface AgentConfig {
	systemPrompt: string;
	userPrompt: string;
	tools: ToolHandler[];
	model?: string;
	maxTokens?: number;
	toolChoice?: ToolChoice;
}

export interface AgentResult {
	text: string;
	messages: MessageParam[];
	iterations: number;
}
