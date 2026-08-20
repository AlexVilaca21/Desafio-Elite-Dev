import { env } from "@/shared/config/env";
import { getToken } from "@/modules/auth/session";
import { ApiError, isAbortError } from "@/shared/api/api-error";

type RequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

type ErrorBody = {
	message?: string | string[];
	code?: string;
	statusCode?: number;
};

const RETRYABLE_STATUS = new Set([502, 503, 504]);

export const httpRetry = {
	maxAttempts: 5,
	delayMs: 2000,
};

function isSafeMethod(method: string | undefined): boolean {
	const verb = (method ?? "GET").toUpperCase();
	return verb === "GET" || verb === "HEAD";
}

function isRetryableStatus(status: number): boolean {
	return RETRYABLE_STATUS.has(status);
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function readError(text: string, status: number): ApiError {
	let message = text || `Não foi possível concluir a requisição (${status}).`;
	let code: string | undefined;

	try {
		const parsed = JSON.parse(text) as ErrorBody;
		if (typeof parsed.message === "string" && parsed.message.trim()) {
			message = parsed.message;
		}
		if (Array.isArray(parsed.message) && parsed.message.length) {
			message = parsed.message.join(" ");
		}
		code = parsed.code;
	} catch {
		// keep raw text
	}

	if (status === 401) {
		message = message || "Sessão expirada. Entre novamente.";
	}

	return new ApiError(message, status, code);
}

function networkError(): ApiError {
	return new ApiError(
		"Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
		0,
		"NETWORK_ERROR",
	);
}

async function fetchWithRetry(
	url: string,
	init: RequestInit,
): Promise<Response> {
	const attempts = isSafeMethod(init.method) ? httpRetry.maxAttempts : 1;
	let lastError: unknown;

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			const response = await fetch(url, init);

			if (
				attempt < attempts &&
				isRetryableStatus(response.status)
			) {
				await wait(httpRetry.delayMs * attempt);
				continue;
			}

			return response;
		} catch (error) {
			if (isAbortError(error)) {
				throw error;
			}

			lastError = error;

			if (attempt === attempts) {
				break;
			}

			await wait(httpRetry.delayMs * attempt);
		}
	}

	throw lastError instanceof ApiError ? lastError : networkError();
}

export async function http<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, headers, ...rest } = options;
	const token = getToken();

	const response = await fetchWithRetry(`${env.apiUrl}${path}`, {
		...rest,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers,
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		throw readError(await response.text(), response.status);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export async function httpForm<T>(
	path: string,
	formData: FormData,
	method: 'POST' | 'PATCH' = 'POST',
	signal?: AbortSignal,
): Promise<T> {
	const token = getToken();

	let response: Response;

	try {
		response = await fetch(`${env.apiUrl}${path}`, {
			method,
			signal,
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: formData,
		});
	} catch (error) {
		if (isAbortError(error)) {
			throw error;
		}

		throw networkError();
	}

	if (!response.ok) {
		throw readError(await response.text(), response.status);
	}

	return response.json() as Promise<T>;
}
