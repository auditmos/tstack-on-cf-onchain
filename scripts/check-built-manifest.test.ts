import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Issue #45: source-map upload and Smart Placement must survive the build, not
// just exist in wrangler.jsonc source. The Cloudflare Vite plugin flattens
// whichever env.<name> block CLOUDFLARE_ENV selected into this file at build
// time — a key present only in source and absent here was never enabled.
const MANIFEST_PATH = resolve(import.meta.dirname, "..", "dist", "server", "wrangler.json");

type BuiltManifest = {
	targetEnvironment?: string;
	upload_source_maps?: boolean;
	placement?: { mode?: string };
	observability?: { logs?: { head_sampling_rate?: number } };
};

describe("dist/server/wrangler.json built manifest", () => {
	if (!existsSync(MANIFEST_PATH)) {
		it.skip("dist/server/wrangler.json missing — run `pnpm build` (or build:staging / build:production) before `pnpm test` to exercise this check", () => {});
		return;
	}

	const manifest: BuiltManifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

	it("carries upload_source_maps=true into the built manifest for the built environment", () => {
		expect(manifest.upload_source_maps).toBe(true);
	});

	it("carries a numeric observability.logs.head_sampling_rate into the built manifest", () => {
		const rate = manifest.observability?.logs?.head_sampling_rate;
		expect(typeof rate).toBe("number");
		expect(rate).toBeGreaterThanOrEqual(0);
		expect(rate).toBeLessThanOrEqual(1);
	});

	if (manifest.targetEnvironment === "staging" || manifest.targetEnvironment === "production") {
		it(`carries placement.mode="smart" into the built manifest for env.${manifest.targetEnvironment}`, () => {
			expect(manifest.placement?.mode).toBe("smart");
		});
	}
});
