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

	it("enables SSR mode", () => {
		const config = createWagmiConfig({ walletConnectProjectId: "test-project-id" });
		expect(config._internal.ssr).toBe(true);
	});
});
