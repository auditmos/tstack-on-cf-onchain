import { anvil, mainnet, sepolia } from "viem/chains";
import { activeChain, resolveChain, supportedChains, UnsupportedChainError } from "./chains";

describe("resolveChain", () => {
	it("returns anvil for chainId 31337", () => {
		expect(resolveChain(31337)).toBe(anvil);
	});

	it("returns sepolia for chainId 11155111", () => {
		expect(resolveChain(11155111)).toBe(sepolia);
	});

	it("returns mainnet for chainId 1", () => {
		expect(resolveChain(1)).toBe(mainnet);
	});

	it("throws UnsupportedChainError for unknown chainId", () => {
		expect(() => resolveChain(424242)).toThrow(UnsupportedChainError);
	});
});

describe("activeChain", () => {
	it("defaults to anvil (chainId 31337) when VITE_CHAIN_ID is not set", () => {
		expect(activeChain.id).toBe(31337);
	});

	it("is included in supportedChains", () => {
		expect(supportedChains).toContain(activeChain);
	});

	it("supportedChains is non-empty", () => {
		expect(supportedChains.length).toBeGreaterThan(0);
	});
});
