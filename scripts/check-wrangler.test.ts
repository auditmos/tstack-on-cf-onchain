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
	upload_source_maps?: boolean;
	placement?: { mode?: string };
};

type WranglerConfig = {
	name?: string;
	env?: Record<string, WranglerEnv>;
	observability?: {
		enabled?: boolean;
		logs?: { head_sampling_rate?: number };
	};
	upload_source_maps?: boolean;
	placement?: { mode?: string };
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

function readWranglerSource(): string {
	const path = resolve(import.meta.dirname, "..", "wrangler.jsonc");
	return readFileSync(path, "utf8");
}

function lineWithComment(source: string, needle: string): string {
	const lines = source.split("\n");
	const idx = lines.findIndex((line) => line.includes(needle));
	if (idx === -1) return "";
	return [lines[idx - 1], lines[idx], lines[idx + 1]].join("\n");
}

describe("wrangler.jsonc multi-env configuration", () => {
	const config = readWranglerConfig();
	const envs = config.env ?? {};

	it("enables observability at the top level so dev deploys emit Workers Logs", () => {
		expect(config.observability?.enabled).toBe(true);
	});

	it("declares observability.logs.head_sampling_rate at the top level (number in [0, 1])", () => {
		const rate = config.observability?.logs?.head_sampling_rate;
		expect(typeof rate).toBe("number");
		expect(rate).toBeGreaterThanOrEqual(0);
		expect(rate).toBeLessThanOrEqual(1);
	});

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
		it(`enables observability in env.${envName}`, () => {
			const env = envs[envName];
			expect(env?.observability?.enabled).toBe(true);
		});

		it(`declares its own vars.CLOUDFLARE_ENV in env.${envName} (env-level vars are not inherited)`, () => {
			const env = envs[envName];
			expect(env?.vars?.CLOUDFLARE_ENV).toBe(envName);
		});
	}

	it("declares upload_source_maps=true at the top level so dev stack traces point at original source", () => {
		expect(config.upload_source_maps).toBe(true);
	});

	for (const envName of ["staging", "production"] as const) {
		it(`redeclares upload_source_maps=true in env.${envName} (env-level fields are not inherited)`, () => {
			expect(envs[envName]?.upload_source_maps).toBe(true);
		});
	}

	it("enables Smart Placement (placement.mode = smart) in env.production so the Worker runs near its single-region database", () => {
		expect(envs.production?.placement?.mode).toBe("smart");
	});

	it("staging and production log-sampling values differ deliberately, not by accident", () => {
		const stagingRate = envs.staging?.observability?.logs?.head_sampling_rate;
		const productionRate = envs.production?.observability?.logs?.head_sampling_rate;
		expect(typeof stagingRate).toBe("number");
		expect(typeof productionRate).toBe("number");
		expect(stagingRate).not.toBe(productionRate);
	});

	describe("log-sampling rationale comments", () => {
		const source = readWranglerSource();

		it("explains the top-level (dev) head_sampling_rate value with a nearby comment", () => {
			const context = lineWithComment(source, '"head_sampling_rate": 1').split("\n")[0] ?? "";
			expect(context.trim()).toMatch(/^\/\//);
		});

		for (const envName of ["staging", "production"] as const) {
			it(`explains env.${envName}'s head_sampling_rate value with a nearby comment`, () => {
				const rate = envs[envName]?.observability?.logs?.head_sampling_rate;
				const occurrences = source
					.split("\n")
					.map((line, idx) => ({ line, idx }))
					.filter(({ line }) => line.includes(`"head_sampling_rate": ${rate}`));
				const hasCommentedOccurrence = occurrences.some(({ idx }) => {
					const prevLine = source.split("\n")[idx - 1] ?? "";
					return prevLine.trim().startsWith("//");
				});
				expect(hasCommentedOccurrence).toBe(true);
			});
		}
	});
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
