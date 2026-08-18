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

export async function http<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, headers, ...rest } = options;
	const token = getToken();

	let response: Response;

	try {
		response = await fetch(`${env.apiUrl}${path}`, {
			...rest,
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...headers,
			},
			body: body !== undefined ? JSON.stringify(body) : undefined,
		});
	} catch (error) {
		if (isAbortError(error)) {
			throw error;
		}

		throw new ApiError(
			"Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
			0,
			"NETWORK_ERROR",
		);
	}

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

		throw new ApiError(
			"Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
			0,
			"NETWORK_ERROR",
		);
	}

	if (!response.ok) {
		throw readError(await response.text(), response.status);
	}

	return response.json() as Promise<T>;
}
