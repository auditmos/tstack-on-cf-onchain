# Web3 SSR Pattern (wagmi + ConnectKit on TanStack Start + Cloudflare Workers)

wagmi/connectkit/viem are **client-only** in this project. They must NOT be in the SSR/Worker bundle. Two failure modes if you skip this:

1. **`Cannot split a chunk`** — Cloudflare runtime error when wagmi ends up in the SSR bundle.
2. **`WagmiProviderNotFoundError`** — `useConfig` (and every wagmi hook) throws during SSR because `WalletProvider` only mounts post-hydration.

## The Pattern

Three pieces, one per component that uses wagmi hooks:

| File | Role |
|------|------|
| `*.tsx` (placeholder) | Renders skeleton/disabled state. **No wagmi imports.** Reads `WalletReadyContext` to decide whether to render the live version. |
| `*-live.tsx` (real component) | Imports wagmi/viem freely. Loaded via `React.lazy` from the placeholder. |
| `useThing` custom hook (in `src/lib/web3/`) | Hides wagmi wiring (`useReadContract`, `useWriteContract`, etc.) behind a narrow interface. Only imported by `*-live.tsx`. |

Reference implementations:
- `src/components/web3/connect-button.tsx` + `connect-button-live.tsx`
- `src/components/web3/counter-card.tsx` + `counter-card-live.tsx` + `src/lib/web3/use-counter.ts`

## Provider Wiring

- `WalletProvider` in `src/integrations/web3/wallet-provider.tsx` — instantiates `WagmiProvider` + `ConnectKitProvider`.
- `RootProvider` in `src/integrations/web3/root-provider.tsx` — `React.lazy(() => import('./wallet-provider'))` + sets `WalletReadyContext` once mounted.
- `WalletReadyContext` in `src/lib/web3/wallet-ready-context.ts` — boolean signal that hooks can safely run.

## Chain Config

- `src/lib/web3/chains.ts` — single source of truth. Reads `VITE_CHAIN_ID` (default 31337 = Anvil).
- `src/lib/web3/wagmi-config.ts` — wagmi config built from chain.
- `src/lib/web3/contract-address.ts` — narrows the typegen-generated `addresses.ts` registry lookup by chain.
- `src/lib/web3/rpc-transport.ts` — resolves a transport per chain: `VITE_RPC_URL_<chainId>` first, the chain's built-in public endpoint as last-resort fallback. See "RPC endpoint secrecy" below before touching this.

## RPC endpoint secrecy

`VITE_RPC_URL_<chainId>` (consumed by `src/lib/web3/rpc-transport.ts`) is deliberately a `VITE_*` var: RPC calls happen client-side today, so the endpoint is browser-exposed by construction and that's fine for a public/free-tier endpoint.

**If server-side chain access is ever added** (a Worker route reading the chain directly, not through the browser), that endpoint becomes a Worker secret (`wrangler secret put`), never a client-visible `VITE_*` variable — getting this wrong leaks a paid endpoint to every visitor.

## When Adding a New Web3 Component

1. Build the placeholder first (`thing.tsx`) — no wagmi imports, returns skeleton.
2. Build the live version (`thing-live.tsx`) — wagmi hooks + viem calls go here.
3. If the wiring is non-trivial, extract a `useThing` hook into `src/lib/web3/`.
4. Placeholder reads `WalletReadyContext`; if true, lazy-renders `*-live.tsx`.
5. Test: placeholder must render without `WagmiProvider` in scope (see existing `*.test.tsx` files for pattern).

## Anti-patterns

- Importing `wagmi`, `viem`, or `connectkit` directly in a route file or any non-`-live` component.
- Calling `useReadContract` / `useWriteContract` / `useAccount` outside a `*-live.tsx` file.
- Skipping the `WalletReadyContext` gate "because it works in dev" — SSR will fail in prod.
- Reading addresses from `@/contracts/addresses.ts` directly without `getContractAddress()` narrowing.
