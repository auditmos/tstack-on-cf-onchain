import { useModal } from "connectkit";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";

function truncateAddress(address: string): string {
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function ConnectButtonLive() {
	const { address, isConnected } = useAccount();
	const { setOpen } = useModal();

	const handleClick = () => setOpen(true);

	if (isConnected && address) {
		return (
			<Button onClick={handleClick} variant="outline">
				{truncateAddress(address)}
			</Button>
		);
	}

	return (
		<Button onClick={handleClick} variant="default">
			Connect Wallet
		</Button>
	);
}
