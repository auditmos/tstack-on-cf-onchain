import { existsSync, lstatSync, readFileSync, readlinkSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function readRepoFile(relativePath: string): string {
	return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("agent-doc integrity (issue #49)", () => {
	describe("rule-file pointers", () => {
		const agentsMd = readRepoFile("AGENTS.md");
		const pointerRegex = /@(\.claude\/rules\/[a-zA-Z0-9/_.-]+\.md)/g;
		const pointers = [...agentsMd.matchAll(pointerRegex)].map((m) => m[1]);

		it("finds at least one rule-file pointer to check", () => {
			expect(pointers.length).toBeGreaterThan(0);
		});

		it.each(pointers)("pointer %s resolves to an existing file", (pointer) => {
			expect(pointer).toBeDefined();
			expect(existsSync(resolve(ROOT, pointer as string))).toBe(true);
		});
	});

	describe("documentation directory pointer", () => {
		it("AGENTS.md's /docs pointer resolves to an existing directory", () => {
			const agentsMd = readRepoFile("AGENTS.md");
			expect(agentsMd).toMatch(/`\/docs`/);
			expect(existsSync(resolve(ROOT, "docs"))).toBe(true);
			expect(lstatSync(resolve(ROOT, "docs")).isDirectory()).toBe(true);
		});

		it("docs/ has a README explaining the convention", () => {
			expect(existsSync(resolve(ROOT, "docs/README.md"))).toBe(true);
			const readme = readRepoFile("docs/README.md");
			expect(readme.length).toBeGreaterThan(0);
			expect(readme).toMatch(/design doc/i);
		});
	});

	describe("unified agent instructions", () => {
		it(".claude/CLAUDE.md is a symlink to AGENTS.md, not a copy", () => {
			const claudeMdPath = resolve(ROOT, ".claude/CLAUDE.md");
			expect(lstatSync(claudeMdPath).isSymbolicLink()).toBe(true);
			expect(realpathSync(claudeMdPath)).toBe(realpathSync(resolve(ROOT, "AGENTS.md")));
		});

		it("the symlink resolves to AGENTS.md within the .claude directory (relative target)", () => {
			const target = readlinkSync(resolve(ROOT, ".claude/CLAUDE.md"));
			expect(target).toBe("../AGENTS.md");
		});

		it("both files therefore have byte-identical content", () => {
			expect(readRepoFile(".claude/CLAUDE.md")).toBe(readRepoFile("AGENTS.md"));
		});
	});
});
