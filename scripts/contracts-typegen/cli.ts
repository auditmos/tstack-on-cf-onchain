import { resolve } from "node:path";
import { runTypegen } from "./index";

const projectRoot = process.cwd();

await runTypegen({
	artifactsDir: resolve(projectRoot, "contracts/out"),
	deploymentsDir: resolve(projectRoot, "contracts/deployments"),
	outDir: resolve(projectRoot, "src/contracts"),
});

console.log("Generated src/contracts/abis/*.ts and src/contracts/addresses.ts");
