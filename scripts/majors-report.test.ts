import { buildReportBody, parseMajorUpdates, REPORT_TITLE } from "./majors-report";

const SAMPLE_TAZE_OUTPUT = {
	packages: [
		{
			resolved: [
				{
					name: "wagmi",
					source: "dependencies",
					currentVersion: "^2.19.5",
					targetVersion: "^3.7.6",
					diff: "major",
					update: true,
				},
				{
					name: "hono",
					source: "dependencies",
					currentVersion: "^4.12.34",
					targetVersion: "^4.13.1",
					diff: "minor",
					update: true,
				},
				{
					name: "vite",
					source: "devDependencies",
					currentVersion: "7.1.2",
					targetVersion: "8.2.1",
					diff: "major",
					update: true,
				},
				{
					name: "viem",
					source: "dependencies",
					currentVersion: "^2.55.10",
					targetVersion: "^2.55.11",
					diff: "patch",
					update: true,
				},
			],
		},
	],
};

describe("parseMajorUpdates", () => {
	it("keeps only major-diff entries, sorted alphabetically", () => {
		const majors = parseMajorUpdates(SAMPLE_TAZE_OUTPUT);
		expect(majors.map((m) => m.name)).toEqual(["vite", "wagmi"]);
	});

	it("drops minor and patch entries", () => {
		const majors = parseMajorUpdates(SAMPLE_TAZE_OUTPUT);
		expect(majors.some((m) => m.name === "hono")).toBe(false);
		expect(majors.some((m) => m.name === "viem")).toBe(false);
	});

	it("returns an empty list when there are no packages", () => {
		expect(parseMajorUpdates({ packages: [] })).toEqual([]);
	});

	it("carries the current and target version for each major", () => {
		const majors = parseMajorUpdates(SAMPLE_TAZE_OUTPUT);
		const wagmi = majors.find((m) => m.name === "wagmi");
		expect(wagmi).toEqual({
			name: "wagmi",
			source: "dependencies",
			currentVersion: "^2.19.5",
			targetVersion: "^3.7.6",
		});
	});
});

describe("buildReportBody", () => {
	const generatedAt = new Date("2026-08-07T00:00:00.000Z");

	it("lists each major with its current and target version", () => {
		const majors = parseMajorUpdates(SAMPLE_TAZE_OUTPUT);
		const body = buildReportBody(majors, generatedAt);
		expect(body).toContain("wagmi");
		expect(body).toContain("^2.19.5");
		expect(body).toContain("^3.7.6");
		expect(body).toContain("vite");
		expect(body).toContain("7.1.2");
		expect(body).toContain("8.2.1");
	});

	it("distinguishes majors from the minor/patch bot's scope", () => {
		const body = buildReportBody([], generatedAt);
		expect(body).toMatch(/minor and patch/i);
	});

	it("says explicitly when there are no majors available", () => {
		const body = buildReportBody([], generatedAt);
		expect(body).toMatch(/no major upgrades/i);
	});

	it("is stamped with a managed marker so a re-run can find it to update in place", () => {
		const body = buildReportBody([], generatedAt);
		expect(body).toContain("majors-report:managed");
	});
});

describe("REPORT_TITLE", () => {
	it("is a stable, non-empty string used as the tracked issue's title", () => {
		expect(REPORT_TITLE.length).toBeGreaterThan(0);
	});
});
