import { lazy, Suspense, useContext } from "react";
import { Button } from "@/components/ui/button";
import { WalletReadyContext } from "@/lib/web3/wallet-ready-context";

// SSR-gated: Vite folds `import.meta.env.SSR` to a constant at build time and
// drops the dynamic import target from the SSR graph. Keeps wagmi/viem out of
// dist/server/ — see audit M5 / issue #28.
const ConnectButtonLive = import.meta.env.SSR ? null : lazy(() => import("./connect-button-live"));

function ConnectButtonPlaceholder() {
	return (
		<Button variant="default" disabled>
			Connect Wallet
		</Button>
	);
}

export function ConnectButton() {
	const ready = useContext(WalletReadyContext);

	if (!ready || !ConnectButtonLive) {
		return <ConnectButtonPlaceholder />;
	}

	return (
		<Suspense fallback={<ConnectButtonPlaceholder />}>
			<ConnectButtonLive />
		</Suspense>
	);
}
