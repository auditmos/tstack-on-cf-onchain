# tstack-on-cf-onchain

TanStack Start frontend + Hono API on Cloudflare Workers, with Solidity smart contracts (Foundry) and wagmi/viem on the client.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (Router + Query + Form, SSR) |
| API | Hono on Cloudflare Workers |
| Database | Neon Postgres + Drizzle ORM |
| Validation | Zod 4 |
| Styling | Tailwind v4, shadcn/ui (new-york, Zinc, oklch CSS vars) |
| Web3 | wagmi + viem + ConnectKit |
| Smart contracts | Solidity (Foundry + soldeer) |
| Language | TypeScript (strict) |
| Tooling | Biome (lint), Vitest + Testing Library (test), Vite + `@cloudflare/vite-plugin` (build), pnpm 10 |

## Project Structure

- `src/routes/` — file-based routes (auto-generates `routeTree.gen.ts`)
- `src/components/` — reusable React components
- `src/components/ui/` — Shadcn primitives (do not edit manually)
- `src/contracts/` — generated TS ABIs + deployed addresses (output of `pnpm contracts:typegen`)
- `src/core/` — server functions, middleware, `errors.ts` (`AppError`, `Result<T>`, `isUniqueViolation`)
- `src/db/` — Drizzle per-domain modules (`{domain}/{table,schema,queries,index}.ts`) and migrations
- `src/hono/` — Hono API routes and factory
- `src/integrations/tanstack-query/` — query client setup and providers
- `src/integrations/web3/` — wagmi/ConnectKit provider stack (lazy-loaded)
- `src/lib/` — shared utilities, including `web3/` (wagmi config, chains, contract-address narrowing)
- `src/utils/` — small standalone helpers (e.g. `seo.ts`)
- `src/server.ts` — Cloudflare Workers entry (routes `/api/*` → Hono, rest → TanStack)
- `contracts/src/` — Solidity source (Foundry)
- `contracts/test/` — Forge tests
- `contracts/script/` — Foundry deploy scripts (+ `DeploymentRegistry.sol`)
- `contracts/deployments/` — `<chainId>.json` registry of deployed addresses
- `contracts/dependencies/` — soldeer-managed deps (gitignored)
- `.claude/rules/` — domain-specific rules referenced by `<important if>` blocks below
- Path alias: `@/*` → `src/*`

## Architecture

Prefer **deep modules** (Ousterhout): small interface hiding large implementation. Test at module boundaries, not internals. Module boundaries used in this repo:

| Layer | Boundary | Interface | Hides |
|-------|----------|-----------|-------|
| DB domain | `src/db/{domain}/index.ts` | exported queries + types | tables, query builders, pagination |
| API endpoint | `src/hono/api/{name}.ts` | HTTP routes | validation, error mapping, business rules |
| Component | `src/components/{feature}/` | props + named export | state, mutations, UI |
| Server fn | `src/core/functions/` | `createServerFn` signature | auth, fetching, transforms |

Domain rules live in `.claude/rules/`. They are loaded via the `<important if>` blocks below (Claude Code does not honor `paths:` frontmatter — that is a Cursor-only convention). Read the full rule files when the matching condition fires.

Max **500 lines per source file** — split if exceeding.

---

<important if="you need to run a build/test/lint/db/contract command, or you are unsure which script implements a task">
All commands run via `pnpm`. Pick the smallest set you need — do not run everything by default.

**Build / dev / deploy**
- `pnpm dev` — dev server on port 3000 (also auto-regenerates `routeTree.gen.ts`)
- `pnpm build` — production build (runs `contracts:build` + `contracts:typegen` first via `prebuild`)
- `pnpm serve` — preview production build
- `pnpm deploy` — build + `wrangler deploy` (top-level env, no `--mode`)
- `pnpm build:{staging,production}` — `cross-env CLOUDFLARE_ENV={env} vite build` (the plugin reads `CLOUDFLARE_ENV` to flatten `env.{env}` from `wrangler.jsonc` into `dist/server/wrangler.json`)
- `pnpm deploy:{staging,production}` — `build:{env}` then `wrangler deploy` (no `--env` flag — env is already baked into the built manifest)
- `pnpm cf-typegen` — regenerate `worker-configuration.d.ts` from `wrangler.jsonc`

