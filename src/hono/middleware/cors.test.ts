import { Hono } from "hono";
import { apiCors } from "./cors";

function buildApp() {
	const app = new Hono<{ Bindings: Env }>();
	app.use("*", apiCors());
	app.get("/", (c) => c.json({ ok: true }));
	return app;
}

function envWithAllowedOrigins(allowedOrigins: string): Env {
	return {
		CLOUDFLARE_ENV: "dev",
		ALLOWED_ORIGINS: allowedOrigins as Env["ALLOWED_ORIGINS"],
		API_RATE_LIMITER: { limit: async () => ({ success: true }) },
	};
}

function preflight(origin: string) {
	return {
		method: "OPTIONS",
		headers: { Origin: origin, "Access-Control-Request-Method": "GET" },
	};
}

describe("apiCors", () => {
	it("returns Access-Control-Allow-Origin for a preflight from an allowed origin", async () => {
		const app = buildApp();
		const env = envWithAllowedOrigins("https://allowed.example.com");

		const res = await app.request("/", preflight("https://allowed.example.com"), env);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://allowed.example.com");
	});

	it("omits Access-Control-Allow-Origin for a preflight from a disallowed origin", async () => {
		const app = buildApp();
		const env = envWithAllowedOrigins("https://allowed.example.com");

		const res = await app.request("/", preflight("https://evil.example.com"), env);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});

	it("supports a comma-separated allowlist of multiple origins", async () => {
		const app = buildApp();
		const env = envWithAllowedOrigins("https://a.example.com,https://b.example.com");

		const res = await app.request("/", preflight("https://b.example.com"), env);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://b.example.com");
	});

	it("allows no origins when ALLOWED_ORIGINS is empty", async () => {
		const app = buildApp();
		const env = envWithAllowedOrigins("");

		const res = await app.request("/", preflight("https://anything.example.com"), env);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});
});
