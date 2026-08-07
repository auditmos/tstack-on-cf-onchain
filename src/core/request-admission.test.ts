import { beforeEach, vi } from "vitest";

vi.mock("@/db", () => ({
	initDatabase: vi.fn(),
	markDbInitSkipped: vi.fn(),
}));

import { initDatabase, markDbInitSkipped } from "@/db";
import { admitRequest } from "./request-admission";

function buildEnv(overrides: Partial<Env> = {}): Env {
	return {
		CLOUDFLARE_ENV: "dev",
		DATABASE_HOST: "h",
		DATABASE_USERNAME: "u",
		DATABASE_PASSWORD: "p",
		...overrides,
	} as Env;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("admitRequest — DB secrets fully present", () => {
	it("admits every route and initializes the database", () => {
		const env = buildEnv();

		const decision = admitRequest(new Request("http://test/api/clients"), env);

		expect(decision.admitted).toBe(true);
		expect(initDatabase).toHaveBeenCalledWith({ host: "h", username: "u", password: "p" });
		expect(markDbInitSkipped).not.toHaveBeenCalled();
	});
});

describe("admitRequest — DB secrets fully absent", () => {
	const env = buildEnv({ DATABASE_HOST: "", DATABASE_USERNAME: "", DATABASE_PASSWORD: "" });

	it("admits the liveness endpoint (200 path) — no database dependence declared", () => {
		const decision = admitRequest(new Request("http://test/api/health/live"), env);
		expect(decision.admitted).toBe(true);
	});

	it("blocks a database-backed endpoint with the standard 503 error shape", async () => {
		const decision = admitRequest(new Request("http://test/api/clients"), env);

		expect(decision.admitted).toBe(false);
		if (decision.admitted) throw new Error("expected admission to be denied");
		expect(decision.response.status).toBe(503);
		expect(decision.response.headers.get("content-type")).toContain("application/json");
		const body = (await decision.response.json()) as { error: string };
		expect(body.error).toMatch(/unavailable/i);
	});

	it("blocks the readiness endpoint, which is database-dependent", () => {
		const decision = admitRequest(new Request("http://test/api/health/ready"), env);
		expect(decision.admitted).toBe(false);
	});

	it("does not affect a server-rendered page request", () => {
		const decision = admitRequest(new Request("http://test/dashboard"), env);
		expect(decision.admitted).toBe(true);
	});

	it("defaults undeclared routes to fail-open — a route not in the DB registry is admitted", () => {
		const decision = admitRequest(new Request("http://test/api/some-future-chain-only-route"), env);
		expect(decision.admitted).toBe(true);
	});

	it("logs a structured boot-failure entry only when a DB-dependent route is actually blocked", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		admitRequest(new Request("http://test/api/health/live"), env);
		expect(consoleSpy).not.toHaveBeenCalled();

		admitRequest(new Request("http://test/api/clients"), env);
		expect(consoleSpy).toHaveBeenCalledTimes(1);
		const logged = JSON.parse(String(consoleSpy.mock.calls[0]?.[0])) as {
			msg: string;
			missing: string[];
		};
		expect(logged.msg).toBe("db_env_incomplete");
		expect(logged.missing).toEqual(["DATABASE_HOST", "DATABASE_USERNAME", "DATABASE_PASSWORD"]);

		consoleSpy.mockRestore();
	});
});

describe("admitRequest — DB secrets partially present", () => {
	it("missing DATABASE_USERNAME alone behaves like fully-absent and names just that var", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const env = buildEnv({ DATABASE_USERNAME: "" });

		const decision = admitRequest(new Request("http://test/api/clients"), env);

		expect(decision.admitted).toBe(false);
		const logged = JSON.parse(String(consoleSpy.mock.calls[0]?.[0])) as { missing: string[] };
		expect(logged.missing).toEqual(["DATABASE_USERNAME"]);

		consoleSpy.mockRestore();
	});

	it("missing DATABASE_PASSWORD alone behaves like fully-absent and names just that var", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const env = buildEnv({ DATABASE_PASSWORD: "" });

		const decision = admitRequest(new Request("http://test/api/clients"), env);

		expect(decision.admitted).toBe(false);
		const logged = JSON.parse(String(consoleSpy.mock.calls[0]?.[0])) as { missing: string[] };
		expect(logged.missing).toEqual(["DATABASE_PASSWORD"]);

		consoleSpy.mockRestore();
	});
});