**Test / type / lint**
- `pnpm types` — `tsc --noEmit`
- `pnpm test` / `test:watch` / `test:coverage`
- `pnpm lint` / `lint:fix` / `lint:ci` (Biome)
- `pnpm knip` — unused files / deps / exports

**Database** (Neon, per-env via `dotenvx` + `.{env}.vars`)
- `pnpm db:generate:{dev,staging,production}` — generate migrations
- `pnpm db:migrate:{dev,staging,production}` — apply migrations
- `pnpm db:pull:{dev,staging,production}` — pull schema from DB
- `pnpm db:seed:{dev,staging,production}` — seed sample data
- `pnpm db:studio` — Drizzle Studio (dev only)

**Contracts** (Foundry, in `contracts/`)
- `pnpm contracts:build` / `contracts:test`
- `pnpm contracts:typegen` — emit TS ABIs/addresses into `src/contracts/`
- `pnpm contracts:dev` — local dev helper
- `pnpm contracts:deploy:{local,testnet,mainnet}` — Foundry deploy scripts

**Misc**
- `pnpx shadcn@latest add <component>` — add Shadcn primitive (writes to `src/components/ui/`)
- `pnpm deps` / `deps:update` / `deps:major` / `deps:major:update` — taze
</important>

<important if="you are about to add or modify an `import` statement, or you just edited code that needs new imports">
Biome's PostToolUse hook auto-removes "unused" imports between sequential edits.

- **Combine import additions with their usage in a single Edit call.**
- If too large for one Edit: add the usage code FIRST, then add the import in a second Edit (now it's "used" and won't be stripped).
- Never add an import in one Edit and its usage in a separate Edit.

Full notes: `@.claude/rules/atomic-imports.md`
</important>

<important if="the user reported a bug, regression, or unexpected behavior">
Bug-fix workflow (do not skip steps):
1. Write a failing test that reproduces the bug — **do not touch implementation yet**
2. Show the failing test and propose a fix — wait for approval
3. Implement the fix — the test should now pass
4. Run `pnpm test` to confirm no regressions
</important>

<important if="you have finished implementing or modifying code">
Before declaring done, run in this order:
1. `pnpm types` — type-check
2. `pnpm test` — run all tests
3. `pnpm lint` — Biome check

For UI/frontend changes, also exercise the feature in the browser (golden path + at least one edge case). If you cannot test the UI yourself, say so explicitly rather than claim success.
</important>

<important if="you are writing or modifying tests">
- Tests live next to source as `*.test.ts` / `*.test.tsx`
- Vitest with globals enabled — no need to import `describe`/`it`/`expect`
- Path alias `@` resolves to `src/`
- Route files (`src/routes/**`) are excluded from test discovery
- Test at module boundaries (exported queries, HTTP requests, user interactions) — not internals. If you must test an internal, the module should split.
</important>

<important if="you are creating or modifying TypeScript types, interfaces, or error classes">
Project-specific TS conventions (beyond what Biome enforces):
- Prefer **discriminated unions** over boolean flags (`{ ok: true; data } | { ok: false; error }`).
- Use `satisfies` for type-safe object literals; `as const` for readonly literals.
- Custom error classes extend `Error`. Never `throw new Error(string)` for known errors — use `AppError` from `@/core/errors`.
- Guard `array[i]` access — it returns `T | undefined`. Prefer `for...of`; if you need the index, narrow with `if (!item) continue`.
- Public APIs get explicit return types.

Full notes: `@.claude/rules/typescript.md`
</important>

<important if="you are editing files in `src/hono/` or `src/server.ts`, or designing API endpoints, request validation, or error responses">
- Worker entry routes `/api/*` → Hono, rest → TanStack. Initialize the DB once in the fetch handler via `initDatabase()`.
- Type Hono with `Hono<{ Bindings: Env }>`; access env via `c.env`, never `process.env`.
- Run `pnpm cf-typegen` after editing `wrangler.jsonc` to refresh `Env`.
- Validate request input with `zValidator` from `@hono/zod-validator` + named schemas from `@/db/{domain}` — never inline `z.object()`.
- Handlers stay thin: HTTP concerns only. Delegate to query functions in `@/db/{domain}`.
- Errors: throw `AppError` from `@/core/errors` (or return `Result<T>`); use `isUniqueViolation` for 23505 conflicts. Centralize in `app.onError`.
- Response shapes: success `{ data }` (or `{ data, meta }`); error `{ error }` (or `{ error, details }`).

