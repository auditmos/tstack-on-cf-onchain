import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let db: ReturnType<typeof drizzle>;

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
	return db;
}

export function getDb() {
	if (!db) {
		throw new Error(
			"Database not initialized — set DATABASE_HOST in .dev.vars (or via Cloudflare secrets in deployed envs).",
		);
	}
	return db;
}
