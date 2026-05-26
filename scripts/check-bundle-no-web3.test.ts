import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// Audit M5 (issue #28): wagmi/viem/connectkit/@walletconnect must never land in
// the Cloudflare Worker SSR bundle. Even reachable-but-unexecuted lazy chunks
// trip Workers' `Cannot split a chunk` runtime and bloat the worker output
// (~6 MB of web3 deps on top of a ~3 MB shell). The rule is "zero refs in
// dist/server/**/*.js" — see `.claude/rules/frontend/web3-ssr.md`.
const FORBIDDEN = /(?:wagmi|viem|@walletconnect|connectkit)/;
const SERVER_DIR = resolve(import.meta.dirname, "..", "dist", "server");
const ENTRYPOINT = join(SERVER_DIR, "index.js");

function listJsFiles(dir: string): string[] {
	const entries = readdirSync(dir, { recursive: true, withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
		files.push(join(entry.parentPath, entry.name));
	}
	return files;
}

describe("dist/server SSR bundle web3 hygiene", () => {
	if (!existsSync(ENTRYPOINT)) {
		it.skip("dist/server/index.js missing — run `pnpm build` before `pnpm test` to exercise this check", () => {});
		return;
	}

	const offenders = listJsFiles(SERVER_DIR)
		.filter((file) => FORBIDDEN.test(readFileSync(file, "utf8")))
		.map((file) => relative(SERVER_DIR, file))
		.sort();

	it("does not bundle wagmi/viem/connectkit/@walletconnect into the Worker SSR output", () => {
		expect(offenders).toEqual([]);
	});
});
