import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { orchestrate } from "./orchestrate";
import { waitForReady } from "./wait-for-ready";

const RPC_URL = "http://127.0.0.1:8545";
const ANVIL_PORT = "8545";
const ANVIL_DEV_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const PROJECT_ROOT = process.cwd();

function runCommand(cmd: string, args: string[]): Promise<void> {
	return new Promise((resolveCmd, reject) => {
		const child = spawn(cmd, args, { stdio: "inherit", cwd: PROJECT_ROOT });
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolveCmd();
			else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
		});
	});
}

const anvil = await orchestrate({
	spawnAnvil: () => {
		const child = spawn("anvil", ["--port", ANVIL_PORT], {
			stdio: "inherit",
			cwd: PROJECT_ROOT,
		});
		child.on("exit", (code) => {
			process.exit(code ?? 0);
		});
		return child;
	},
	waitForReady: () => waitForReady({ url: RPC_URL, timeoutMs: 15_000, intervalMs: 200 }),
	deploy: () =>
		runCommand("forge", [
			"script",
			"--root",
			resolve(PROJECT_ROOT, "contracts"),
			"DeployCounter",
			"--rpc-url",
			"local",
			"--broadcast",
			"--private-key",
			ANVIL_DEV_KEY,
		]),
	typegen: () => runCommand("tsx", [resolve(PROJECT_ROOT, "scripts/contracts-typegen/cli.ts")]),
	logger: { info: (m) => console.log(m), error: (m) => console.error(m) },
});

const shutdown = (signal: NodeJS.Signals) => {
	anvil.kill(signal);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
