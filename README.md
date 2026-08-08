# TanStack Start on Cloudflare — On-chain Edition

*AI agent index: [llms.txt](./llms.txt)*

A production-ready **template** for building full-stack React **dApps** on Cloudflare Workers. It marries a TanStack Start frontend (SSR + file-based routing) and a Hono API on the edge with a complete EVM stack: Foundry contracts, wagmi + viem + ConnectKit on the client, and a typegen pipeline that turns Foundry artifacts into `as const` ABIs and typed contract addresses.

Use it as the starting point for your next on-chain project — clone it, rename it, point it at your own contracts, and start shipping.

[![TanStack Start on Cloudflare](https://img.youtube.com/vi/TWWS_lo4kOA/0.jpg)](https://www.youtube.com/watch?v=TWWS_lo4kOA)

## Using this Template

1. Click **Use this template** on GitHub (or `gh repo create --template`).
2. `pnpm install`.
3. `pnpm run init-project` — prompts for a kebab-case project name, renames `wrangler.jsonc` + `package.json`, and fans out the `*.example` templates into per-env files (`.env` / `.env.staging` / `.env.production`, `.dev.vars` / `.staging.vars` / `.production.vars`, `contracts/.env`). Idempotent — re-runnable, never overwrites filled-in files. The script's "Next steps" output lists every field that still needs a value.
4. Set `VITE_CHAIN_ID` (default `31337` Anvil; use `11155111` for sepolia, `1` for mainnet) and `VITE_WALLETCONNECT_PROJECT_ID` (free at https://cloud.walletconnect.com) in `.env` / `.env.staging` / `.env.production`.
5. Drop your contracts into `contracts/src/`, write a `Deploy<Name>.s.sol` script in `contracts/script/`, and add a deploy command in `package.json` mirroring `contracts:deploy:local` (`testnet` / `mainnet` variants are wrapped with `dotenvx run -f contracts/.env` and read `${TESTNET_RPC_URL}` / `${MAINNET_RPC_URL}` from there).
6. Run `pnpm contracts:dev` — anvil + deploy + typegen in one go.
7. *(Optional)* provision a Neon database, fill `DATABASE_HOST/USERNAME/PASSWORD` in `.dev.vars`, then `pnpm cf-typegen && pnpm db:migrate:dev`.
8. *(Optional, when you're done with the demos)* delete `src/db/client/`, `src/hono/api/clients.ts`, and the example `Counter` flow. Then start modelling your own domain.

See [Quick Start](#quick-start) below for the dev-loop commands.

## Why this template

- **Onchain end-to-end** — Solidity contracts in `contracts/`, deployed via Foundry scripts, ABIs and addresses regenerated into `src/contracts/`, consumed through wagmi hooks. Includes a working `Counter` example wired all the way to a UI button.
- **Wallet UX out of the box** — ConnectKit + wagmi + viem, SSR-safe lazy hydration of the wallet provider, chain whitelist (mainnet / sepolia / anvil) configurable per environment.
- **Edge-first** — single `src/server.ts` entrypoint that routes `/api/*` to Hono and everything else to TanStack Start, all running on Cloudflare Workers.
- **Type-safe end-to-end** — strict TypeScript, Zod at every boundary, Drizzle-inferred DB types, typed Cloudflare `Env` via `wrangler types`, `as const` ABIs and address registries.
- **Local chain orchestrator** — `pnpm contracts:dev` boots anvil, deploys, regenerates bindings, and keeps the chain in the foreground. Ctrl+C cleans up.
- **Deep modules** — domain-oriented layout (`src/db/{domain}/`, `src/hono/api/{name}.ts`, `src/lib/web3/`) with narrow public APIs. See `.claude/rules/deep-modules.md`.
- **Batteries included** — error infrastructure, Neon + Drizzle migrations, Shadcn/UI, TanStack Query SSR hydration, Vitest, Biome, knip, semantic-release, taze.
- **Agent-friendly** — project rules in `.claude/rules/` activate automatically based on the files you touch.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env templates and fill them in
cp .example.vars .dev.vars        # Cloudflare bindings (DB credentials)
cp .env.example .env              # Vite-side env (chain id, WalletConnect)

# Generate Cloudflare Env types
pnpm cf-typegen

# (Optional) run migrations against your dev database
pnpm db:migrate:dev

# In one terminal — boot the local chain, deploy contracts, run typegen
pnpm contracts:dev

# In another terminal — start the dev server
pnpm dev
```

The app runs on http://localhost:3000. API endpoints are served under `/api/*`. The on-chain Counter card on the landing page reads from the locally deployed contract and lets a connected wallet call `increment()`.

`pnpm contracts:dev` boots anvil on `:8545`, waits for it to be ready, deploys `Counter.sol`, regenerates `src/contracts/`, and keeps anvil in the foreground. Ctrl+C stops it cleanly. Requires [Foundry](https://book.getfoundry.sh/) (`anvil`, `forge`) on your PATH.

### Environment variables

```bash
# .dev.vars — Cloudflare Worker bindings (server-side, gitignored)
CLOUDFLARE_ENV=dev
DATABASE_HOST=""           # leave blank to skip DB init
DATABASE_USERNAME=""
DATABASE_PASSWORD=""

# .env — Vite-side, exposed to the browser bundle
VITE_CHAIN_ID=31337                       # 1 = mainnet, 11155111 = sepolia, 31337 = anvil
VITE_WALLETCONNECT_PROJECT_ID=""          # https://cloud.walletconnect.com
```

The DB is only initialised when the database secrets are set. Leave them blank and the template runs fully on-chain without a Postgres instance: liveness, chain-only pages, and any route that doesn't declare a database dependency all serve traffic normally — only DB-backed routes (e.g. `/api/clients`) respond with 503 until you configure Neon. See *Custom Server Entry* below.

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Dev server on port 3000 (Vite + Cloudflare plugin) |
| `pnpm build` | Production build (runs `contracts:build` + `contracts:typegen` first) |
| `pnpm serve` | Preview the production build locally |
| `pnpm deploy` | Build and deploy to Cloudflare Workers |
| `pnpm cf-typegen` | Generate `Env` types from `wrangler.jsonc` |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Vitest |
| `pnpm types` | `tsc --noEmit` type-check |
| `pnpm lint` / `pnpm lint:fix` | Biome check / auto-fix |
| `pnpm knip` | Detect unused files, deps, and exports |
| `pnpm db:generate:{dev,staging,production}` | Generate Drizzle migrations for each env |
| `pnpm db:migrate:{dev,staging,production}` | Apply migrations to each env |
| `pnpm db:pull:{dev,staging,production}` | Pull schema from existing DB |
| `pnpm db:studio` | Open Drizzle Studio against dev |
| `pnpm db:seed:{dev,staging,production}` | Run `scripts/seed.ts` against each env |
| `pnpm deps` / `pnpm deps:update` | Check / apply minor+patch dependency updates via taze |
| `pnpm deps:major` / `pnpm deps:major:update` | Check / apply major dependency updates via taze (review breaking changes first) |
| `pnpm majors:report` | Open/update the tracked "Available major dependency upgrades" issue (also runs weekly via `majors-report.yml`) |
| `pnpm release` | semantic-release |
| `pnpm contracts:build` / `pnpm contracts:test` | `forge build` / `forge test` |
| `pnpm contracts:typegen` | Generate `as const` ABI + typed addresses into `src/contracts/` |
| `pnpm contracts:deploy:{local,testnet,mainnet}` | Run `DeployCounter.s.sol` against the matching `[rpc_endpoints]` profile |
| `pnpm contracts:dev` | Start anvil on `:8545`, deploy contracts, run typegen, keep anvil in the foreground |

All `db:*` scripts load secrets via `@dotenvx/dotenvx` from `.dev.vars`, `.staging.vars`, or `.production.vars`.

## Project Structure

```
contracts/                     # Self-contained Foundry project
├── foundry.toml               # profile, fs_permissions, [rpc_endpoints]
├── remappings.txt             # forge-std/, @openzeppelin/contracts/
├── src/Counter.sol            # example contract
├── test/Counter.t.sol         # forge test
├── script/
│   ├── DeploymentRegistry.sol # library: read/merge/write registry JSON
│   └── DeployCounter.s.sol    # forge script
└── deployments/{chainId}.json # auto-written registry, format: {"Counter":"0x.."}

scripts/
├── contracts-typegen/         # Foundry artifacts → src/contracts/ bindings
├── contracts-dev/             # anvil + deploy + typegen orchestrator
└── seed.ts                    # DB seed entrypoint

src/
├── server.ts                  # CF Workers entry — routes /api/* → Hono, rest → TanStack Start
├── router.tsx                 # TanStack Router instance (wraps tree in Web3Provider)
├── routes/                    # File-based routes (auto-generates routeTree.gen.ts)
│   ├── __root.tsx
│   ├── index.tsx              # Landing page with on-chain Counter card
│   └── clients.tsx
├── components/
│   ├── ui/                    # Shadcn primitives (do not edit manually)
│   ├── landing/               # Landing page sections
│   ├── navigation/            # App navigation (includes wallet connect button)
│   ├── theme/                 # Theme provider / toggle
│   ├── clients/               # CRUD example
│   └── web3/                  # ConnectButton, CounterCard (SSR-safe lazy live shells)
├── contracts/                 # Generated — do not edit
│   ├── abis/Counter.ts        # `as const` ABI
│   ├── addresses.ts           # `as const` chainId → name → address
│   └── README.md
├── core/
│   ├── errors.ts              # AppError, Result<T>, isUniqueViolation
│   ├── functions/             # TanStack server functions
│   └── middleware/            # Server-function middleware
├── db/
│   ├── setup.ts               # initDatabase / getDb singleton
│   ├── index.ts               # Public DB module API
│   ├── schema.ts              # Re-exports all tables
│   ├── migrations/{dev,staging,production}/ # Per-env Drizzle migrations
│   ├── client/                # Domain: clients (table, queries, zod schema)
│   └── health/                # Domain: health check query
├── hono/
│   ├── factory.ts             # Typed Hono factory with CF Bindings
│   ├── api.ts                 # Router mounting /api/health, /api/clients
│   └── api/{health,clients}.ts
├── integrations/
│   ├── tanstack-query/        # QueryClient + SSR provider
│   └── web3/                  # Web3Provider (lazy WagmiProvider + ConnectKit)
├── lib/
│   ├── utils.ts
│   └── web3/                  # chains, wagmi-config, contract-address, useCounter, wallet-ready-context
└── styles.css                 # Tailwind v4 entry
```

Path alias `@/*` resolves to `src/*`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (Router + Query SSR) |
| UI | React 19, Shadcn/UI (new-york, Zinc), Tailwind CSS v4, Lucide |
| API | Hono on Cloudflare Workers |
| Runtime | Cloudflare Workers (`nodejs_compat`) |
| Wallet / Web3 | wagmi 2 + viem 2 + ConnectKit |
| Smart contracts | Solidity 0.8.28, Foundry, Soldeer (OpenZeppelin, forge-std) |
| Database | Neon Postgres + Drizzle ORM (`neon-http`) |
| Validation | Zod 4 |
| Forms | TanStack Form |
| Language | TypeScript (strict) |
| Linter | Biome 2 |
| Testing | Vitest + Testing Library + jsdom |
| Dead-code detection | knip |
| Release | semantic-release |
| Package manager | pnpm 10 |

## Dependency Policy

Two majors are deliberately frozen. `pnpm majors:report` (see [Scripts](#scripts)) tracks both until either decision below changes.

### wagmi 3 — staying on wagmi 2 for now

wagmi 3.7.6 is out, but this template's wallet-connection layer is ConnectKit, and ConnectKit's only released version (`1.9.2`, published 2026-03-24) peer-pins `wagmi` to `2.x` — installing wagmi 3 alongside it breaks at package resolution, not just at the type level. ConnectKit's maintainers have an upgrade in progress ([family/connectkit#514](https://github.com/family/connectkit/pull/514), "ConnectKit 2.0: wagmi v3 upgrade with per-connector entry points", opened 2026-07-26), but it is still open and unmerged — manual QA is outstanding and it's blocked on an upstream `@aave/account` dependency needing its own release before ConnectKit 2.0 can ship.

**Decision: stay on wagmi 2 + ConnectKit 1.9.2.** Revisit once ConnectKit publishes a release with a `wagmi: 3.x` peer dependency. Migrating wagmi alone would mean dropping ConnectKit for a different connector UI — a much larger change than this freeze is worth pre-empting.

### vite 8 — pin stays, blocked on `@vitejs/plugin-react`

`vite` (`7.1.2`) is the manifest's only exact dependency pin, with vite `8.2.1` out. Verified against the packages actually in this build:

| Package | Current | vite 8 peer support |
|---|---|---|
| `@cloudflare/vite-plugin` | `^1.50.0` | yes — `^6.1.0 \|\| ^7.0.0 \|\| ^8.0.0` |
| `@tanstack/react-start` | `^1.168.34` | yes — `>=7.0.0` (no upper bound) |
| `vite-tsconfig-paths` | `^5.1.4` | yes — `*` |
| `@tailwindcss/vite` | `^4.3.3` | yes — `^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` |
| `vitest` | `^4.1.10` | yes — `^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` |
| `@vitejs/plugin-react` | `^4.7.0` | **no** — `^4.2.0 \|\| ^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0`, tops out at vite 7 |

Every load-bearing plugin and the framework itself already support vite 8, except `@vitejs/plugin-react`: its current major (`4.x`) has no vite 8 support. The first line that adds it is `@vitejs/plugin-react@5.x` — itself a separate major upgrade (its own entry in `pnpm majors:report`'s output).

**Decision: keep the pin.** Lifting it cleanly would require bumping `@vitejs/plugin-react` across a major too, which is a second, unscoped migration — out of bounds for what should be a one-line pin lift. Reason recorded here and next to the pin in `vite.config.ts`; revisit when `@vitejs/plugin-react` 5.x is picked up.

## Web3 / EVM Integration

The on-chain stack is structured as deep modules, with the wagmi/ConnectKit provider isolated behind a tiny SSR-safe shell so the worker bundle stays lean and hydration is always correct.

### Wallet provider (SSR-safe lazy hydration)

`src/integrations/web3/root-provider.tsx` mounts a placeholder `QueryClientProvider` during SSR and the first client render, then lazy-loads the real `WalletProvider` (WagmiProvider + ConnectKitProvider) once `useEffect` confirms we're on the client. Components that need wallet APIs gate themselves on a `WalletReadyContext` flag, falling back to a placeholder until the provider is up.

```tsx
// src/integrations/web3/root-provider.tsx
const WalletProvider = lazy(() => import("./wallet-provider"));

export function Web3Provider({ children, queryClient }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const queryShell = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  if (!mounted) return queryShell;

  return (
    <Suspense fallback={queryShell}>
      <WalletProvider queryClient={queryClient}>{children}</WalletProvider>
    </Suspense>
  );
}
```

`Web3Provider` is wired into the router in `src/router.tsx` via the `Wrap` option, so every route gets it for free.

### Chains and wagmi config

Supported chains live in a single registry (`src/lib/web3/chains.ts`). The active chain comes from `VITE_CHAIN_ID` and feeds both wagmi transports and contract reads.

```ts
// src/lib/web3/chains.ts
const SUPPORTED: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  31337: anvil,
};

export const activeChain: Chain = resolveChain(Number(import.meta.env.VITE_CHAIN_ID ?? 31337));
```

Add a chain by extending `SUPPORTED`. `createWagmiConfig` in `src/lib/web3/wagmi-config.ts` builds a transport per supported chain via `createRpcTransport` and pulls the WalletConnect project id from `VITE_WALLETCONNECT_PROJECT_ID`.

### RPC failover (`src/lib/web3/rpc-transport.ts`)

Every chain gets a resolver-built transport instead of a bare `http()` call, so a single provider outage doesn't take the app down:

- `VITE_RPC_URL_<chainId>` (e.g. `VITE_RPC_URL_1`, `VITE_RPC_URL_31337`) overrides the endpoint for that chain — tried first.
- The chain's built-in public endpoint (from `viem/chains`) is always the last-resort fallback, so an unconfigured fork still works with no setup.
- With more than one candidate, viem's `fallback()` wraps them in that order; with exactly one, it's a plain `http()`.

These are `VITE_*` vars — browser-exposed by construction. **If server-side chain access is ever added, that endpoint must become a Worker secret (`wrangler secret put`), never a client-visible variable** — see `.claude/rules/frontend/web3-ssr.md`.

### Generated contract bindings (`src/contracts/`)

`pnpm contracts:typegen` reads Foundry artifacts and the per-chain deployment registries, then writes:

- `src/contracts/abis/<Name>.ts` — `as const` ABI for every user contract in `contracts/src/`.
- `src/contracts/addresses.ts` — `as const` mapping `chainId → name → address`, sourced from `contracts/deployments/{chainId}.json`.

Both files are gitignored — never edit them by hand. `pnpm build` runs `contracts:build` and `contracts:typegen` automatically via `prebuild`, so the bundle always ships fresh bindings.

### Typed contract hooks

A typical wagmi hook over the generated bindings — read + write + transaction watcher in one place:

```ts
// src/lib/web3/use-counter.ts
export function useCounter(): UseCounterResult {
  const address = getContractAddress(activeChain.id, "Counter");
  const { isConnected } = useAccount();
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const { data, isLoading, refetch } = useReadContract({
    abi: counterAbi,
    address,
    functionName: "get",
    chainId: activeChain.id,
  });

  useEffect(() => { if (isConfirmed) refetch(); }, [isConfirmed, refetch]);

  const increment = () => {
    if (!address) return;
    writeContract({ abi: counterAbi, address, functionName: "increment", chainId: activeChain.id });
  };

  return { value: data, isLoading, hasAddress: Boolean(address), isConnected, isInFlight: isWritePending || isConfirming, increment };
}
```

UI components (`src/components/web3/connect-button.tsx`, `counter-card.tsx`) use the same lazy-shell pattern as `Web3Provider`: a static placeholder for SSR, a `lazy()` "live" component once `WalletReadyContext` flips. This keeps the wallet runtime out of the SSR HTML and avoids hydration mismatches.

### Smart contracts (Foundry)

The `contracts/` folder is a self-contained Foundry project. Soldeer manages dependencies (OpenZeppelin, forge-std), `pnpm contracts:typegen` generates `as const` ABIs + typed addresses into `src/contracts/`, and Solidity deploy scripts in `contracts/script/` write deployed addresses to `contracts/deployments/{chainId}.json`.

#### Deploy

RPC endpoints come from `[rpc_endpoints]` in `foundry.toml`:

```toml
[rpc_endpoints]
local = "http://127.0.0.1:8545"
testnet = "${TESTNET_RPC_URL}"
mainnet = "${MAINNET_RPC_URL}"
```

Set `TESTNET_RPC_URL` / `MAINNET_RPC_URL` in your shell or `.dev.vars` before deploying. The `local` profile points at anvil and is the smoke-test path.

```bash
# Local — preferred: orchestrated end-to-end
pnpm contracts:dev
# anvil :8545 → DeployCounter → typegen, anvil stays in foreground

# Local — manual
anvil --silent &
pnpm contracts:deploy:local
# → contracts/deployments/31337.json now contains {"Counter":"0x.."}
pnpm contracts:typegen

# Testnet / mainnet — supply your signer
TESTNET_RPC_URL=https://... pnpm contracts:deploy:testnet --private-key $DEPLOYER_PRIVATE_KEY
MAINNET_RPC_URL=https://... pnpm contracts:deploy:mainnet --private-key $DEPLOYER_PRIVATE_KEY
```

Any flags after the script name (`--private-key`, `--account <keystore>`, `--ledger`, `--verify`, …) are forwarded to `forge script`. The local script bakes in anvil's well-known dev key — never use it on a real chain.

The deploy script delegates to `DeploymentRegistry.record(path, name, address)`, which:
- reads `contracts/deployments/{chainId}.json` if it exists,
- preserves entries for other contracts,
- overwrites the entry for the redeployed contract,
- creates the parent directory if missing.

Run `pnpm contracts:typegen` after a deploy to refresh `src/contracts/addresses.ts` with the new addresses (or just use `pnpm contracts:dev`, which does it for you).

## Cloudflare Integration

### `wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tanstack-start-app",
  "compatibility_date": "2026-05-26",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./src/server.ts",
  "vars": {
    "CLOUDFLARE_ENV": "dev"
  }
}
```

- Use `wrangler.jsonc` (not `.toml`) for configuration.
- `vars` is committed — only put **non-secret** config here. DB credentials and any other secrets must be set via `wrangler secret put` (see *Secrets & Environments* below).
- Prefer `custom_domain: true` over routes with `zone_name` — see `.claude/rules/cloudflare-deployment.md`.
- Run `pnpm cf-typegen` whenever you add bindings to regenerate `worker-configuration.d.ts`.

### Custom Server Entry (`src/server.ts`)

One fetch handler owns the entire worker. It delegates the DB-secrets/routing decision to `admitRequest()` (`src/core/request-admission.ts`) and dispatches to Hono or TanStack Start.

```ts
import handler from "@tanstack/react-start/server-entry";
import { admitRequest } from "@/core/request-admission";
import { apiHono } from "@/hono/api";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const admission = admitRequest(request, env);
    if (!admission.admitted) return admission.response;

    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return apiHono.fetch(request, env, ctx);
    }

    return handler.fetch(request, { context: { fromFetch: true } });
  },
};
```

`admitRequest()` is a deep module: it hides secret inspection, the list of database-dependent routes, the 503 error shape, and the boot-failure log behind one decision. Routes declare whether they need a database by being listed there — **the default is that they don't**, so with no DB secrets configured only DB-backed routes (e.g. `/api/clients`, `/api/health/ready`) return 503; liveness and all server-rendered pages behave normally. See `src/core/request-admission.test.ts` for the full behavior matrix.

You can extend this handler with Queue consumers, scheduled events, or Durable Object bindings as your project grows.

### Secrets & Environments

**Local dev** — worker secrets live in `.dev.vars` (gitignored, copied from `.example.vars`):

```bash
# .dev.vars
CLOUDFLARE_ENV=dev
DATABASE_HOST="ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_USERNAME="neondb_owner"
DATABASE_PASSWORD="npg_xxx"
```

**Staging / production** — never commit DB credentials to `wrangler.jsonc` `vars` (plaintext, visible in dashboard). Set them as Cloudflare *secrets* via `wrangler secret put`, per environment:

```bash
# Run once per env to bootstrap each secret. Wrangler prompts for the value.
wrangler secret put DATABASE_HOST     --env staging
wrangler secret put DATABASE_USERNAME --env staging
wrangler secret put DATABASE_PASSWORD --env staging

wrangler secret put DATABASE_HOST     --env production
wrangler secret put DATABASE_USERNAME --env production
wrangler secret put DATABASE_PASSWORD --env production
```

Equivalently via Dashboard: *Workers & Pages → your worker → Settings → Variables and Secrets → Add → type **Secret***. Never use type *Plaintext* for credentials.

Vite-side variables (`VITE_*`) belong in `.env` / `.env.<mode>` because they're inlined into the browser bundle — they're public by construction, so never put secrets there.

## Database (Neon + Drizzle)

The DB layer is **optional** — leave `DATABASE_HOST` empty and the worker skips initialization. When you do need persistence, the DB module follows the **deep-modules** pattern: every domain has its own folder with a narrow public API.

```
src/db/client/
├── table.ts      # pgTable definition
├── schema.ts     # Zod schemas for input/output
├── queries.ts    # getClients, getClient, createClient, updateClient, deleteClient
└── index.ts      # Public re-exports
```

- `initDatabase()` is called once per Worker isolate, from `admitRequest()` (`src/core/request-admission.ts`) via `src/server.ts`.
- Every query calls `getDb()` — never pass the DB as a parameter.
- Inputs are validated with Zod at the API boundary; mutations use `.returning()` to avoid extra round trips.

### Migration Workflow

Each environment has its own Drizzle config (`drizzle-{env}.config.ts`) and migration directory (`src/db/migrations/{env}/`).

```bash
# 1. Edit your table definition in src/db/{domain}/table.ts
# 2. Generate a migration for the target environment
pnpm db:generate:dev
pnpm db:generate:staging
pnpm db:generate:production

# 3. Apply it
pnpm db:migrate:dev
pnpm db:migrate:staging
pnpm db:migrate:production

# Pull schema from an existing database
pnpm db:pull:dev

# Seed sample data
pnpm db:seed:dev

# Inspect data
pnpm db:studio
```

Per-env configs (`drizzle-dev.config.ts`, `drizzle-staging.config.ts`, `drizzle-production.config.ts`) all point at `src/db/schema.ts` but write migrations to separate directories, allowing independent migration tracking per environment.

#### First-time bootstrap for staging/production

Only `src/db/migrations/dev/` is committed today — `staging` and `production` have no migration history yet, so the first deploy to either needs one extra step before it behaves like `dev`:

1. Provision a real Neon database for that environment and fill `DATABASE_HOST`/`DATABASE_USERNAME`/`DATABASE_PASSWORD` in `.staging.vars` / `.production.vars`.
2. Run `pnpm db:generate:staging` / `pnpm db:generate:production` once — this reads `src/db/schema.ts` against an empty migration history and writes the initial `0000_*.sql`, creating `src/db/migrations/{staging,production}/`.
3. From then on, `pnpm db:migrate:{env}` (or `pnpm deploy:production`, which now runs it automatically — see below) applies whatever is pending.

**Gotcha:** `drizzle-kit`'s `generate`/`migrate` commands in this repo auto-select the `@neondatabase/serverless` driver (it's already a dependency), which only speaks Neon's websocket protocol. A generic local/Docker Postgres will fail with `can only connect to remote Neon/Vercel Postgres/Supabase instances through a websocket` — bootstrapping staging/production genuinely requires a reachable Neon endpoint, not a local stand-in.

#### Production deploy applies pending migrations first

`pnpm deploy:production` sequences `db:migrate:production` → `build:production` → `wrangler deploy`, so new code can never reach traffic against an un-migrated schema. Ordering is enforced by the command, not by memory. Deployment is still a manual command a person runs — this doesn't add a pipeline, a build-service connection, or an approval gate.

## REST API with Hono

All `/api/*` routes are handled by Hono. Endpoints live in `src/hono/api/` and are mounted in `src/hono/api.ts`.

### Example: `GET /api/clients`

```ts
// src/hono/api/clients.ts
import { isUniqueViolation } from "@/core/errors";
import {
  ClientCreateRequestSchema,
  createClient,
  getClients,
  PaginationRequestSchema,
} from "@/db/client";
import { createHono } from "@/hono/factory";

const clientsEndpoint = createHono();

clientsEndpoint.get("/", async (c) => {
  const parsed = PaginationRequestSchema.safeParse({
    limit: c.req.query("limit"),
    offset: c.req.query("offset"),
  });
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
  return c.json(await getClients(parsed.data));
});

clientsEndpoint.post("/", async (c) => {
  const parsed = ClientCreateRequestSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  try {
    return c.json(await createClient(parsed.data), 201);
  } catch (err) {
    if (isUniqueViolation(err)) return c.json({ error: "Email already exists" }, 409);
    throw err;
  }
});

export default clientsEndpoint;
```

### Mounting a New Endpoint

```ts
// src/hono/api.ts
import { createHono } from "./factory";
import clientsEndpoint from "@/hono/api/clients";
import healthEndpoint from "@/hono/api/health";

export const apiHono = createHono().basePath("/api");

apiHono.route("/health", healthEndpoint);
apiHono.route("/clients", clientsEndpoint);
```

The `createHono()` factory types `Bindings: Env` so `c.env` is fully typed against your Cloudflare configuration.

### Hono vs TanStack Server Functions

| Use Hono REST APIs | Use TanStack Server Functions |
|--------------------|-------------------------------|
| Public APIs for external clients | Server logic called from React |
| Webhooks | Form submissions |
| Third-party integrations | Data fetching for UI |
| Anything with a URL contract | Type-safe client↔server calls |

## Error Handling

Error infrastructure lives in `src/core/errors.ts`:

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public status: number = 500,
    public field?: string,
  ) { super(message); this.name = "AppError"; }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function isUniqueViolation(error: unknown): boolean { /* ... */ }
```

- Use `AppError` for known, recoverable failures.
- Use `Result<T>` when a caller needs to branch on success/failure without throwing.
- Check `error.cause.code` (not `error.message`) when inspecting Drizzle errors — the raw Postgres code lives on `cause`. `isUniqueViolation()` is the idiomatic way to detect `23505` conflicts.
- Unexpected errors propagate to the Hono global `onError` handler.

See `.claude/rules/error-handling.md` for the full convention.

## Server Functions & TanStack Query

Server functions run exclusively on the server with full type safety across the boundary:

```ts
// src/core/middleware/example-middleware.ts
export const exampleMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => next({ context: { data: "Context from middleware" } }),
);

// src/core/functions/example-functions.ts
const ExampleInputSchema = z.object({ exampleKey: z.string().min(1) });

export const exampleFunction = createServerFn()
  .middleware([exampleMiddleware])
  .inputValidator((data: z.infer<typeof ExampleInputSchema>) =>
    ExampleInputSchema.parse(data),
  )
  .handler(async (ctx) => {
    // ctx.data — validated input
    // ctx.context — middleware context
    return "Server response";
  });
```

Call them from components via TanStack Query:

```tsx
import { useMutation } from "@tanstack/react-query";
import { exampleFunction } from "@/core/functions/example-functions";

function MyComponent() {
  const mutation = useMutation({ mutationFn: exampleFunction });
  return (
    <button
      onClick={() => mutation.mutate({ exampleKey: "Hello Server!" })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "Loading..." : "Call Server Function"}
    </button>
  );
}
```

SSR hydration is wired up in `src/integrations/tanstack-query/` — loaders can prefetch into the query cache and it streams down with the HTML.

## Routing & UI

- **File-based routing** — add files to `src/routes/`, the tree auto-generates to `routeTree.gen.ts` on dev/build. Never edit the generated file.
- **Root layout** — `src/routes/__root.tsx`.
- **Router wrapper** — `src/router.tsx` wraps the tree in `Web3Provider`, so wallet hooks work in any route.
- **Shadcn/UI** — add components with `pnpx shadcn@latest add <component>`. Configured via `components.json` (new-york style, Zinc base, CSS variables).
- **Tailwind v4** — configured through the `@tailwindcss/vite` plugin, no separate config file. Styles entrypoint: `src/styles.css`.

## Testing

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
pnpm test:coverage  # v8 coverage
```

- Tests live next to source as `*.test.ts` / `*.test.tsx`.
- Vitest globals are enabled — no need to import `describe` / `it` / `expect`.
- Route files (`src/routes/**`) are excluded from test discovery.
- Test at module boundaries (exported queries, HTTP requests, user interactions, wagmi hook outputs), not internals. See `.claude/rules/deep-modules.md`.

## Agent Rules & Design Docs

This template is set up for agent-assisted development:

- `.claude/CLAUDE.md` — project-wide instructions.
- `.claude/rules/` — topic rules (`general.md`, `deep-modules.md`, `error-handling.md`, `atomic-imports.md`, `cloudflare-deployment.md`, plus stack-specific rules under `db/`, `api/`, and `frontend/`) that activate automatically based on the files being edited.
- `AGENTS.md` — agent workflow guide.
- `/docs` — single source of truth for business requirements / design docs.

## Learn More

- **[TanStack Start](https://tanstack.com/start)** — full-stack React framework
- **[TanStack Router](https://tanstack.com/router)** — type-safe routing
- **[TanStack Query](https://tanstack.com/query)** — server state management
- **[Hono](https://hono.dev/)** — fast web framework for APIs
- **[wagmi](https://wagmi.sh/)** — React Hooks for Ethereum
- **[viem](https://viem.sh/)** — TypeScript interface for Ethereum
- **[ConnectKit](https://docs.family.co/connectkit)** — wallet connection UI
- **[Foundry](https://book.getfoundry.sh/)** — Solidity dev toolchain
- **[Soldeer](https://soldeer.xyz/)** — Solidity package manager
- **[Drizzle ORM](https://orm.drizzle.team/)** — type-safe SQL
- **[Neon](https://neon.tech/)** — serverless Postgres
- **[Cloudflare Workers](https://workers.cloudflare.com/)** — edge computing platform
- **[Shadcn/UI](https://ui.shadcn.com/)** — component library
- **[Tailwind CSS](https://tailwindcss.com/)** — utility-first CSS
- **[Biome](https://biomejs.dev/)** — fast formatter and linter

## License

Open source under the [MIT License](LICENSE).
