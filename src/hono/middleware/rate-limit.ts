import { createMiddleware } from "hono/factory";

/**
 * Enforces the API_RATE_LIMITER binding (wrangler.jsonc `ratelimits`) keyed
 * on the caller's IP. Returns 429 without calling `next()` when exceeded, so
 * neither the route handler nor anything after it in the chain runs.
 */
export function rateLimiter() {
	return createMiddleware<{ Bindings: Env }>(async (c, next) => {
		const key = c.req.header("cf-connecting-ip") ?? "unknown";
		const { success } = await c.env.API_RATE_LIMITER.limit({ key });
		if (!success) {
			return c.json({ error: "Too many requests" }, 429);
		}
		await next();
	});
}
