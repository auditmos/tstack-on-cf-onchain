import { fallback, http, type Transport } from "viem";

export interface RpcResolverChain {
	id: number;
	rpcUrls: { default: { http: readonly string[] } };
}

type EnvLike = Record<string, string | undefined>;

/**
 * Per-chain endpoint override convention: `VITE_RPC_URL_<chainId>`.
 * Browser-exposed build-time config — see .claude/rules/frontend/web3-ssr.md
 * for why this must stay client-visible and never become a server secret here.
 */
export function resolveRpcUrls(
	chain: RpcResolverChain,
	env: EnvLike = import.meta.env as EnvLike,
): string[] {
	const configured = env[`VITE_RPC_URL_${chain.id}`];
	const publicUrl = chain.rpcUrls.default.http[0];
	const ordered = configured ? [configured, publicUrl] : [publicUrl];
	return ordered.filter((url): url is string => Boolean(url));
}

export function createRpcTransport(chain: RpcResolverChain, env?: EnvLike): Transport {
	const urls = resolveRpcUrls(chain, env);
	const first = urls[0];
	if (!first) {
		throw new Error(`No RPC URL available for chain ${chain.id}`);
	}
	return urls.length > 1 ? fallback(urls.map((url) => http(url))) : http(first);
}
