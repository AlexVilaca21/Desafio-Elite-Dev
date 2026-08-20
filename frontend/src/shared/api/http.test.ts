import { afterEach, describe, expect, it, vi } from "vitest";
import { http, httpRetry } from "./http";

vi.mock("@/modules/auth/session", () => ({
	getToken: vi.fn(),
}));

import { getToken } from "@/modules/auth/session";

describe("http", () => {
	const originalRetry = { ...httpRetry };

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.mocked(getToken).mockReset();
		httpRetry.maxAttempts = originalRetry.maxAttempts;
		httpRetry.delayMs = originalRetry.delayMs;
	});

	it("sends JSON with the bearer token", async () => {
		vi.mocked(getToken).mockReturnValue("token-abc");
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ id: "1" }),
		});
		vi.stubGlobal("fetch", fetchMock);

		await expect(http("/tickets/me")).resolves.toEqual({ id: "1" });
		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:3000/api/tickets/me",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer token-abc",
				}),
			}),
		);
	});

	it("throws the API message in Portuguese", async () => {
		vi.mocked(getToken).mockReturnValue(null);
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				text: async () =>
					JSON.stringify({ message: "Este ingresso já foi cancelado" }),
			}),
		);

		await expect(http("/tickets/x/cancel", { method: "POST" })).rejects.toThrow(
			"Este ingresso já foi cancelado",
		);
	});

	it("maps a network failure", async () => {
		httpRetry.maxAttempts = 1;
		vi.mocked(getToken).mockReturnValue(null);
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
		);

		await expect(http("/events")).rejects.toMatchObject({
			code: "NETWORK_ERROR",
			status: 0,
		});
	});

	it("retries GET after a network drop", async () => {
		httpRetry.maxAttempts = 3;
		httpRetry.delayMs = 0;
		vi.mocked(getToken).mockReturnValue(null);
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new TypeError("Failed to fetch"))
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ events: [] }),
			});
		vi.stubGlobal("fetch", fetchMock);

		await expect(http("/events")).resolves.toEqual({ events: [] });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("retries GET after a gateway timeout", async () => {
		httpRetry.maxAttempts = 3;
		httpRetry.delayMs = 0;
		vi.mocked(getToken).mockReturnValue(null);
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 502,
				text: async () => "Bad Gateway",
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ events: [{ id: "1" }] }),
			});
		vi.stubGlobal("fetch", fetchMock);

		await expect(http("/events")).resolves.toEqual({ events: [{ id: "1" }] });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("does not retry POST", async () => {
		httpRetry.maxAttempts = 3;
		httpRetry.delayMs = 0;
		vi.mocked(getToken).mockReturnValue(null);
		const fetchMock = vi
			.fn()
			.mockRejectedValue(new TypeError("Failed to fetch"));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			http("/reservations", { method: "POST", body: {} }),
		).rejects.toMatchObject({
			code: "NETWORK_ERROR",
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
