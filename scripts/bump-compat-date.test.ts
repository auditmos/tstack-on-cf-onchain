import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	COMPAT_DATE_REGEX,
	computeAction,
	listScannableRepoFiles,
	syncOccurrence,
	THRESHOLD_DAYS,
} from "./bump-compat-date";

const ROOT = resolve(import.meta.dirname, "..");

function readRepoFile(relativePath: string): string {
	return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("computeAction", () => {
	it("bumps when the current date is older than the threshold", () => {
		const action = computeAction("2026-01-01", new Date("2026-06-01"), 90);
		expect(action).toEqual({ kind: "bump", from: "2026-01-01", to: "2026-06-01", ageDays: 151 });
	});

	it("no-ops when the current date is within the threshold", () => {
		const action = computeAction("2026-05-01", new Date("2026-06-01"), 90);
		expect(action).toEqual({ kind: "no-op", current: "2026-05-01", ageDays: 31 });
	});

	it("errors on an invalid date", () => {
		const action = computeAction("not-a-date", new Date("2026-06-01"), THRESHOLD_DAYS);
		expect(action).toEqual({ kind: "error", reason: "invalid_date" });
	});
});

describe("syncOccurrence", () => {
	it("rewrites a stale occurrence to the target date", () => {
		const src = '  "compatibility_date": "2025-09-02",';
		expect(syncOccurrence(src, "2026-05-26")).toBe('  "compatibility_date": "2026-05-26",');
	});

	it("returns null when the occurrence already matches", () => {
		const src = '  "compatibility_date": "2026-05-26",';
		expect(syncOccurrence(src, "2026-05-26")).toBeNull();
	});

	it("returns null when there is no occurrence to sync", () => {
		expect(syncOccurrence("no date here", "2026-05-26")).toBeNull();
	});
});

describe("repo-wide compat-date consistency (issue #49 — single writer)", () => {
	it("has no tracked file whose compatibility_date disagrees with wrangler.jsonc", () => {
		const wranglerDate = readRepoFile("wrangler.jsonc").match(COMPAT_DATE_REGEX)?.[1];
		expect(wranglerDate).toBeDefined();

		const disagreements: Array<{ path: string; found: string }> = [];
		for (const path of listScannableRepoFiles()) {
			const match = readFileSync(resolve(ROOT, path), "utf8").match(COMPAT_DATE_REGEX);
			if (match?.[1] && match[1] !== wranglerDate) {
				disagreements.push({ path, found: match[1] });
			}
		}

		expect(disagreements).toEqual([]);
	});
});
