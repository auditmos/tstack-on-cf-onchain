import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function stripJsonComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"\\])\/\/.*$/gm, "$1");
}

type WranglerEnv = {
	name?: string;
	vars?: Record<string, unknown>;
	observability?: {
		enabled?: boolean;
		logs?: { head_sampling_rate?: number };
	};
};

type WranglerConfig = {
	name?: string;
	env?: Record<string, WranglerEnv>;
};

function readWranglerConfig(): WranglerConfig {
	const path = resolve(import.meta.dirname, "..", "wrangler.jsonc");
	const raw = readFileSync(path, "utf8");
	return JSON.parse(stripJsonComments(raw));
}

function readPackageScripts(): Record<string, string> {
	const path = resolve(import.meta.dirname, "..", "package.json");
	const pkg = JSON.parse(readFileSync(path, "utf8")) as { scripts?: Record<string, string> };
	return pkg.scripts ?? {};
}

describe("wrangler.jsonc multi-env configuration", () => {
	const config = readWranglerConfig();
	const envs = config.env ?? {};

	it("declares env.staging with a distinct worker name", () => {
		expect(envs.staging).toBeDefined();
		expect(envs.staging?.name).toBe("tanstack-start-app-staging");
		expect(envs.staging?.name).not.toBe(config.name);
	});

	it("declares env.production with a distinct worker name", () => {
		expect(envs.production).toBeDefined();
		expect(envs.production?.name).toBe("tanstack-start-app-production");
		expect(envs.production?.name).not.toBe(config.name);
	});

	for (const envName of ["staging", "production"] as const) {
		it(`enables observability with head_sampling_rate=1 in env.${envName}`, () => {
			const env = envs[envName];
			expect(env?.observability?.enabled).toBe(true);
			expect(env?.observability?.logs?.head_sampling_rate).toBe(1);
		});

		it(`declares its own vars.CLOUDFLARE_ENV in env.${envName} (env-level vars are not inherited)`, () => {
			const env = envs[envName];
			expect(env?.vars?.CLOUDFLARE_ENV).toBe(envName);
		});
	}
});

describe("package.json multi-env deploy scripts", () => {
	const scripts = readPackageScripts();

	for (const envName of ["staging", "production"] as const) {
		it(`defines build:${envName} that sets CLOUDFLARE_ENV=${envName} so the Cloudflare Vite plugin selects env.${envName}`, () => {
			const cmd = scripts[`build:${envName}`];
			expect(cmd).toBeDefined();
			expect(cmd).toMatch(/vite build/);
			expect(cmd).toMatch(new RegExp(`CLOUDFLARE_ENV=${envName}`));
		});

		it(`defines deploy:${envName} that builds then runs wrangler deploy (no --env flag; env is already baked into dist/server/wrangler.json)`, () => {
			const cmd = scripts[`deploy:${envName}`];
			expect(cmd).toBeDefined();
			expect(cmd).toMatch(new RegExp(`build:${envName}`));
			expect(cmd).toMatch(/wrangler deploy/);
			expect(cmd).not.toMatch(/--env\s/);
			expect(cmd).not.toMatch(/--env=/);
		});
	}
});
