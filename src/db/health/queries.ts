import { sql } from "drizzle-orm";
import { getDb } from "@/db/setup";
import type { DatabaseStatus } from "./schema";

export async function checkDatabase(): Promise<DatabaseStatus> {
	try {
		const db = getDb();
		await db.execute(sql`SELECT 1`);
		return "connected";
	} catch (err) {
		// biome-ignore lint/suspicious/noConsole: structured JSON log surfaces DB failure reason in Workers Logs (issue #23)
		console.error(
			JSON.stringify({
				msg: "health.checkDatabase failed",
				error: err instanceof Error ? err.message : String(err),
			}),
		);
		return "disconnected";
	}
}
