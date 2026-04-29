import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";

const WalletProvider = lazy(() => import("./wallet-provider"));

interface Web3ProviderProps {
	children: React.ReactNode;
	queryClient: QueryClient;
}

export function Web3Provider({ children, queryClient }: Web3ProviderProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const queryShell = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

	if (!mounted) {
		return queryShell;
	}

	return (
		<Suspense fallback={queryShell}>
			<WalletProvider queryClient={queryClient}>{children}</WalletProvider>
		</Suspense>
	);
}
