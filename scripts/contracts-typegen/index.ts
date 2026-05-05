import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { isUserArtifact } from "./filter-artifacts";
import { type FoundryArtifact, generateAbiModule } from "./generate-abi";
import { type DeploymentRegistry, generateAddressesModule } from "./generate-addresses";

interface TypegenOptions {
	artifactsDir: string;
	deploymentsDir: string;
	outDir: string;
}

export async function runTypegen(opts: TypegenOptions): Promise<void> {
	const abisDir = join(opts.outDir, "abis");
	await mkdir(abisDir, { recursive: true });

	const userArtifacts = await collectUserArtifacts(opts.artifactsDir);
	for (const { name, artifact } of userArtifacts) {
		const source = generateAbiModule(artifact, name);
		await writeFile(join(abisDir, `${name}.ts`), source);
	}

	const registry = await loadDeploymentRegistry(opts.deploymentsDir);
	await writeFile(join(opts.outDir, "addresses.ts"), generateAddressesModule(registry));
}

interface NamedArtifact {
	name: string;
	artifact: FoundryArtifact;
}

async function collectUserArtifacts(artifactsDir: string): Promise<NamedArtifact[]> {
	const entries = await readdir(artifactsDir, { withFileTypes: true });
	const result: NamedArtifact[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory() || !entry.name.endsWith(".sol")) continue;
		const dir = join(artifactsDir, entry.name);
		const files = await readdir(dir);

		for (const file of files) {
			if (extname(file) !== ".json") continue;
			const fullPath = join(dir, file);
			const raw = await readFile(fullPath, "utf8");
			const parsed = JSON.parse(raw) as FoundryArtifact;
			if (!isUserArtifact(parsed)) continue;
			const name = basename(file, ".json");
			result.push({ name, artifact: parsed });
		}
	}

	return result;
}

async function loadDeploymentRegistry(deploymentsDir: string): Promise<DeploymentRegistry> {
	const registry: DeploymentRegistry = {};
	let files: string[];
	try {
		files = await readdir(deploymentsDir);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return registry;
		throw error;
	}

	for (const file of files) {
		if (extname(file) !== ".json") continue;
		const chainId = basename(file, ".json");
		const raw = await readFile(join(deploymentsDir, file), "utf8");
		registry[chainId] = JSON.parse(raw) as Record<string, string>;
	}

	return registry;
}
