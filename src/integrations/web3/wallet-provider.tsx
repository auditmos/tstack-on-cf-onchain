import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { createWagmiConfig } from "@/lib/web3/wagmi-config";
import { WalletReadyContext } from "@/lib/web3/wallet-ready-context";

interface WalletProviderProps {
	children: React.ReactNode;
	queryClient: QueryClient;
}

export default function WalletProvider({ children, queryClient }: WalletProviderProps) {
	const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

	const config = useMemo(() => createWagmiConfig({ walletConnectProjectId: projectId }), []);

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<ConnectKitProvider>
					<WalletReadyContext.Provider value={true}>{children}</WalletReadyContext.Provider>
				</ConnectKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
