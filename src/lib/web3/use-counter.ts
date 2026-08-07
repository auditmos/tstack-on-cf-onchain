import { useEffect } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { counterAbi } from "@/contracts/abis/Counter";
import { activeChain } from "./chains";
import { getContractAddress } from "./contract-address";

interface UseCounterResult {
	value: bigint | undefined;
	isLoading: boolean;
	hasAddress: boolean;
	isConnected: boolean;
	isInFlight: boolean;
	error: Error | undefined;
	increment: () => void;
}

export function useCounter(): UseCounterResult {
	const address = getContractAddress(activeChain.id, "Counter");
	const { isConnected } = useAccount();
	const {
		writeContract,
		data: txHash,
		isPending: isWritePending,
		error: writeError,
		reset: resetWrite,
	} = useWriteContract();
	const {
		isLoading: isConfirming,
		isSuccess: isConfirmed,
		error: receiptError,
	} = useWaitForTransactionReceipt({
		hash: txHash,
	});

	const { data, isLoading, refetch } = useReadContract({
		abi: counterAbi,
		address,
		functionName: "get",
		chainId: activeChain.id,
	});

	useEffect(() => {
		if (isConfirmed) {
			refetch();
		}
	}, [isConfirmed, refetch]);

	const increment = () => {
		if (!address) return;
		resetWrite();
		writeContract({
			abi: counterAbi,
			address,
			functionName: "increment",
			chainId: activeChain.id,
		});
	};

	return {
		value: data,
		isLoading,
		hasAddress: Boolean(address),
		isConnected,
		isInFlight: isWritePending || isConfirming,
		error: writeError ?? receiptError ?? undefined,
		increment,
	};
}
