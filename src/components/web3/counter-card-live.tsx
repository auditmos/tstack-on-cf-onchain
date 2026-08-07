import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCounter } from "@/lib/web3/use-counter";

export default function CounterCardLive() {
	const { value, isLoading, hasAddress, isConnected, isInFlight, error, increment } = useCounter();

	if (!hasAddress) {
		return <div className="text-muted-foreground">Counter not deployed on this chain</div>;
	}

	if (isLoading) {
		return <div className="text-muted-foreground">Loading…</div>;
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="text-foreground">{value !== undefined ? String(value) : null}</div>
			<Button disabled={!isConnected || isInFlight} onClick={increment}>
				{isInFlight ? "Confirming…" : "Increment"}
			</Button>
			{!isConnected && <p className="text-sm text-muted-foreground">Connect wallet to increment</p>}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error.message}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
