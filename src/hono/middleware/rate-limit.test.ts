import { Hono } from "hono";
import { rateLimiter } from "./rate-limit";

function buildApp(handler: (c: import("hono").Context) => Response | Promise<Response>) {
	const app = new Hono<{ Bindings: Env }>();
	app.use("*", rateLimiter());
	app.get("/", handler);
	return app;
}

function envWithLimiter(limit: RateLimit["limit"]): Env {
	return {
		CLOUDFLARE_ENV: "dev",
		ALLOWED_ORIGINS: "http://localhost:3000",
		API_RATE_LIMITER: { limit },
	};
}

describe("rateLimiter", () => {
	it("lets the request reach the handler when the binding reports success", async () => {
		const handler = vi.fn((c) => c.json({ ok: true }));
		const app = buildApp(handler);
		const limit = vi.fn().mockResolvedValue({ success: true });

		const res = await app.request("/", {}, envWithLimiter(limit));

		expect(res.status).toBe(200);
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it("returns 429 without reaching the handler when the binding reports failure", async () => {
		const handler = vi.fn((c) => c.json({ ok: true }));
		const app = buildApp(handler);
		const limit = vi.fn().mockResolvedValue({ success: false });

		const res = await app.request("/", {}, envWithLimiter(limit));

		expect(res.status).toBe(429);
		expect(handler).not.toHaveBeenCalled();
	});

	it("keys the rate limit on the caller's IP", async () => {
		const handler = vi.fn((c) => c.json({ ok: true }));
		const app = buildApp(handler);
		const limit = vi.fn().mockResolvedValue({ success: true });

		await app.request(
			"/",
			{ headers: { "cf-connecting-ip": "203.0.113.5" } },
			envWithLimiter(limit),
		);

		expect(limit).toHaveBeenCalledWith({ key: "203.0.113.5" });
	});
});
