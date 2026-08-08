import { getDefaultConfig } from "connectkit";
import { createConfig } from "wagmi";
import { activeChain } from "./chains";
import { createRpcTransport } from "./rpc-transport";

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
	const transports = { [activeChain.id]: createRpcTransport(activeChain) };

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
