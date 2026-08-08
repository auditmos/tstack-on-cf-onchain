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

/** The single chain this deployment is configured for. */
export const activeChain: Chain = resolveChain(envChainId);

/** The full registry of chains this template knows how to resolve — not just the active one. */
export const knownChains: readonly Chain[] = Object.values(SUPPORTED);
