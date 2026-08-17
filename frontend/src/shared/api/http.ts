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
		const message = await response.text();
		throw new Error(message || `HTTP ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
