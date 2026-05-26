import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let db: ReturnType<typeof drizzle>;
let lastMissingEnv: string[] = [];

interface DbConfig {
	host: string;
	username: string;
	password: string;
}

export function initDatabase(config: DbConfig) {
	if (db) return db;
	if (!config.host || !config.username || !config.password) {
		throw new Error(
			"Database init requires non-empty host, username, and password — check that all three secrets are set.",
		);
	}
	const connectionString = `postgres://${config.username}:${config.password}@${config.host}`;
	db = drizzle(neon(connectionString));
	lastMissingEnv = [];
	return db;
}

export function markDbInitSkipped(missing: string[]) {
	lastMissingEnv = [...missing];
}

export function getDb() {
	if (!db) {
		const ctx = lastMissingEnv.length > 0 ? ` Missing env: ${lastMissingEnv.join(", ")}.` : "";
		throw new Error(
			`Database not initialized.${ctx} Set DATABASE_HOST/DATABASE_USERNAME/DATABASE_PASSWORD in .dev.vars (or via Cloudflare secrets in deployed envs).`,
		);
	}
	return db;
}
