import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOWS_DIR = ".github/workflows";
const FOUNDRY_TOOLCHAIN_ACTION = "foundry-rs/foundry-toolchain@v1";
const FOUNDRY_TOML = "contracts/foundry.toml";
const COUNTER_SOL = "contracts/src/Counter.sol";

function workflowsUsingFoundryToolchain(): string[] {
	return readdirSync(WORKFLOWS_DIR)
		.filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
		.filter((file) =>
			readFileSync(join(WORKFLOWS_DIR, file), "utf8").includes(FOUNDRY_TOOLCHAIN_ACTION),
		);
}

function pinnedToolchainVersion(workflowFile: string): string | undefined {
	const lines = readFileSync(join(WORKFLOWS_DIR, workflowFile), "utf8").split("\n");
	const actionIndex = lines.findIndex((line) => line.includes(FOUNDRY_TOOLCHAIN_ACTION));
	if (actionIndex === -1) return undefined;

	for (let i = actionIndex + 1; i < lines.length; i++) {
		const line = lines[i];
		if (line === undefined) break;
		if (/^\s*-\s*(name|uses):/.test(line)) break; // next step — stop scanning this block
		const match = line.match(/^\s*version:\s*["']?([^"'\s]+)["']?\s*$/);
		if (match?.[1]) return match[1];
	}
	return undefined;
}

describe("contract toolchain is pinned, not floating", () => {
	const workflows = workflowsUsingFoundryToolchain();

	it("finds at least one workflow installing the Foundry toolchain", () => {
		expect(workflows.length).toBeGreaterThan(0);
	});

	for (const file of workflowsUsingFoundryToolchain()) {
		it(`${file} pins foundry-toolchain to an explicit released version`, () => {
			const version = pinnedToolchainVersion(file);
			expect(version).toBeDefined();
			expect(version).not.toBe("nightly");
			expect(version).not.toBe("stable");
			expect(version).toMatch(/^v\d+\.\d+\.\d+$/);
		});
	}

	it("every workflow that installs it agrees on the same pinned version", () => {
		const versions = new Set(workflows.map((file) => pinnedToolchainVersion(file)));
		expect(versions.size).toBe(1);
	});
});

describe("contract compiler and EVM target are pinned", () => {
	const foundryToml = readFileSync(FOUNDRY_TOML, "utf8");

	it("pins an explicit solc version (auto_detect_solc is off)", () => {
		expect(foundryToml).toMatch(/^\s*solc\s*=\s*["']\d+\.\d+\.\d+["']\s*$/m);
		expect(foundryToml).toMatch(/^\s*auto_detect_solc\s*=\s*false\s*$/m);
	});

	it("pins an explicit evm_version", () => {
		expect(foundryToml).toMatch(/^\s*evm_version\s*=\s*["'][a-z]+["']\s*$/m);
	});

	it("the pinned solc version satisfies the source pragma", () => {
		const solcMatch = foundryToml.match(/^\s*solc\s*=\s*["'](\d+)\.(\d+)\.(\d+)["']\s*$/m);
		expect(solcMatch).not.toBeNull();
		if (!solcMatch) throw new Error("unreachable");
		const [, major, minor, patch] = solcMatch;

		const pragmaSource = readFileSync(COUNTER_SOL, "utf8");
		const pragmaMatch = pragmaSource.match(/pragma solidity \^(\d+)\.(\d+)\.(\d+);/);
		expect(pragmaMatch).not.toBeNull();
		if (!pragmaMatch) throw new Error("unreachable");
		const [, pMajor, pMinor, pPatch] = pragmaMatch;

		expect(major).toBe(pMajor);
		const minorNum = Number(minor);
		const pMinorNum = Number(pMinor);
		expect(minorNum >= pMinorNum).toBe(true);
		if (minorNum === pMinorNum) {
			expect(Number(patch) >= Number(pPatch)).toBe(true);
		}
	});
});
