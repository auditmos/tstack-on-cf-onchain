import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readRepoFile(relativePath: string): string {
	return readFileSync(resolve(import.meta.dirname, "..", relativePath), "utf8");
}

describe("frozen-major decisions are recorded (issue #51)", () => {
	const readme = readRepoFile("README.md");
	const viteConfig = readRepoFile("vite.config.ts");
	const pkg = JSON.parse(readRepoFile("package.json")) as {
		devDependencies?: Record<string, string>;
	};

	describe("wallet library (wagmi 2 -> 3) decision", () => {
		it("records a stay/migrate/replace verdict for wagmi 3", () => {
			expect(readme).toMatch(/wagmi 3/i);
			expect(readme).toMatch(/\b(stay|migrate|replace)\b/i);
		});

		it("names ConnectKit's peer-dependency constraint as the reasoning", () => {
			expect(readme).toMatch(/connectkit/i);
			expect(readme).toMatch(/peer/i);
		});

		it("cites the upstream evidence the decision was based on", () => {
			expect(readme).toMatch(/family\/connectkit/i);
		});
	});

	describe("build tool (vite 7 -> 8) pin decision", () => {
		it("keeps vite exact-pinned in package.json, matching the recorded decision", () => {
			expect(pkg.devDependencies?.vite).toBe("7.1.2");
		});

		it("records the pin's reason next to the pin in vite.config.ts", () => {
			expect(viteConfig).toMatch(/vite/i);
			expect(viteConfig).toMatch(/pin/i);
		});

		it("names the blocking dependency (@vitejs/plugin-react) in the README dependency-policy section", () => {
			expect(readme).toMatch(/@vitejs\/plugin-react/);
			expect(readme).toMatch(/vite 8/i);
		});
	});
});
