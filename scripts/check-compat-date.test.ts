import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FRESHNESS_THRESHOLD_DAYS = 180;
const MS_PER_DAY = 86_400_000;
const COMPAT_DATE_REGEX = /"compatibility_date":\s*"(\d{4}-\d{2}-\d{2})"/;

function readCompatDate(): string {
	const path = resolve(import.meta.dirname, "..", "wrangler.jsonc");
	const raw = readFileSync(path, "utf8");
	const match = raw.match(COMPAT_DATE_REGEX);
	if (!match?.[1]) {
		throw new Error("compatibility_date not found in wrangler.jsonc");
	}
	return match[1];
}

describe("wrangler.jsonc compatibility_date freshness", () => {
	it(`is within ${FRESHNESS_THRESHOLD_DAYS} days of today (run \`pnpm compat-date:bump\` if stale)`, () => {
		const compatDateStr = readCompatDate();
		const compatDate = new Date(compatDateStr);
		expect(Number.isNaN(compatDate.getTime())).toBe(false);

		const ageDays = Math.floor((Date.now() - compatDate.getTime()) / MS_PER_DAY);
		expect(ageDays).toBeLessThanOrEqual(FRESHNESS_THRESHOLD_DAYS);
	});
});
