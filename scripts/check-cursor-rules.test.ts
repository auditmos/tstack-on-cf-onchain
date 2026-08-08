import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderCursorRulesMirror } from "./sync-cursor-rules";

const ROOT = resolve(import.meta.dirname, "..");

function readRepoFile(relativePath: string): string {
	return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("Cursor rules mirror (issue #53)", () => {
	it(".cursor/rules/agents-mirror.mdc is byte-for-byte in sync with AGENTS.md", () => {
		const agentsMd = readRepoFile("AGENTS.md");
		const expected = renderCursorRulesMirror(agentsMd);
		const actual = readRepoFile(".cursor/rules/agents-mirror.mdc");

		expect(actual).toBe(expected);
	});
});
