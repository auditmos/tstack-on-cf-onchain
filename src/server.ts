// DO NOT DELETE THIS FILE!!!
// Custom CF Workers entry: routes /api/* to Hono, rest to TanStack Start
import handler from "@tanstack/react-start/server-entry";
import { initDatabase, markDbInitSkipped } from "@/db";
import { apiHono } from "@/hono/api";

function getMissingDbEnv(env: Env): string[] {
	const missing: string[] = [];
	if (!env.DATABASE_HOST) missing.push("DATABASE_HOST");
	if (!env.DATABASE_USERNAME) missing.push("DATABASE_USERNAME");
	if (!env.DATABASE_PASSWORD) missing.push("DATABASE_PASSWORD");
	return missing;
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const missing = getMissingDbEnv(env);

		if (missing.length === 0) {
			initDatabase({
				host: env.DATABASE_HOST,
				username: env.DATABASE_USERNAME,
				password: env.DATABASE_PASSWORD,
			});
		} else {
			markDbInitSkipped(missing);
			if (url.pathname.startsWith("/api/")) {
				// biome-ignore lint/suspicious/noConsole: structured log surfaces missing-secret boot failure in Workers Logs
				console.error(
					JSON.stringify({
						level: "error",
						msg: "db_env_incomplete",
						missing,
						path: url.pathname,
					}),
				);
				return new Response(JSON.stringify({ error: "Service unavailable" }), {
					status: 503,
					headers: { "content-type": "application/json" },
				});
			}
		}

		if (url.pathname.startsWith("/api/")) {
			return apiHono.fetch(request, env, ctx);
		}

		return handler.fetch(request, {
			context: { fromFetch: true },
		});
	},
};
