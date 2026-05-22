import { readFile, writeFile } from "node:fs/promises";

export const THRESHOLD_DAYS = 90;
export const COMPAT_DATE_REGEX = /"compatibility_date":\s*"(\d{4}-\d{2}-\d{2})"/;
const WRANGLER_PATH = "wrangler.jsonc";

export type Action =
	| { kind: "bump"; from: string; to: string; ageDays: number }
	| { kind: "no-op"; current: string; ageDays: number }
	| { kind: "error"; reason: string };

export function computeAction(
	currentDateStr: string,
	today: Date,
	threshold: number = THRESHOLD_DAYS,
): Action {
	const currentDate = new Date(currentDateStr);
	if (Number.isNaN(currentDate.getTime())) {
		return { kind: "error", reason: "invalid_date" };
	}
	const ageMs = today.getTime() - currentDate.getTime();
	const ageDays = Math.floor(ageMs / 86_400_000);
	const todayStr = today.toISOString().slice(0, 10);
	if (ageDays > threshold) {
		return { kind: "bump", from: currentDateStr, to: todayStr, ageDays };
	}
	return { kind: "no-op", current: currentDateStr, ageDays };
}

async function main(): Promise<never> {
	const src = await readFile(WRANGLER_PATH, "utf8");
	const match = src.match(COMPAT_DATE_REGEX);
	if (!match?.[1]) {
		console.error(JSON.stringify({ msg: "compatibility_date not found", path: WRANGLER_PATH }));
		process.exit(1);
	}
	const action = computeAction(match[1], new Date());
	if (action.kind === "error") {
		console.error(JSON.stringify({ msg: "invalid compatibility_date", value: match[1] }));
		process.exit(1);
	}
	console.log(JSON.stringify({ msg: "compat-date check", ...action }));
	if (action.kind === "no-op") {
		process.exit(78);
	}
	const updated = src.replace(COMPAT_DATE_REGEX, `"compatibility_date": "${action.to}"`);
	await writeFile(WRANGLER_PATH, updated);
	console.log(JSON.stringify({ msg: "bumped", ...action }));
	process.exit(0);
}

const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
	main().catch((err: unknown) => {
		console.error(
			JSON.stringify({
				msg: "bump-compat-date failed",
				error: err instanceof Error ? err.message : String(err),
			}),
		);
		process.exit(1);
	});
}
