import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SECRET_KEYS = ["DATABASE_HOST", "DATABASE_USERNAME", "DATABASE_PASSWORD"] as const;

function stripJsonComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"\\])\/\/.*$/gm, "$1");
}

function readWranglerConfig(): { vars?: Record<string, unknown> } {
	const path = resolve(import.meta.dirname, "..", "wrangler.jsonc");
	const raw = readFileSync(path, "utf8");
	return JSON.parse(stripJsonComments(raw));
}

describe("wrangler.jsonc secrets hygiene", () => {
	const config = readWranglerConfig();
	const vars = config.vars ?? {};

	for (const key of SECRET_KEYS) {
		it(`does not declare ${key} as a var (must be set via 'wrangler secret put')`, () => {
			expect(vars).not.toHaveProperty(key);
		});
	}
});
