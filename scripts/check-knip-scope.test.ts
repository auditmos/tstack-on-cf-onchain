import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

type KnipConfig = {
	entry?: string[];
	ignore?: string[];
};

function readKnipConfig(): KnipConfig {
	return JSON.parse(readFileSync(resolve(ROOT, "knip.json"), "utf8")) as KnipConfig;
}

describe("dead-code exemption scope (issue #54)", () => {
	it("no longer blanket-exempts the database module", () => {
		const config = readKnipConfig();
		expect(config.ignore ?? []).not.toContain("src/db/**");
	});

	it("no longer blanket-exempts the error-handling module", () => {
		const config = readKnipConfig();
		expect(config.ignore ?? []).not.toContain("src/core/errors.ts");
	});

	it("declares the drizzle-kit schema entry point rather than ignoring src/db", () => {
		const config = readKnipConfig();
		expect(config.entry ?? []).toContain("src/db/schema.ts");
	});
});
