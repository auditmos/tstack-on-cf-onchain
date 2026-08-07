import { execFileSync } from "node:child_process";

export const REPORT_TITLE = "Available major dependency upgrades";
const REPORT_MARKER = "<!-- majors-report:managed -->";

type TazeResolvedEntry = {
	name: string;
	source: string;
	currentVersion: string;
	targetVersion: string;
	diff: string;
	update: boolean;
};

type TazePackage = { resolved?: TazeResolvedEntry[] };
export type TazeOutput = { packages: TazePackage[] };

export type MajorUpdate = {
	name: string;
	source: string;
	currentVersion: string;
	targetVersion: string;
};

export function parseMajorUpdates(tazeOutput: TazeOutput): MajorUpdate[] {
	const majors: MajorUpdate[] = [];
	for (const pkg of tazeOutput.packages) {
		for (const entry of pkg.resolved ?? []) {
			if (entry.diff !== "major" || !entry.update) continue;
			majors.push({
				name: entry.name,
				source: entry.source,
				currentVersion: entry.currentVersion,
				targetVersion: entry.targetVersion,
			});
		}
	}
	return majors.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildReportBody(majors: MajorUpdate[], generatedAt: Date): string {
	const lines = [
		REPORT_MARKER,
		`_Last updated: ${generatedAt.toISOString()}_`,
		"",
		"The weekly dependency-update workflow (`deps-update.yml` / `pnpm deps:update`) " +
			"only bumps minor and patch versions — it will never propose a major upgrade. " +
			"This issue tracks major upgrades that are available but not applied automatically, " +
			"so they surface on a schedule instead of accumulating invisibly.",
		"",
	];

	if (majors.length === 0) {
		lines.push("No major upgrades are currently available.");
		return lines.join("\n");
	}

	lines.push(
		"| Package | Source | Current | Latest major |",
		"|---|---|---|---|",
		...majors.map(
			(m) => `| \`${m.name}\` | ${m.source} | \`${m.currentVersion}\` | \`${m.targetVersion}\` |`,
		),
		"",
		"Run `pnpm deps:major` locally to reproduce this list, or `pnpm deps:major:update` " +
			"to apply it — review each bump carefully, these are breaking changes.",
	);
	return lines.join("\n");
}

function runTaze(): TazeOutput {
	const output = execFileSync(
		"pnpm",
		["exec", "taze", "-r", "major", "--json", "--include-locked"],
		{
			encoding: "utf8",
			maxBuffer: 10 * 1024 * 1024,
		},
	);
	return JSON.parse(output) as TazeOutput;
}

function findTrackedIssueNumber(): number | undefined {
	const out = execFileSync(
		"gh",
		[
			"issue",
			"list",
			"--search",
			`"${REPORT_TITLE}" in:title`,
			"--state",
			"open",
			"--json",
			"number,title",
			"--limit",
			"10",
		],
		{ encoding: "utf8" },
	);
	const issues = JSON.parse(out) as Array<{ number: number; title: string }>;
	return issues.find((issue) => issue.title === REPORT_TITLE)?.number;
}

function upsertIssue(body: string): { action: "created" | "updated"; number: number } {
	const existing = findTrackedIssueNumber();
	if (existing !== undefined) {
		execFileSync("gh", ["issue", "edit", String(existing), "--body", body], { encoding: "utf8" });
		return { action: "updated", number: existing };
	}
	const out = execFileSync(
		"gh",
		[
			"issue",
			"create",
			"--title",
			REPORT_TITLE,
			"--body",
			body,
			"--label",
			"automated,dependencies",
		],
		{ encoding: "utf8" },
	);
	const match = out.match(/\/issues\/(\d+)/);
	if (!match?.[1]) throw new Error(`could not parse issue number from gh output: ${out}`);
	return { action: "created", number: Number(match[1]) };
}

async function main(): Promise<void> {
	const tazeOutput = runTaze();
	const majors = parseMajorUpdates(tazeOutput);
	const body = buildReportBody(majors, new Date());
	const result = upsertIssue(body);
	console.log(JSON.stringify({ msg: "majors-report", ...result, majorsCount: majors.length }));
}

const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
	main().catch((err: unknown) => {
		console.error(
			JSON.stringify({
				msg: "majors-report failed",
				error: err instanceof Error ? err.message : String(err),
			}),
		);
		process.exit(1);
	});
}
