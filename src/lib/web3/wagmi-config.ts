import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { activeChain, supportedChains } from "./chains";

interface CreateWagmiConfigOptions {
	walletConnectProjectId: string;
	appName?: string;
	appUrl?: string;
}

export function createWagmiConfig({
	walletConnectProjectId,
	appName = "tstack-on-cf-onchain",
	appUrl,
}: CreateWagmiConfigOptions) {
	const transports = Object.fromEntries(supportedChains.map((c) => [c.id, http()]));

	return createConfig(
		getDefaultConfig({
			chains: [activeChain],
			transports,
			walletConnectProjectId,
			appName,
			appUrl,
			ssr: true,
		}),
	);
}
