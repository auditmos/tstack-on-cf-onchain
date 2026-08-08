import type { RequestIdVariables } from "hono/request-id";
import { requestId } from "hono/request-id";
import { AppError, isUniqueViolation } from "@/core/errors";
import clientsEndpoint from "@/hono/api/clients";
import healthEndpoint from "@/hono/api/health";
import { createHono } from "./factory";
import { apiCors } from "./middleware/cors";
import { rateLimiter } from "./middleware/rate-limit";

// Middleware chain, enforced here (not per-route) so every current and
// future endpoint inherits it and none can opt out by omission. Order:
// request-id, then error handling (app.onError below — wraps everything
// after it, using the same context requestId set on), then CORS, then
// rate limiting. There is no authentication stage; see .claude/rules/api/hono.md.
export const apiHono = createHono<RequestIdVariables>().basePath("/api");

apiHono.use("*", requestId());
apiHono.use("*", apiCors());
apiHono.use("*", rateLimiter());

apiHono.route("/health", healthEndpoint);
apiHono.route("/clients", clientsEndpoint);

apiHono.onError((err, c) => {
	if (err instanceof AppError) {
		return c.json({ error: err.message }, err.status as 400 | 401 | 404 | 409 | 500);
	}
	if (isUniqueViolation(err)) {
		return c.json({ error: "Resource already exists" }, 409);
	}
	// biome-ignore lint/suspicious/noConsole: structured error log for Cloudflare Workers observability
	console.error(
		JSON.stringify({
			level: "error",
			path: new URL(c.req.url).pathname,
			method: c.req.method,
			name: err instanceof Error ? err.name : "Unknown",
			message: err instanceof Error ? err.message : String(err),
			requestId: c.get("requestId"),
		}),
	);
	return c.json({ error: "Internal error" }, 500);
});
