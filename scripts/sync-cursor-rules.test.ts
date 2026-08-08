import { renderCursorRulesMirror } from "./sync-cursor-rules";

describe("renderCursorRulesMirror", () => {
	it("wraps the AGENTS.md content in Cursor .mdc frontmatter", () => {
		const output = renderCursorRulesMirror("# Sample\n\nBody text.");

		expect(output).toMatch(/^---\n/);
		expect(output).toMatch(/\nalwaysApply: true\n/);
		expect(output).toContain("# Sample\n\nBody text.");
	});

	it("states the relationship to AGENTS.md so the mirror cannot drift silently", () => {
		const output = renderCursorRulesMirror("content");

		expect(output).toMatch(/AGENTS\.md/);
		expect(output.toLowerCase()).toMatch(/do not edit|source of truth/);
		expect(output).toMatch(/pnpm cursor-rules:sync/);
	});

	it("is deterministic for the same input", () => {
		const source = "# AGENTS\n\nSome instructions.\n";
		expect(renderCursorRulesMirror(source)).toBe(renderCursorRulesMirror(source));
	});
});
