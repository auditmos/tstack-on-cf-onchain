import { generateAbiModule } from "./generate-abi";

describe("generateAbiModule", () => {
	it("emits an `as const` ABI export named after the contract in camelCase", () => {
		const artifact = {
			abi: [
				{
					type: "function",
					name: "get",
					inputs: [],
					outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
					stateMutability: "view",
				},
				{
					type: "function",
					name: "increment",
					inputs: [],
					outputs: [],
					stateMutability: "nonpayable",
				},
			],
		};

		const source = generateAbiModule(artifact, "Counter");

		const match = source.match(/export const counterAbi = ([\s\S]+) as const;/);
		expect(match).not.toBeNull();

		const parsed = JSON.parse(match?.[1] ?? "");
		expect(parsed).toEqual(artifact.abi);
	});
});
