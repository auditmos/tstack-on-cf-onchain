import { anvil, type Chain, mainnet, sepolia } from "viem/chains";

const SUPPORTED: Record<number, Chain> = {
	1: mainnet,
	11155111: sepolia,
	31337: anvil,
};

export class UnsupportedChainError extends Error {
	constructor(public readonly chainId: number) {
		super(`Unsupported chainId: ${chainId}`);
		this.name = "UnsupportedChainError";
	}
}

export function resolveChain(chainId: number): Chain {
	const chain = SUPPORTED[chainId];
	if (!chain) {
		throw new UnsupportedChainError(chainId);
	}
	return chain;
}

const envChainId = Number(import.meta.env.VITE_CHAIN_ID ?? 31337);

export const activeChain: Chain = resolveChain(envChainId);
export const supportedChains: readonly Chain[] = [activeChain] as const;
