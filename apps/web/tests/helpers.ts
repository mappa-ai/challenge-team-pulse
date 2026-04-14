export function jsonRequest(url: string, body?: Record<string, unknown>): Request {
	if (body) {
		return new Request(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
	}
	return new Request(url);
}

export async function parseJson(response: Response): Promise<Record<string, unknown>> {
	return response.json() as Promise<Record<string, unknown>>;
}
