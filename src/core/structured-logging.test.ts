import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const TEMPLATE_ROOTS = [
	"src/core/functions",
	"src/core/middleware",
	"src/components/demo",
] as const;

const SOURCE_EXTS = new Set([".ts", ".tsx"]);

function walk(dir: string): string[] {
	const entries = readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walk(full));
			continue;
		}
		if (!SOURCE_EXTS.has(extname(entry.name))) continue;
		if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) continue;
		files.push(full);
	}
	return files;
}

function stripComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const CONSOLE_CALL_RE = /console\s*\.\s*(?:log|error|warn|info|debug)\s*\(\s*([\s\S]{0,40})/g;
const JSON_STRINGIFY_PREFIX = /^\s*JSON\s*\.\s*stringify\s*\(/;

describe("template logging hygiene", () => {
	for (const root of TEMPLATE_ROOTS) {
		it(`${root} only logs via JSON.stringify`, () => {
			const violations: string[] = [];
			for (const file of walk(root)) {
				const stripped = stripComments(readFileSync(file, "utf8"));
				CONSOLE_CALL_RE.lastIndex = 0;
				let match = CONSOLE_CALL_RE.exec(stripped);
				while (match !== null) {
					const firstArg = match[1] ?? "";
					if (!JSON_STRINGIFY_PREFIX.test(firstArg)) {
						violations.push(`${file}: ${match[0].replace(/\s+/g, " ").slice(0, 80)}`);
					}
					match = CONSOLE_CALL_RE.exec(stripped);
				}
			}
			expect(violations).toEqual([]);
		});
	}
});
