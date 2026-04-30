import { lazy, Suspense, useContext } from "react";
import { WalletReadyContext } from "@/lib/web3/wallet-ready-context";

const CounterCardLive = lazy(() => import("./counter-card-live"));

function CounterCardPlaceholder() {
	return <div className="text-muted-foreground">Loading…</div>;
}

export function CounterCard() {
	const ready = useContext(WalletReadyContext);

	if (!ready) {
		return <CounterCardPlaceholder />;
	}

	return (
		<Suspense fallback={<CounterCardPlaceholder />}>
			<CounterCardLive />
		</Suspense>
	);
}
