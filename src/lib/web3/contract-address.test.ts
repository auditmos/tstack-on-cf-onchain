vi.mock("@/contracts/addresses", () => ({
	contractAddresses: {
		"31337": { Counter: "0x5FbDB2315678afecb367f032d93F642f64180aa3" },
	},
}));

import { getContractAddress } from "./contract-address";

describe("getContractAddress", () => {
	it("returns address for an existing chainId + contract name", () => {
		expect(getContractAddress(31337, "Counter")).toBe("0x5FbDB2315678afecb367f032d93F642f64180aa3");
	});

	it("returns undefined when chainId is not in the registry", () => {
		expect(getContractAddress(1, "Counter")).toBeUndefined();
	});

	it("returns undefined when contract name is not deployed on chain", () => {
		expect(getContractAddress(31337, "Token")).toBeUndefined();
	});
});
