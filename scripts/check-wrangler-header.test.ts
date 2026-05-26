import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readWranglerSource(): string {
	const path = resolve(import.meta.dirname, "..", "wrangler.jsonc");
	return readFileSync(path, "utf8");
}

function extractLeadingCommentBlock(src: string): string[] {
	const lines: string[] = [];
	for (const line of src.split("\n")) {
		const trimmed = line.trim();
		if (trimmed.startsWith("//")) {
			lines.push(trimmed);
			continue;
		}
		if (trimmed === "") continue;
		break;
	}
	return lines;
}

describe("wrangler.jsonc secrets-hygiene header", () => {
	const src = readWranglerSource();
	const header = extractLeadingCommentBlock(src);
	const headerText = header.join("\n");

	it("points future readers to `wrangler secret put` as the canonical way to set secrets", () => {
		expect(headerText).toMatch(/wrangler secret put/);
	});

	it("warns against placing secrets in `vars` (which are not encrypted)", () => {
		expect(headerText).toMatch(
			/never\s+(?:as\s+)?`?vars`?|do\s+NOT\s+put\s+secrets|not\s+in\s+`?vars`?/i,
		);
	});

	it("points to `env.staging` / `env.production` for env-specific overrides", () => {
		expect(headerText).toMatch(/env\.staging/);
		expect(headerText).toMatch(/env\.production/);
	});

	it("keeps the header at most 12 lines so it remains skimmable (AC bound from #30)", () => {
		expect(header.length).toBeGreaterThan(0);
		expect(header.length).toBeLessThanOrEqual(12);
	});
});
