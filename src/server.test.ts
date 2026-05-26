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
		DATABASE_HOST: "h",
		DATABASE_USERNAME: "u",
		DATABASE_PASSWORD: "p",
		...overrides,
	} as Env;
}

describe("worker entry — DB env validation", () => {
	it("returns 503 on /api/* when DATABASE_HOST is empty", async () => {
		const res = await worker.fetch(
			new Request("http://test/api/health/live"),
			buildEnv({ DATABASE_HOST: "" }),
			ctxStub,
		);
		expect(res.status).toBe(503);
	});

	it("503 response body is JSON { error }", async () => {
		const res = await worker.fetch(
			new Request("http://test/api/health/live"),
			buildEnv({ DATABASE_HOST: "" }),
			ctxStub,
		);
		expect(res.headers.get("content-type")).toContain("application/json");
		const body = (await res.json()) as { error: string };
		expect(body.error).toMatch(/unavailable/i);
	});

	it("missing DATABASE_USERNAME alone produces 503 and names just that var", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await worker.fetch(
			new Request("http://test/api/clients"),
			buildEnv({ DATABASE_USERNAME: "" }),
			ctxStub,
		);

		expect(res.status).toBe(503);
		const logged = String(consoleSpy.mock.calls[0]?.[0]);
		const parsed = JSON.parse(logged) as { missing: string[] };
		expect(parsed.missing).toEqual(["DATABASE_USERNAME"]);

		consoleSpy.mockRestore();
	});

	it("missing DATABASE_PASSWORD alone produces 503 and names just that var", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await worker.fetch(
			new Request("http://test/api/clients"),
			buildEnv({ DATABASE_PASSWORD: "" }),
			ctxStub,
		);

		expect(res.status).toBe(503);
		const logged = String(consoleSpy.mock.calls[0]?.[0]);
		const parsed = JSON.parse(logged) as { missing: string[] };
		expect(parsed.missing).toEqual(["DATABASE_PASSWORD"]);

		consoleSpy.mockRestore();
	});

	it("logs structured { msg, missing } JSON line on incomplete env", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await worker.fetch(
			new Request("http://test/api/health/live"),
			buildEnv({ DATABASE_HOST: "" }),
			ctxStub,
		);

		expect(consoleSpy).toHaveBeenCalledTimes(1);
		const logged = String(consoleSpy.mock.calls[0]?.[0]);
		const parsed = JSON.parse(logged) as { msg: string; missing: string[] };
		expect(parsed.msg).toBe("db_env_incomplete");
		expect(parsed.missing).toEqual(["DATABASE_HOST"]);

		consoleSpy.mockRestore();
	});

	it("with all DB env set, /api/health/live proceeds (200, not 503)", async () => {
		const res = await worker.fetch(new Request("http://test/api/health/live"), buildEnv(), ctxStub);
		expect(res.status).toBe(200);
	});
});
