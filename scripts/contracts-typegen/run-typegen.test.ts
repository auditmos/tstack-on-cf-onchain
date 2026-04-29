import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach } from "vitest";
import { runTypegen } from "./index";

const counterArtifact = {
	abi: [
		{
			type: "function",
			name: "get",
			inputs: [],
			outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
			stateMutability: "view",
		},
		{
			type: "function",
			name: "increment",
			inputs: [],
			outputs: [],
			stateMutability: "nonpayable",
		},
	],
	metadata: {
		settings: { compilationTarget: { "src/Counter.sol": "Counter" } },
	},
};

const forgeStdArtifact = {
	abi: [],
	metadata: {
		settings: { compilationTarget: { "dependencies/forge-std-1.15.0/src/Test.sol": "Test" } },
	},
};

describe("runTypegen", () => {
	let workDir: string;

	beforeEach(async () => {
		workDir = await mkdtemp(join(tmpdir(), "typegen-"));
	});

	afterEach(async () => {
		await rm(workDir, { recursive: true, force: true });
	});

	it("writes ABI module for user contracts and addresses module from registry", async () => {
		const artifactsDir = join(workDir, "out");
		const deploymentsDir = join(workDir, "deployments");
		const outDir = join(workDir, "src-contracts");

		await mkdir(join(artifactsDir, "Counter.sol"), { recursive: true });
		await writeFile(
			join(artifactsDir, "Counter.sol", "Counter.json"),
			JSON.stringify(counterArtifact),
		);

		await mkdir(join(artifactsDir, "Test.sol"), { recursive: true });
		await writeFile(join(artifactsDir, "Test.sol", "Test.json"), JSON.stringify(forgeStdArtifact));

		await mkdir(deploymentsDir, { recursive: true });
		await writeFile(
			join(deploymentsDir, "31337.json"),
			JSON.stringify({ Counter: "0x5FbDB2315678afecb367f032d93F642f64180aa3" }),
		);

		await runTypegen({ artifactsDir, deploymentsDir, outDir });

		const counterAbiSource = await readFile(join(outDir, "abis", "Counter.ts"), "utf8");
		expect(counterAbiSource).toContain("export const counterAbi");
		expect(counterAbiSource).toContain("as const");

		await expect(readFile(join(outDir, "abis", "Test.ts"), "utf8")).rejects.toThrow();

		const addressesSource = await readFile(join(outDir, "addresses.ts"), "utf8");
		expect(addressesSource).toContain("export const contractAddresses");
		expect(addressesSource).toContain("31337");
		expect(addressesSource).toContain("0x5FbDB2315678afecb367f032d93F642f64180aa3");
	});

	it("writes an empty addresses module when deployments directory is missing", async () => {
		const artifactsDir = join(workDir, "out");
		const deploymentsDir = join(workDir, "deployments-does-not-exist");
		const outDir = join(workDir, "src-contracts");

		await mkdir(join(artifactsDir, "Counter.sol"), { recursive: true });
		await writeFile(
			join(artifactsDir, "Counter.sol", "Counter.json"),
			JSON.stringify(counterArtifact),
		);

		await runTypegen({ artifactsDir, deploymentsDir, outDir });

		const addressesSource = await readFile(join(outDir, "addresses.ts"), "utf8");
		const match = addressesSource.match(/export const contractAddresses = ([\s\S]+) as const;/);
		expect(match).not.toBeNull();
		expect(JSON.parse(match?.[1] ?? "")).toEqual({});
	});
});
