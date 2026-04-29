import { isUserArtifact } from "./filter-artifacts";

describe("isUserArtifact", () => {
	it("accepts artifacts compiled from contracts/src/", () => {
		const counterArtifact = {
			metadata: {
				settings: {
					compilationTarget: { "src/Counter.sol": "Counter" },
				},
			},
		};
		expect(isUserArtifact(counterArtifact)).toBe(true);
	});

	it("rejects artifacts compiled from forge-std, dependencies, scripts, or tests", () => {
		const cases: Record<string, string>[] = [
			{ "dependencies/forge-std-1.15.0/src/Test.sol": "Test" },
			{ "dependencies/forge-std-1.15.0/src/Vm.sol": "Vm" },
			{ "dependencies/forge-std-1.15.0/src/console.sol": "console" },
			{ "dependencies/forge-std-1.15.0/src/StdInvariant.sol": "StdInvariant" },
			{ "test/Counter.t.sol": "CounterTest" },
			{ "script/Counter.s.sol": "CounterScript" },
		];

		for (const compilationTarget of cases) {
			const artifact = { metadata: { settings: { compilationTarget } } };
			expect(isUserArtifact(artifact)).toBe(false);
		}
	});
});
