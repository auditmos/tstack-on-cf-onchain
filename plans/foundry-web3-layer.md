# Plan: Foundry + Web3 Layer for tstack-on-cf-onchain

> Source PRD: #1

## Architectural decisions

Durable decisions that apply across all phases:

- **Structure**: Flat (no monorepo) — `contracts/` folder at project root, single `package.json`
- **Foundry package management**: soldeer (not git submodules) for OZ + forge-std
- **ABI type generation**: Custom TypeScript script producing `as const` exports — works with both viem and wagmi via ABIType, no additional codegen tools
- **Deployment registry**: `contracts/deployments/{chainId}.json` — deploy scripts write addresses, typegen reads them
- **Wallet connectivity**: wagmi + ConnectKit (free, Tailwind-compatible)
- **Chain config**: EVM-agnostic — single source of truth in foundry.toml (Solidity side) and wagmi config (TS side)
- **Local dev**: anvil on port 8545, orchestrated via `pnpm contracts:dev`
- **Generated files**: `src/contracts/` is gitignored — always regenerated from artifacts

---

## Phase 1: Foundry scaffold with soldeer + Counter.sol

**GitHub issue**: #2
**User stories**: 1, 2, 3, 4, 5
**Blocked by**: None

### What to build

Set up the Foundry project inside `contracts/` with soldeer for dependencies (OpenZeppelin, forge-std). Include Counter.sol with increment/get, a Forge test, and pnpm scripts delegating to forge.

### Acceptance criteria

- [ ] `contracts/` folder with foundry.toml, remappings, soldeer config
- [ ] OZ + forge-std installed via soldeer
- [ ] `pnpm contracts:build` compiles Counter.sol
- [ ] `pnpm contracts:test` passes Counter.t.sol
- [ ] Fresh clone → `soldeer install` → imports resolve
- [ ] `pnpm types` still passes

---

## Phase 2: ABI typegen pipeline

**GitHub issue**: #3
**User stories**: 6, 7, 8, 20
**Blocked by**: Phase 1

### What to build

TypeScript script reading Foundry artifacts (`contracts/out/`) and deployment registry JSONs, generating `as const` ABI exports and typed address mappings to `src/contracts/`. Exposed as `pnpm contracts:typegen`.

### Acceptance criteria

- [ ] `pnpm contracts:typegen` outputs `src/contracts/abis/*.ts` with `as const` ABI
- [ ] Outputs `src/contracts/addresses.ts` with chain→address mapping
- [ ] Full autocomplete in viem and wagmi from generated types
- [ ] `pnpm types` passes after typegen
- [ ] `src/contracts/` gitignored (except README)
- [ ] Handles empty deployments gracefully

---

## Phase 3: Deploy scripts + deployment registry

**GitHub issue**: #4
**User stories**: 9, 10, 11, 17, 18
**Blocked by**: Phase 1

### What to build

Solidity deploy scripts for Counter.sol. After deploy, addresses written to `contracts/deployments/{chainId}.json`. foundry.toml defines RPC profiles for local, testnet, mainnet. Exposed as `pnpm contracts:deploy:testnet` and `pnpm contracts:deploy:mainnet`.

### Acceptance criteria

- [ ] Deploy script deploys Counter + writes to registry JSON
- [ ] `pnpm contracts:deploy:testnet` targets configured testnet
- [ ] `pnpm contracts:deploy:mainnet` targets configured mainnet
- [ ] foundry.toml has named profiles with RPC placeholders
- [ ] Registry merges entries on redeploy
- [ ] Anvil deploy (31337) works as smoke test

---

## Phase 4: Local dev orchestrator

**GitHub issue**: #5
**User stories**: 12, 19
**Blocked by**: Phase 2, Phase 3

### What to build

`pnpm contracts:dev` — starts anvil, waits for readiness, deploys contracts, runs typegen, keeps anvil in foreground. Clean shutdown on Ctrl+C.

### Acceptance criteria

- [ ] Starts anvil on port 8545
- [ ] Waits for readiness before deploy
- [ ] Deploys contracts to local chain
- [ ] Runs typegen after deployment
- [ ] Anvil stays in foreground with logs
- [ ] Ctrl+C cleanly stops anvil
- [ ] `src/contracts/` has valid types + local addresses after run

---

## Phase 5: Wagmi + ConnectKit integration

**GitHub issue**: #6
**User stories**: 13, 14, 15
**Blocked by**: None (parallel with Phases 1-4)

### What to build

Wagmi provider with chain config + transports, ConnectKit provider, and a connect button component styled with Tailwind/Shadcn. Centralized chain configuration.

### Acceptance criteria

- [ ] Wagmi + ConnectKit providers wrapping the app
- [ ] Connect button renders, follows Shadcn conventions
- [ ] Wallet modal opens on click
- [ ] MetaMask connects to local anvil chain
- [ ] Chain config in one place
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm types` passes

---

## Phase 6: Counter end-to-end in UI

**GitHub issue**: #7
**User stories**: 16
**Blocked by**: Phase 4, Phase 5

### What to build

Capstone: UI reads Counter value from chain, "Increment" button sends tx, value updates after confirmation. Demonstrates the complete flow: Solidity → test → deploy → typegen → wagmi typed hooks → UI.

### Acceptance criteria

- [ ] UI displays current Counter value
- [ ] Increment button sends write tx via wagmi
- [ ] Value updates after tx confirmation
- [ ] Works on local anvil via `pnpm contracts:dev`
- [ ] Uses generated `as const` ABI (full type safety)
- [ ] Requires wallet connection before increment
