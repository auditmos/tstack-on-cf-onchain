/**
 * A fully-valid, permissive Env for tests that exercise Hono routes but
 * aren't specifically testing the middleware chain itself (CORS/rate-limit
 * binding are required Bindings once wired at the api factory — see
 * src/hono/api.ts — so every apiHono.request() call needs one).
 */
export const PERMISSIVE_TEST_ENV: Env = {
	CLOUDFLARE_ENV: "dev",
	ALLOWED_ORIGINS: "http://localhost:3000",
	API_RATE_LIMITER: { limit: async () => ({ success: true }) },
};
