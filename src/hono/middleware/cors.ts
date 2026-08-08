import { cors } from "hono/cors";

function parseAllowedOrigins(raw: string | undefined): string[] {
	return (raw ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);
}

/**
 * CORS scoped to the ALLOWED_ORIGINS env var (comma-separated), read
 * per-request since Cloudflare bindings/vars aren't available at module
 * load time. Empty/unset ALLOWED_ORIGINS allows nothing.
 */
export function apiCors() {
	return cors({
		origin: (origin, c) => {
			const allowed = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);
			return allowed.includes(origin) ? origin : null;
		},
		allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	});
}