Full notes: `@.claude/rules/api/hono.md`, `@.claude/rules/api/cloudflare-workers.md`, `@.claude/rules/error-handling.md`
</important>

<important if="you are editing files in `src/db/`, writing queries, schemas, migrations, or seeds">
Domain module layout — `src/db/{domain}/{table.ts, schema.ts, queries.ts, index.ts}`. Public API only via `index.ts`.

- All queries call `getDb()` — never accept the DB as a parameter.
- Use `.returning()` on mutations to skip extra round trips. Use `Promise.all()` for parallel independent queries.
- Migrations: per-environment configs (`drizzle-{dev,staging,production}.config.ts`), per-environment dirs (`src/db/migrations/{env}/`). Never edit generated files. Test on dev/staging before production.
- **Drizzle error handling gotcha**: `error.message` = `"Failed query: <SQL>..."` and never contains constraint info. Constraint info is on `error.cause` (Postgres error). Use `isUniqueViolation(error)` from `@/core/errors`.
- Zod schemas in `{domain}/schema.ts`. **Never `z.unknown()`** in schemas consumed by `createServerFn` (TanStack serializes server→client). Use `z.json()` for arbitrary blobs, `z.string().datetime()` or `z.coerce.date()` for dates.
- Idempotent seeds: `.onConflictDoNothing()`.

Full notes: `@.claude/rules/db/drizzle.md`, `@.claude/rules/db/neon.md`, `@.claude/rules/db/zod.md`, `@.claude/rules/error-handling.md`
</important>

<important if="you are editing files in `src/components/`, `src/routes/`, or designing React components, hooks, or routing">
- Components: props interface above the component, named exports.
- Routes: file-based in `src/routes/`. `__root.tsx` for root layout, `_layout/` prefix for layout routes, `$param` for dynamic segments. **Never edit `routeTree.gen.ts`** — it is auto-generated.
- Server functions: `createServerFn({ method }).inputValidator(schema).handler(...)`. Prefer over client `fetch` for SSR'd data; hydrate Query cache from loaders.
- **TanStack Router search params gotcha**: `validateSearch` schemas with `.default()` produce required output types, but the `prev` callback gives optional fields. Always provide explicit fallbacks: `(prev) => ({ limit: prev.limit ?? 20, ...updates })`.
- Query: use `queryOptions` for reusable, type-safe queries; key factories per domain.

Full notes: `@.claude/rules/frontend/react.md`, `@.claude/rules/frontend/tanstack.md`
</important>

<important if="you are building or modifying a form, or wiring a mutation to user input">
**Never use raw `useState` for form state.** Always use `useForm` + `form.Field` + `form.Subscribe`, paired with `useMutation`.

- `mutate()` = fire-and-forget (cache invalidation in `onSuccess`).
- `mutateAsync()` = awaitable — use when you need to act after completion (navigate, redirect).
- `defaultValues` must include all required fields from the mutation's input schema. If a Zod schema uses `.default()`, the inferred type makes that field required — pass it explicitly in `onSubmit`.

Full template: `@.claude/rules/frontend/form-patterns.md`
</important>

<important if="you are writing UI markup, Tailwind classes, or adding shadcn primitives">
- **Theme awareness is required.** Every text/bg/border MUST use semantic CSS-var classes: `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-muted`, `bg-card`, `border-border`. Never `text-white`, `bg-gray-*`, `text-red-500`, etc.
- Status colors via custom vars: `text-destructive`, `bg-success/10`, `bg-warning/10`, `bg-info/10` — and via component variants (`<Alert variant="success">`, `<Badge variant="warning">`).
- Add Shadcn primitives via `pnpx shadcn@latest add <component>` (writes to `src/components/ui/` — do not edit manually).
- Component variants: use `class-variance-authority` (`cva`).
- Spacing: gap > margin. Mobile-first responsive (`md:`, `lg:`).

