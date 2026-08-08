import { beforeEach, vi } from "vitest";

vi.mock("@/db/client", async () => {
	const actual = await vi.importActual<typeof import("@/db/client")>("@/db/client");
	return { ...actual, getClients: vi.fn() };
});

import { getClients } from "@/db/client";
import { apiHono } from "@/hono/api";
import { PERMISSIVE_TEST_ENV } from "@/hono/test-env";

function envWithLimit(success: boolean): Env {
	return { ...PERMISSIVE_TEST_ENV, API_RATE_LIMITER: { limit: async () => ({ success }) } };
}

function envWithAllowedOrigins(allowedOrigins: string): Env {
	return { ...PERMISSIVE_TEST_ENV, ALLOWED_ORIGINS: allowedOrigins as Env["ALLOWED_ORIGINS"] };
}

beforeEach(() => {
	vi.clearAllMocks();
});

// All requests below hit /api/health/live — a route with zero middleware
// wiring of its own — to prove the factory (src/hono/api.ts), not the
// endpoint, is what enforces these behaviors.
describe("apiHono middleware chain — request id", () => {
	it("carries a request id header on a successful response", async () => {
		const res = await apiHono.request("/api/health/live", {}, PERMISSIVE_TEST_ENV);

		expect(res.status).toBe(200);
		expect(res.headers.get("X-Request-Id")).toBeTruthy();
	});

	it("propagates a caller-supplied request id rather than replacing it", async () => {
		const res = await apiHono.request(
			"/api/health/live",
			{ headers: { "X-Request-Id": "caller-supplied-id" } },
			PERMISSIVE_TEST_ENV,
		);

		expect(res.headers.get("X-Request-Id")).toBe("caller-supplied-id");
	});

	it("generates a request id when the caller supplies none", async () => {
		const res = await apiHono.request("/api/health/live", {}, PERMISSIVE_TEST_ENV);

		const id = res.headers.get("X-Request-Id");
		expect(id).toBeTruthy();
		expect(id).not.toBe("");
	});

	it("carries a request id header on an error response too", async () => {
		vi.mocked(getClients).mockRejectedValueOnce(new Error("boom"));

		const res = await apiHono.request("/api/clients", {}, PERMISSIVE_TEST_ENV);

		expect(res.status).toBe(500);
		expect(res.headers.get("X-Request-Id")).toBeTruthy();
	});

	it("logs the request id alongside a failing request, correlating response to log line", async () => {
		vi.mocked(getClients).mockRejectedValueOnce(new Error("boom"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await apiHono.request(
			"/api/clients",
			{ headers: { "X-Request-Id": "trace-me-123" } },
			PERMISSIVE_TEST_ENV,
		);

		expect(res.status).toBe(500);
		expect(res.headers.get("X-Request-Id")).toBe("trace-me-123");
		const logged = JSON.parse(String(consoleSpy.mock.calls[0]?.[0])) as { requestId?: string };
		expect(logged.requestId).toBe("trace-me-123");

		consoleSpy.mockRestore();
	});
});

describe("apiHono middleware chain — CORS", () => {
	it("returns Access-Control-Allow-Origin for a preflight from an allowed origin", async () => {
		const res = await apiHono.request(
			"/api/health/live",
			{
				method: "OPTIONS",
				headers: { Origin: "https://allowed.example.com", "Access-Control-Request-Method": "GET" },
			},
			envWithAllowedOrigins("https://allowed.example.com"),
		);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://allowed.example.com");
	});

	it("omits Access-Control-Allow-Origin for a preflight from a disallowed origin", async () => {
		const res = await apiHono.request(
			"/api/health/live",
			{
				method: "OPTIONS",
				headers: { Origin: "https://evil.example.com", "Access-Control-Request-Method": "GET" },
			},
			envWithAllowedOrigins("https://allowed.example.com"),
		);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});
});

describe("apiHono middleware chain — rate limiting", () => {
	it("returns 429 without reaching the handler when the caller exceeds the configured rate", async () => {
		const res = await apiHono.request("/api/health/live", {}, envWithLimit(false));

		expect(res.status).toBe(429);
	});

	it("lets the request through when under the configured rate", async () => {
		const res = await apiHono.request("/api/health/live", {}, envWithLimit(true));

		expect(res.status).toBe(200);
	});
});
