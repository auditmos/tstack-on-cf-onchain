import { AppError, isUniqueViolation } from "@/core/errors";
import clientsEndpoint from "@/hono/api/clients";
import healthEndpoint from "@/hono/api/health";
import { createHono } from "./factory";

export const apiHono = createHono().basePath("/api");

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
		}),
	);
	return c.json({ error: "Internal error" }, 500);
});
