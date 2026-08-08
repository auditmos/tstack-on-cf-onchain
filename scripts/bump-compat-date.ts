import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

export const THRESHOLD_DAYS = 90;
export const COMPAT_DATE_REGEX = /"compatibility_date":\s*"(\d{4}-\d{2}-\d{2})"/;
const WRANGLER_PATH = "wrangler.jsonc";
const SCAN_EXTENSIONS = [".md", ".json", ".jsonc", ".yml", ".yaml", ".ts", ".tsx"];

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

/** Rewrites a single embedded compatibility_date occurrence to targetDate; null if absent or already current. */
export function syncOccurrence(src: string, targetDate: string): string | null {
	const match = src.match(COMPAT_DATE_REGEX);
	if (!match?.[1] || match[1] === targetDate) {
		return null;
	}
	return src.replace(COMPAT_DATE_REGEX, `"compatibility_date": "${targetDate}"`);
}

/** Every git-tracked, compat-date-scannable file other than wrangler.jsonc itself — the set of "everywhere else" the single writer must cover. */
export function listScannableRepoFiles(): string[] {
	const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
	return out
		.split("\n")
		.filter(Boolean)
		.filter((path) => path !== WRANGLER_PATH)
		.filter((path) => SCAN_EXTENSIONS.some((ext) => path.endsWith(ext)));
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

	const targetDate = action.kind === "bump" ? action.to : action.current;
	const changedFiles: string[] = [];

	if (action.kind === "bump") {
		const updated = syncOccurrence(src, targetDate);
		if (updated) {
			await writeFile(WRANGLER_PATH, updated);
			changedFiles.push(WRANGLER_PATH);
		}
	}

	for (const path of listScannableRepoFiles()) {
		const fileSrc = await readFile(path, "utf8");
		const updated = syncOccurrence(fileSrc, targetDate);
		if (updated) {
			await writeFile(path, updated);
			changedFiles.push(path);
		}
	}

	if (changedFiles.length === 0) {
		console.log(JSON.stringify({ msg: "no-op", targetDate }));
		process.exit(78);
	}
	console.log(JSON.stringify({ msg: "synced", targetDate, files: changedFiles }));
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
