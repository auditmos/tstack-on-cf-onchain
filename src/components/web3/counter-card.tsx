import { lazy, Suspense, useContext } from "react";
import { WalletReadyContext } from "@/lib/web3/wallet-ready-context";

// SSR-gated: see connect-button.tsx for rationale.
const CounterCardLive = import.meta.env.SSR ? null : lazy(() => import("./counter-card-live"));

function CounterCardPlaceholder() {
	return <div className="text-muted-foreground">Loading…</div>;
}

export function CounterCard() {
	const ready = useContext(WalletReadyContext);

	if (!ready || !CounterCardLive) {
		return <CounterCardPlaceholder />;
	}

	return (
		<Suspense fallback={<CounterCardPlaceholder />}>
			<CounterCardLive />
		</Suspense>
	);
}