Full notes: `@.claude/rules/frontend/ui.md` (semantic classes, anti-patterns, layout); `@.claude/rules/frontend/shadcn-tweakcn.md` (oklch format, tweakcn install, custom status vars upkeep, available Alert/Badge variants)
</important>

<important if="you are editing Solidity in `contracts/`, writing Foundry tests, wiring contracts into the frontend, or building anything that uses wagmi/viem/ConnectKit">
- Solidity sources in `contracts/src/`, Forge tests in `contracts/test/`. Build/test via `pnpm contracts:build` / `contracts:test`.
- Deploy scripts in `contracts/script/`. Local broadcast: `pnpm contracts:deploy:local` (uses Anvil default key — never use that key on testnet/mainnet).
- After ABI changes: run `pnpm contracts:typegen` to regenerate `src/contracts/` (ABIs + addresses). The `prebuild` script does this automatically before `pnpm build`.
- Frontend reads ABIs from `@/contracts/abis` and addresses from `@/contracts/addresses.ts` (via `getContractAddress()` from `@/lib/web3/contract-address` for chain-narrowed lookup).
- **Web3 SSR gotcha**: wagmi/connectkit/viem are client-only. Using them in a regular component crashes SSR (`WagmiProviderNotFoundError`) and Cloudflare bundle split (`Cannot split a chunk`). Always follow the placeholder + `*-live.tsx` + `WalletReadyContext` pattern — see `@.claude/rules/frontend/web3-ssr.md`.
- Frontend web3 wiring (wagmi config, ConnectKit, chains) lives in `src/lib/web3/`. Provider stack in `src/integrations/web3/`.
- Deployed addresses recorded in `contracts/deployments/<chainId>.json`.
- Soldeer dependencies in `contracts/dependencies/` are gitignored — re-fetch via `forge soldeer install` if missing.
</important>

<important if="you are configuring `wrangler.jsonc`, deploying, debugging redirects, custom domains, or HTTPS issues on Cloudflare">
- Use `wrangler.jsonc`, never `wrangler.toml`. Workers are stateless — no global mutable state. Use `ctx.waitUntil()` for non-blocking work after the response.
- Prefer `routes: [{ pattern, custom_domain: true }]` over `routes` with `zone_name` (auto-creates DNS + SSL).
- **HTTPS gotcha**: never enable Cloudflare's "Redirect from HTTP to HTTPS" template — it intercepts before Workers and causes 301 self-loops. Use SSL/TLS → Edge Certificates → "Always Use HTTPS" instead. Zone SSL/TLS mode MUST be Full or Full (strict).
- Per-env config lives under `env.{staging,production}` in `wrangler.jsonc` (distinct `name`, `vars`, `observability`). **Env-level `vars` / bindings are NOT inherited from top-level** — re-declare anything the env needs.
- **Env selection mechanism**: the Cloudflare Vite plugin reads `process.env.CLOUDFLARE_ENV` at build time and flattens the matching `env.<name>` block into `dist/server/wrangler.json`. `vite build --mode <env>` alone does NOT pick the env — `--mode` only switches Vite's `import.meta.env.MODE` / `.env.<mode>` loading. Use `cross-env CLOUDFLARE_ENV=<env> vite build`.
- **`wrangler deploy --env <name>` is NOT applicable with this plugin** — the deploy reads the already-flattened `dist/server/wrangler.json`. Just run `wrangler deploy` after the env-scoped build. Secrets via `wrangler secret put --env <env>` (CF dashboard) or `.dev.vars` (local dev only, gitignored).

Full notes (incl. "Too Many Redirects" debugging recipe): `@.claude/rules/cloudflare-deployment.md`, `@.claude/rules/api/cloudflare-workers.md`
</important>

<important if="you are creating or reviewing design documents">
- `/docs` is the single source of truth for business requirements
- Apply review notes/status updates directly in the corresponding design doc
- Never create separate md files for reviews/audits/analyses unless explicitly asked
</important>
