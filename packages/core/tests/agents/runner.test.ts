import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { AgentConfig, ToolHandler } from "../../src/agents/types";

// Mock the Anthropic SDK before importing the runner
const mockCreate = mock(() =>
	Promise.resolve({
		content: [{ type: "text", text: '{"result": "test"}' }],
		stop_reason: "end_turn",
	}),
);

mock.module("@anthropic-ai/sdk", () => ({
	default: class MockAnthropic {
		messages = { create: mockCreate };
	},
}));

// Import after mocking
const { runAgent } = await import("../../src/agents/runner");

function makeTool(name: string, handler: (input: unknown) => Promise<unknown>): ToolHandler {
	return {
		definition: {
			name,
			description: `Test tool: ${name}`,
			input_schema: { type: "object" as const, properties: { query: { type: "string" } } },
		},
		execute: handler,
	};
}

function makeConfig(overrides?: Partial<AgentConfig>): AgentConfig {
	return {
		systemPrompt: "You are a test agent.",
		userPrompt: "Do the thing.",
		tools: [],
		...overrides,
	};
}

describe("runAgent", () => {
	beforeEach(() => {
		mockCreate.mockClear();
	});

	it("returns text when Claude responds with end_turn immediately", async () => {
		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: "Hello from Claude" }],
			stop_reason: "end_turn",
		});

		const result = await runAgent(makeConfig());

		expect(result.text).toBe("Hello from Claude");
		expect(result.iterations).toBe(1);
		expect(mockCreate).toHaveBeenCalledTimes(1);
	});

	it("executes tools when Claude requests tool_use, then returns final text", async () => {
		const toolHandler = mock(() => Promise.resolve({ data: "tool result" }));

		// First call: Claude requests a tool
		mockCreate.mockResolvedValueOnce({
			content: [{ type: "tool_use", id: "tool_1", name: "my_tool", input: { query: "test" } }],
			stop_reason: "tool_use",
		});

		// Second call: Claude returns final text
		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: '{"answer": "done"}' }],
			stop_reason: "end_turn",
		});

		const result = await runAgent(
			makeConfig({
				tools: [makeTool("my_tool", toolHandler)],
			}),
		);

		expect(result.text).toBe('{"answer": "done"}');
		expect(result.iterations).toBe(2);
		expect(toolHandler).toHaveBeenCalledTimes(1);
		expect(toolHandler).toHaveBeenCalledWith({ query: "test" });
		expect(mockCreate).toHaveBeenCalledTimes(2);
	});

	it("handles unknown tool gracefully with is_error", async () => {
		mockCreate.mockResolvedValueOnce({
			content: [{ type: "tool_use", id: "tool_1", name: "nonexistent_tool", input: {} }],
			stop_reason: "tool_use",
		});

		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: "Handled error" }],
			stop_reason: "end_turn",
		});

		const result = await runAgent(makeConfig());

		expect(result.text).toBe("Handled error");
		expect(result.iterations).toBe(2);
		// Claude was called twice: once got tool_use, once got end_turn
		expect(mockCreate).toHaveBeenCalledTimes(2);
	});

	it("handles tool execution errors gracefully", async () => {
		const failingTool = mock(() => Promise.reject(new Error("API timeout")));

		mockCreate.mockResolvedValueOnce({
			content: [{ type: "tool_use", id: "tool_1", name: "failing_tool", input: {} }],
			stop_reason: "tool_use",
		});

		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: "Recovered from error" }],
			stop_reason: "end_turn",
		});

		const result = await runAgent(
			makeConfig({
				tools: [makeTool("failing_tool", failingTool)],
			}),
		);

		expect(result.text).toBe("Recovered from error");
		expect(failingTool).toHaveBeenCalledTimes(1);
	});

	it("executes multiple parallel tool calls", async () => {
		const toolA = mock(() => Promise.resolve("result A"));
		const toolB = mock(() => Promise.resolve("result B"));

		mockCreate.mockResolvedValueOnce({
			content: [
				{ type: "tool_use", id: "t1", name: "tool_a", input: {} },
				{ type: "tool_use", id: "t2", name: "tool_b", input: {} },
			],
			stop_reason: "tool_use",
		});

		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: "Both tools done" }],
			stop_reason: "end_turn",
		});

		const result = await runAgent(
			makeConfig({
				tools: [makeTool("tool_a", toolA), makeTool("tool_b", toolB)],
			}),
		);

		expect(result.text).toBe("Both tools done");
		expect(toolA).toHaveBeenCalledTimes(1);
		expect(toolB).toHaveBeenCalledTimes(1);
	});

	it("respects max iterations and returns gracefully", async () => {
		// Always return tool_use to force max iterations
		mockCreate.mockImplementation(() =>
			Promise.resolve({
				content: [{ type: "tool_use", id: "t1", name: "loop_tool", input: {} }],
				stop_reason: "tool_use",
			}),
		);

		const loopTool = mock(() => Promise.resolve("still going"));

		const result = await runAgent(
			makeConfig({
				tools: [makeTool("loop_tool", loopTool)],
			}),
		);

		expect(result.iterations).toBe(10);
		expect(loopTool).toHaveBeenCalledTimes(10);
	});

	it("passes model and maxTokens from config", async () => {
		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: "ok" }],
			stop_reason: "end_turn",
		});

		await runAgent(
			makeConfig({
				model: "claude-opus-4-20250514",
				maxTokens: 2048,
			}),
		);

		const callArgs = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(callArgs.model).toBe("claude-opus-4-20250514");
		expect(callArgs.max_tokens).toBe(2048);
	});

	it("uses default model and maxTokens when not specified", async () => {
		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: "ok" }],
			stop_reason: "end_turn",
		});

		await runAgent(makeConfig());

		const callArgs = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(callArgs.model).toBe("claude-sonnet-4-20250514");
		expect(callArgs.max_tokens).toBe(4096);
	});

	it("stringifies non-string tool results as JSON", async () => {
		const objectTool = mock(() => Promise.resolve({ items: [1, 2, 3] }));

		mockCreate.mockResolvedValueOnce({
			content: [{ type: "tool_use", id: "t1", name: "obj_tool", input: {} }],
			stop_reason: "tool_use",
		});

		mockCreate.mockResolvedValueOnce({
			content: [{ type: "text", text: "done" }],
			stop_reason: "end_turn",
		});

		const result = await runAgent(makeConfig({ tools: [makeTool("obj_tool", objectTool)] }));

		expect(result.text).toBe("done");
		expect(objectTool).toHaveBeenCalledTimes(1);
		// The runner should have sent the tool result back to Claude (2 calls total)
		expect(mockCreate).toHaveBeenCalledTimes(2);
	});
});
