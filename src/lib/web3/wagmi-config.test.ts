import { activeChain } from "./chains";
import { createWagmiConfig } from "./wagmi-config";

describe("createWagmiConfig", () => {
	it("includes activeChain in chains", () => {
		const config = createWagmiConfig({ walletConnectProjectId: "test-project-id" });
		const chainIds = config.chains.map((c) => c.id);
		expect(chainIds).toContain(activeChain.id);
	});

	it("registers an http transport for activeChain", () => {
		const config = createWagmiConfig({ walletConnectProjectId: "test-project-id" });
		expect(config._internal.transports[activeChain.id]).toBeDefined();
	});

	it("registers a transport for activeChain only — it does not iterate a chain registry", () => {
		const config = createWagmiConfig({ walletConnectProjectId: "test-project-id" });
		expect(Object.keys(config._internal.transports)).toEqual([String(activeChain.id)]);
	});

	it("enables SSR mode", () => {
		const config = createWagmiConfig({ walletConnectProjectId: "test-project-id" });
		expect(config._internal.ssr).toBe(true);
	});
});
