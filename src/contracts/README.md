# Generated contract bindings

This directory is regenerated from Foundry artifacts and the deployment registry.
Do **not** edit files here by hand — they are gitignored.

## Layout

- `abis/<ContractName>.ts` — `as const` ABI exports for each user contract in `contracts/src/`
- `addresses.ts` — `as const` mapping of `chainId → contractName → address`, sourced from `contracts/deployments/{chainId}.json`

## Regenerate

```bash
pnpm contracts:build      # produce contracts/out/ artifacts
pnpm contracts:typegen    # write src/contracts/ bindings
```

## Usage

```ts
import { counterAbi } from "@/contracts/abis/Counter";
import { contractAddresses } from "@/contracts/addresses";

const address = contractAddresses["31337"].Counter;
```
