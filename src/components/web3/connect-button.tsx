import { lazy, Suspense, useContext } from "react";
import { Button } from "@/components/ui/button";
import { WalletReadyContext } from "@/lib/web3/wallet-ready-context";

const ConnectButtonLive = lazy(() => import("./connect-button-live"));

function ConnectButtonPlaceholder() {
	return (
		<Button variant="default" disabled>
			Connect Wallet
		</Button>
	);
}

export function ConnectButton() {
	const ready = useContext(WalletReadyContext);

	if (!ready) {
		return <ConnectButtonPlaceholder />;
	}

	return (
		<Suspense fallback={<ConnectButtonPlaceholder />}>
			<ConnectButtonLive />
		</Suspense>
	);
}
