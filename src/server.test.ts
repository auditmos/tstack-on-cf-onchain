import { vi } from "vitest";

vi.mock("@tanstack/react-start/server-entry", () => ({
	default: {
		fetch: vi.fn(async () => new Response("tanstack", { status: 200 })),
	},
}));

import worker from "./server";

const ctxStub = {
	waitUntil: () => {},
	passThroughOnException: () => {},
} as unknown as ExecutionContext;

function buildEnv(overrides: Partial<Env> = {}): Env {
	return {
		CLOUDFLARE_ENV: "dev",
		ALLOWED_ORIGINS: "http://localhost:3000",
		API_RATE_LIMITER: { limit: async () => ({ success: true }) },
		DATABASE_HOST: "h",
		DATABASE_USERNAME: "u",
		DATABASE_PASSWORD: "p",
		...overrides,
	} as Env;
}

const noDbEnv = buildEnv({ DATABASE_HOST: "", DATABASE_USERNAME: "", DATABASE_PASSWORD: "" });

// Granular admission-decision behavior (which routes need a DB, missing-var
// logging, etc.) is exercised directly against src/core/request-admission.ts.
// These tests only confirm the worker entry wires that decision through.
describe("worker entry — chain-only mode (no DB secrets)", () => {
	it("serves liveness normally", async () => {
		const res = await worker.fetch(new Request("http://test/api/health/live"), noDbEnv, ctxStub);
		expect(res.status).toBe(200);
	});

	it("returns the admission module's 503 for a database-backed endpoint", async () => {
		const res = await worker.fetch(new Request("http://test/api/clients"), noDbEnv, ctxStub);
		expect(res.status).toBe(503);
		expect(res.headers.get("content-type")).toContain("application/json");
		const body = (await res.json()) as { error: string };
		expect(body.error).toMatch(/unavailable/i);
	});

	it("serves a server-rendered page normally", async () => {
		const res = await worker.fetch(new Request("http://test/dashboard"), noDbEnv, ctxStub);
		expect(res.status).toBe(200);
	});
});

describe("worker entry — DB secrets fully present", () => {
	it("routes /api/* to Hono as before", async () => {
		const res = await worker.fetch(new Request("http://test/api/health/live"), buildEnv(), ctxStub);
		expect(res.status).toBe(200);
	});

	it("routes everything else to TanStack Start as before", async () => {
		const res = await worker.fetch(new Request("http://test/dashboard"), buildEnv(), ctxStub);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("tanstack");
	});
});
