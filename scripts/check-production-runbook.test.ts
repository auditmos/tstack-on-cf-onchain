import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readRepoFile(relativePath: string): string {
	return readFileSync(resolve(import.meta.dirname, "..", relativePath), "utf8");
}

describe("production routing posture & rollback runbook (issue #52)", () => {
	const readme = readRepoFile("README.md");
	const pkg = JSON.parse(readRepoFile("package.json")) as { scripts?: Record<string, string> };

	describe("default-hostname & preview-URL posture", () => {
		it("documents the workers_dev (default-hostname) posture", () => {
			expect(readme).toMatch(/workers_dev/);
		});

		it("documents the preview_urls posture", () => {
			expect(readme).toMatch(/preview_urls/);
		});

		it("points at the commented custom_domain stanza as the go-live path", () => {
			expect(readme).toMatch(/custom_domain/);
			expect(readme).toMatch(/uncomment/i);
		});
	});

	describe("version-upload, gradual-rollout & rollback runbook", () => {
		it("documents wrangler versions upload as the recommended production practice", () => {
			expect(readme).toMatch(/wrangler versions upload/);
		});

		it("documents wrangler versions deploy for gradual/percentage-split rollout", () => {
			expect(readme).toMatch(/wrangler versions deploy/);
			expect(readme).toMatch(/%|percentage/i);
		});

		it("documents wrangler rollback as the recovery procedure", () => {
			expect(readme).toMatch(/wrangler rollback/);
		});

		it("adds no new deploy/rollback scripts to package.json — deployment stays manual", () => {
			const scriptNames = Object.keys(pkg.scripts ?? {});
			expect(scriptNames).not.toContain("rollback");
			expect(scriptNames.some((name) => name.includes("version"))).toBe(false);
		});
	});

	describe("undocumented decisions recorded (no implementation)", () => {
		it("records why the Neon HTTP driver was chosen over a connection-pooling binding (e.g. Hyperdrive)", () => {
			expect(readme).toMatch(/neon-http|neon http driver/i);
			expect(readme).toMatch(/hyperdrive|connection.pool/i);
		});

		it("records how per-Worker secrets compare to account-level secret storage", () => {
			expect(readme).toMatch(/per-worker secret/i);
			expect(readme).toMatch(/secrets store/i);
		});
	});
});
