import { vi } from "vitest";
import type { AnvilProcess, OrchestrateDeps } from "./orchestrate";
import { orchestrate } from "./orchestrate";

function makeAnvil(): AnvilProcess {
	return { kill: vi.fn() };
}

function makeDeps(overrides: Partial<OrchestrateDeps> = {}): {
	deps: OrchestrateDeps;
	calls: string[];
	anvil: AnvilProcess;
} {
	const calls: string[] = [];
	const anvil = makeAnvil();

	const deps: OrchestrateDeps = {
		spawnAnvil: vi.fn(() => {
			calls.push("spawnAnvil");
			return anvil;
		}),
		waitForReady: vi.fn(async () => {
			calls.push("waitForReady");
		}),
		deploy: vi.fn(async () => {
			calls.push("deploy");
		}),
		typegen: vi.fn(async () => {
			calls.push("typegen");
		}),
		logger: { info: vi.fn(), error: vi.fn() },
		...overrides,
	};

	return { deps, calls, anvil };
}

describe("orchestrate", () => {
	it("runs spawnAnvil → waitForReady → deploy → typegen in order", async () => {
		const { deps, calls, anvil } = makeDeps();

		const result = await orchestrate(deps);

		expect(calls).toEqual(["spawnAnvil", "waitForReady", "deploy", "typegen"]);
		expect(result).toBe(anvil);
	});

	it("kills anvil and skips deploy/typegen when waitForReady rejects", async () => {
		const { deps, calls, anvil } = makeDeps({
			waitForReady: vi.fn(async () => {
				throw new Error("anvil never ready");
			}),
		});

		await expect(orchestrate(deps)).rejects.toThrow("anvil never ready");

		expect(calls).toEqual(["spawnAnvil"]);
		expect(anvil.kill).toHaveBeenCalledTimes(1);
		expect(deps.deploy).not.toHaveBeenCalled();
		expect(deps.typegen).not.toHaveBeenCalled();
	});

	it("kills anvil when deploy throws", async () => {
		const { deps, anvil } = makeDeps({
			deploy: vi.fn(async () => {
				throw new Error("deploy boom");
			}),
		});

		await expect(orchestrate(deps)).rejects.toThrow("deploy boom");

		expect(anvil.kill).toHaveBeenCalledTimes(1);
		expect(deps.typegen).not.toHaveBeenCalled();
	});
});
