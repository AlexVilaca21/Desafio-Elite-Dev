import { env } from "@/shared/config/env";

type RequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

export async function http<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, headers, ...rest } = options;

	const response = await fetch(`${env.apiUrl}${path}`, {
		...rest,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		const text = await response.text();
		let message = text || `HTTP ${response.status}`;

		try {
			const parsed = JSON.parse(text) as { message?: string | string[] };
			if (typeof parsed.message === "string") {
				message = parsed.message;
			}
			if (Array.isArray(parsed.message)) {
				message = parsed.message.join(", ");
			}
		} catch {
			// keep raw text
		}

		throw new Error(message);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
