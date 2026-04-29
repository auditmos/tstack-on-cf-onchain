import { generateAddressesModule } from "./generate-addresses";

describe("generateAddressesModule", () => {
	it("emits an empty `as const` mapping when no deployments exist", () => {
		const source = generateAddressesModule({});

		const match = source.match(/export const contractAddresses = ([\s\S]+) as const;/);
		expect(match).not.toBeNull();

		const parsed = JSON.parse(match?.[1] ?? "");
		expect(parsed).toEqual({});
	});

	it("preserves chainId → contract → address mapping across multiple chains", () => {
		const registry = {
			"31337": { Counter: "0x5FbDB2315678afecb367f032d93F642f64180aa3" },
			"11155111": { Counter: "0x1234567890123456789012345678901234567890" },
		};

		const source = generateAddressesModule(registry);
		const match = source.match(/export const contractAddresses = ([\s\S]+) as const;/);
		expect(match).not.toBeNull();

		const parsed = JSON.parse(match?.[1] ?? "");
		expect(parsed).toEqual(registry);
	});
});
