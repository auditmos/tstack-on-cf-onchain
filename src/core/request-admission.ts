import { initDatabase, markDbInitSkipped } from "@/db";

const DATABASE_DEPENDENT_ROUTES: readonly string[] = ["/api/clients", "/api/health/ready"];

export type AdmissionDecision =
	| { readonly admitted: true }
	| { readonly admitted: false; readonly response: Response };

function getMissingDbEnv(env: Env): string[] {
	const missing: string[] = [];
	if (!env.DATABASE_HOST) missing.push("DATABASE_HOST");
	if (!env.DATABASE_USERNAME) missing.push("DATABASE_USERNAME");
	if (!env.DATABASE_PASSWORD) missing.push("DATABASE_PASSWORD");
	return missing;
}

function requiresDatabase(pathname: string): boolean {
	return DATABASE_DEPENDENT_ROUTES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
}

function serviceUnavailable(): Response {
	return new Response(JSON.stringify({ error: "Service unavailable" }), {
		status: 503,
		headers: { "content-type": "application/json" },
	});
}

/**
 * One decision, derived from a request and the environment: is this request
 * admitted, or should the caller short-circuit with the returned response?
 * Routes default to not needing a database — only DATABASE_DEPENDENT_ROUTES
 * are blocked when DB secrets are absent.
 */
export function admitRequest(request: Request, env: Env): AdmissionDecision {
	if (env.DATABASE_HOST && env.DATABASE_USERNAME && env.DATABASE_PASSWORD) {
		initDatabase({
			host: env.DATABASE_HOST,
			username: env.DATABASE_USERNAME,
			password: env.DATABASE_PASSWORD,
		});
		return { admitted: true };
	}

	const missing = getMissingDbEnv(env);
	markDbInitSkipped(missing);

	const pathname = new URL(request.url).pathname;
	if (!requiresDatabase(pathname)) {
		return { admitted: true };
	}

	// biome-ignore lint/suspicious/noConsole: structured log surfaces missing-secret boot failure in Workers Logs
	console.error(
		JSON.stringify({
			level: "error",
			msg: "db_env_incomplete",
			missing,
			path: pathname,
		}),
	);

	return { admitted: false, response: serviceUnavailable() };
}
