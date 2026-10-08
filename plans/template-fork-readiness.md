# Plan: Template fork readiness

> Source PRD: [#41](https://github.com/auditmos/tstack-on-cf-onchain/issues/41) — "Make the template safe to fork — CF conformance, chain-only mode, web3 hardening, agent-doc integrity". Supersedes the 2026-08-07 audit in #40.

## Tracking issues

| Phase | Issue | Type | Blocked by |
|---|---|---|---|
| 1. Verified pull requests | [#42](https://github.com/auditmos/tstack-on-cf-onchain/issues/42) | HITL | — |
| 2. Chain-only mode works | [#43](https://github.com/auditmos/tstack-on-cf-onchain/issues/43) | AFK | — |
| 3. Reproducible contract builds | [#44](https://github.com/auditmos/tstack-on-cf-onchain/issues/44) | AFK | — |
| 4. Observable production | [#45](https://github.com/auditmos/tstack-on-cf-onchain/issues/45) | AFK | — |
| 5. Transaction failures are visible | [#46](https://github.com/auditmos/tstack-on-cf-onchain/issues/46) | HITL | — |
| 6. RPC failover | [#47](https://github.com/auditmos/tstack-on-cf-onchain/issues/47) | AFK | — |
| 7. API middleware chain | [#56](https://github.com/auditmos/tstack-on-cf-onchain/issues/56) | AFK | #43, #52 |
| 8. Production routing posture | [#52](https://github.com/auditmos/tstack-on-cf-onchain/issues/52) | HITL | #45 |
| 9. Deploy & migration ordering | [#48](https://github.com/auditmos/tstack-on-cf-onchain/issues/48) | HITL | — |
| 10. Agent-doc integrity | [#49](https://github.com/auditmos/tstack-on-cf-onchain/issues/49) | AFK | — |
| 11. Non-Claude agent config | [#53](https://github.com/auditmos/tstack-on-cf-onchain/issues/53) | AFK | #49 |
| 12. Type truthfulness & dead-code scope | [#54](https://github.com/auditmos/tstack-on-cf-onchain/issues/54) | AFK | #43 |
| 13. Scheduled majors report | [#50](https://github.com/auditmos/tstack-on-cf-onchain/issues/50) | AFK | — |
| 14. Frozen-major decisions | [#51](https://github.com/auditmos/tstack-on-cf-onchain/issues/51) | HITL | — |
| — Deploy verification (split from phase 4) | [#55](https://github.com/auditmos/tstack-on-cf-onchain/issues/55) | HITL | #45 |

Phase 4's source-map proof was split into #55 so #45 can close on merge rather than waiting on a manual deploy. Phases 4, 8 and 7 all edit the same per-environment config blocks and are deliberately serialized in that order — a rebase dropping a declaration would be a runtime-only failure on this platform. Every other "blocked by #42" relationship from the plan's ordering rationale is advisory, not enforced: phases 2, 3, 5, 6 and 9 are immediately grabbable.

## Architectural decisions

Durable decisions that apply across all phases:

- **Consumer**: this repository is a template consumed by forks. Every phase is judged by "does a fork start out correct", not by "does one deployment work". Defaults that are safe for everyone ship enabled; deployment-specific stanzas ship commented.
- **Architecture style**: a single Cloudflare Worker serving server-rendered pages and an API under one entry point, with a client-only web3 layer and a separate Solidity contract toolchain.
- **Deployment model**: manual and deliberate. No deploy pipeline, no build-service connection, no approval gates. Continuous integration gates pull requests only. What changes across this plan is ordering and documentation, never who presses the button.
- **Request admission**: a deep module owning one decision — given a request and an environment, does this request proceed, and to which handler. It hides secret inspection, the registry of database-dependent routes, error-response shaping, and boot-failure logging.
- **Database dependence is declared and defaults to false**: a route works without a database unless it opts in. Deliberately fail-open, because the template's headline capability is a chain-only mode and a forker adding a chain-only endpoint should not have to discover an opt-out. The data-access layer already throws on uninitialised access, so admission is a better error, not the only one.
- **Middleware is enforced at construction**: cross-cutting request concerns attach where the API app instance is built, so no endpoint can opt out by omission. Order is request-id, then error handling, then CORS, then rate limiting. There is no authentication stage; it is a fork-supplied extension point.
- **Environment configuration is not inherited**: on this platform, environment-level variables and bindings do not inherit from the top level. Anything an environment needs must be re-declared in that environment. Omissions are runtime-only failures.
- **Web3 is client-only**: no chain client runs server-side. RPC endpoint configuration is therefore browser-exposed build-time config. If server-side chain access is ever added, that endpoint becomes a Worker secret instead — never a client-visible variable.
- **Contract builds are pinned, not proven**: toolchain version and compiler version are pinned so bytecode is reproducible. No reproducibility assertion is built.
- **Agent instructions have one source**: the two agent-instruction files are unified by symlink so drift is structurally impossible rather than test-detected.
- **Testing stays in the existing runner**: no second test runtime is introduced. Logic that needs verification is extracted until it is testable with a stubbed environment.
- **Key entities**: the admission decision; the database-dependent route registry; the chain-to-transport resolver; the API app factory; the deployed-address and ABI registry produced by contract typegen.

**Phase ordering rationale.** Phases 1–3 are the PRD's P0 set and land in that order: continuous integration first so everything after it arrives verified; the chain-only fix second because it is the only item that makes a documented feature work at all; toolchain pinning third because until it lands, contract build results across later work are not comparable. Phase 4 is pulled ahead of the web3 and middleware work so those phases are debuggable when they misbehave.

**Verification honesty.** Several acceptance criteria below require a browser, a real deployment, or a real bot-authored pull request. They cannot be closed by a green unit-test run. Any criterion not exercised for real should be reported as unverified rather than assumed.

---

## Phase 1: Verified pull requests

**User stories**: 18, 19, 23

### What to build

A pull-request workflow that runs the full check suite — lint, type-check, build, unit tests, dead-code detection, and contract tests — so a contributor learns whether their change is sound before a human reviews it. Today only pushes to the default branch run anything, and the repository's own weekly dependency-update pull requests carry a note admitting they receive no checks.

The dependency bot's pull requests must trigger the same workflow. Pull requests opened by an automation using the default workflow credentials do not trigger further workflows, so the bot needs credentials that do. Resolving that is the substance of this phase, not an afterthought.

Pin the supported Node version in the package manifest and in a version file, so a contributor's local runtime matches the one continuous integration uses instead of floating.

Use the pinned contract-toolchain action version from the start here, so this workflow does not need revisiting in Phase 3.

### Acceptance criteria

- [ ] A pull request containing a lint error is blocked
- [ ] A pull request containing a type error is blocked
- [ ] A pull request containing a failing unit test is blocked
- [ ] A pull request containing a failing contract test is blocked
- [ ] A pull request that trips dead-code detection is blocked
- [ ] A pull request whose build fails is blocked
- [ ] A dependency-bot pull request triggers the same workflow — verified on a real bot-authored pull request, not a simulated one
- [ ] The note in the bot's pull-request body admitting it receives no checks is removed or corrected
- [ ] The supported Node version is declared in both the manifest and a version file, and continuous integration uses it rather than a floating alias

---

## Phase 2: Chain-only mode works

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 49

### What to build

The template's README promises it runs fully on-chain without a Postgres instance. It does not: with no database secrets configured, the Worker rejects every API request with a 503, including liveness. This phase makes the promise true.

Extract the request-admission decision out of the Worker entry into its own module. Its interface is one decision derived from a request and an environment; it hides secret inspection, the route registry, the error-response shape, and the boot-failure log. The Worker entry becomes a thin caller.

Routes declare whether they need a database, and default to not needing one. With secrets absent, only declaring routes fail; liveness, any future chain-only endpoint, and all server-rendered pages behave normally.

While building this, correct the environment type declarations so database secrets are typed as possibly-absent. The runtime guard already admits they may be missing; the types currently contradict it. The admission module is the primary consumer of those secrets, so the narrowing is written once here rather than retrofitted later.

Update the README so its chain-only claim matches behavior.

### Acceptance criteria

- [ ] With no database secrets present, the liveness endpoint returns 200
- [ ] With no database secrets present, a database-backed endpoint returns 503 using the project's standard error response shape
- [ ] With no database secrets present, a server-rendered page request is unaffected and renders normally
- [ ] With all database secrets present, every endpoint behaves exactly as it does today — no observable path change
- [ ] With only some database secrets present, behavior matches the fully-absent case, and the emitted log names precisely which variables are missing rather than reporting a generic failure
- [ ] A route added without declaring database dependence serves traffic with no database configured — asserted explicitly, because this is the fail-open decision and a silent regression to fail-closed would restore the original bug
- [ ] The admission decision is exercised through its own interface with a stubbed environment; no test reaches into the Worker entry to verify it
- [ ] Database secrets are typed as possibly-absent and the type-check passes with consuming code narrowing them
- [ ] The README's chain-only claim is accurate

---

## Phase 3: Reproducible contract builds

**User stories**: 31, 32

### What to build

Contract builds are currently nondeterministic: the continuous-integration toolchain action floats on nightly in every workflow that uses it, and no compiler version or EVM target is pinned against the source pragma. Two people building the same contract can get different bytecode.

Pin the toolchain action to a version across all workflows that install it, and pin the compiler version and EVM target in the contract project configuration. The pinned compiler must satisfy the existing source pragma.

No reproducibility assertion is built — the pins remove the nondeterminism, and asserting it costs more machinery than the residual risk justifies.

### Acceptance criteria

- [ ] Every workflow that installs the contract toolchain pins it to a version rather than nightly
- [ ] The compiler version and EVM target are pinned in the contract project configuration
- [ ] The pinned compiler version satisfies the source pragma
- [ ] Two consecutive builds on different machines produce identical bytecode for the demo contract
- [ ] Existing contract tests pass against the pinned toolchain

---

## Phase 4: Observable production

**User stories**: 9, 10, 14

### What to build

Production failures are currently unreadable and unnecessarily slow, for configuration reasons a forker has no reason to suspect.

Enable source-map upload so stack traces point at original source instead of an offset into a minified bundle. Enable Smart Placement so the Worker runs near the single-region database it round-trips to, rather than near whichever caller arrived.

Make log sampling a deliberate, documented choice per environment rather than an inherited accident. Staging and production should differ, and each value should carry a comment explaining why it is what it is.

Because environment configuration does not inherit from the top level, every setting must be present in each environment block that needs it. Verification is against the built manifest, not the source configuration — a value that exists in source but does not survive the build is not enabled.

Landing this before the web3 and middleware phases means those phases are debuggable when they misbehave.

### Acceptance criteria

- [ ] Source-map upload is enabled and present in the built manifest for each environment
- [ ] Smart Placement is enabled and present in the built manifest for at least the production environment
- [ ] A deliberately-thrown production error produces a stack trace pointing at original source
- [ ] Staging and production log-sampling values differ deliberately, and each carries a comment explaining the value
- [ ] Each setting is verified in the built manifest rather than only in the source configuration

---

## Phase 5: Transaction failures are visible

**User stories**: 24, 25, 26, 27

### What to build

A rejected or reverted transaction currently leaves the demo's spinner to stop with no message. The contract-interaction hook discards the error state from both the write call and the receipt wait, and the demo component renders no error state at all.

This matters disproportionately: the counter demo is the pattern every fork copies, so the pattern being copied today is "swallow transaction errors."

Return the error state from the hook so any component built on it can render failures without reaching around the hook. Render it in the demo through the project's existing destructive alert variant. Clear the pending state on failure so the interface is not stuck spinning.

Respect the client-only web3 boundary: hook and rendering changes belong on the client side of the split, not in anything the server bundle reaches.

### Acceptance criteria

- [ ] The contract-interaction hook returns error state from both the write call and the receipt wait
- [ ] A wallet-rejected transaction renders a visible destructive alert — verified in a browser, not only in tests
- [ ] An on-chain revert renders a visible destructive alert — verified in a browser, not only in tests
- [ ] Pending state clears in both failure cases; the interface does not spin indefinitely
- [ ] The existing server-side-rendering bundle-split guard tests still pass

---

## Phase 6: RPC failover

**User stories**: 28, 29, 30

### What to build

Every chain currently uses its default public endpoint with no fallback — the single most common cause of production dApp outages. When that endpoint rate-limits or goes down, every fork goes down with it.

Build a resolver that maps a chain to a transport, hiding the per-chain environment-variable convention, the fallback list construction, and the public-endpoint default. A configured endpoint is tried first; a public endpoint is always the last resort, so an unconfigured fork still works with no setup.

These values are browser-exposed build-time configuration and carry the client-visible variable prefix accordingly. Record in the project rules that if server-side chain access is ever added, the endpoint becomes a Worker secret and never a client-visible variable.

Document the per-chain configuration convention so a forker knows how to supply their own endpoints.

### Acceptance criteria

- [ ] A configured endpoint override is used in preference to the default
- [ ] With the primary endpoint unreachable, calls succeed through the fallback — verified against a genuinely unreachable endpoint
- [ ] Fallback ordering is deterministic, with the configured endpoint first and a public endpoint last
- [ ] An unknown or unconfigured chain degrades to the public endpoint rather than failing
- [ ] The resolver is tested through its own interface without network access
- [ ] The project rules record the server-side-secret rule for future chain access
- [ ] The per-chain configuration convention is documented for forkers

---

## Phase 7: API middleware chain

**User stories**: 33, 34, 35, 36, 37, 38

### What to build

The project rules prescribe a five-stage middleware chain; one stage exists. Agents and humans reading the rules build on an interface that isn't there.

Attach request-id propagation, CORS, and rate limiting where the API app instance is constructed, so every present and future endpoint inherits them and none can opt out by omission. A caller-supplied request identifier is propagated rather than replaced; absent one, a new identifier is generated. The identifier must reach the structured error log so a response can be correlated to its log line.

Rate limiting uses a platform binding — the repository's first. That is deliberate: the template currently has zero bindings, so this doubles as the worked example for how a binding is declared per environment, typed, and consumed. Because environment configuration does not inherit, the binding must be re-declared in every environment block, and the configuration comments must say so, since omitting it produces a runtime-only failure.

Correct the rules to describe the three implemented stages and mark authentication as a fork-supplied extension point rather than an implemented one.

### Acceptance criteria

- [ ] Every response, success or error, carries a request identifier header
- [ ] A caller-supplied identifier is propagated rather than replaced
- [ ] Absent a caller-supplied identifier, one is generated
- [ ] The request identifier appears in the structured error log for a failing request
- [ ] A cross-origin preflight from an allowed origin returns the correct allow headers
- [ ] A cross-origin preflight from a disallowed origin does not
- [ ] A caller exceeding the configured rate receives 429 without reaching a handler
- [ ] An endpoint added with no middleware wiring of its own still exhibits all of the above, confirming the factory is the enforcement point
- [ ] The rate-limit binding is declared in every environment block, and the configuration comments state that this is required because environment config does not inherit
- [ ] The project rules describe the three implemented stages and mark authentication as an extension point
- [ ] The binding reads as a clear worked example of how bindings are declared and consumed — if it does not, it is not earning its place

---

## Phase 8: Production routing posture & rollback runbook

**User stories**: 11, 12, 13, 15, 16, 17

### What to build

The production environment currently declares only a name, variables, and observability. Production and staging both ride the platform's default hostname while the repository's own rules recommend a custom domain. A forker preparing to launch has no stated posture to adopt or override.

Declare whether the production environment is reachable on the default hostname, and decide preview-URL exposure explicitly rather than by omission. Include a correct custom-domain stanza, commented, so going live is an uncomment rather than a documentation search.

Write up the version-upload and gradual-rollout pattern, and the rollback procedure, as the recommended production practice. No scripts are added — forks that need it are one documented command away, and forks that do not are not carrying unused machinery.

Record two decisions that are currently undocumented: why the current database driver was chosen over a connection-pooling binding, and how per-Worker secrets compare to account-level secret storage. A short note each is enough; neither gets an implementation.

### Acceptance criteria

- [ ] The production environment declares its default-hostname posture explicitly
- [ ] Preview-URL exposure is an explicit setting, not an omission
- [ ] A correct custom-domain stanza is present and commented, requiring only an uncomment to adopt
- [ ] The version-upload, gradual-rollout, and rollback procedures are documented as the recommended production practice
- [ ] The database-driver decision is recorded with enough reasoning for a forker to judge whether a pooling binding suits their workload
- [ ] The secret-storage decision is recorded so a forker can align the template with their organisation's policy
- [ ] Settings are verified in the built manifest for each environment, not only in source

---

## Phase 9: Deploy & migration ordering

**User stories**: 20, 21, 22

### What to build

Production migrations and production deploys are two separate manual acts today with no ordering guarantee, so new code can reach traffic against an un-migrated schema.

Sequence the production deploy command so it applies pending migrations, then builds, then deploys. Ordering becomes enforced by the command rather than by memory. The command still runs from a person's machine with that environment's credentials — deployment stays a deliberate manual act by decision, and this phase does not change that.

Document the per-environment migration bootstrap. Only the development environment has committed migrations today, so the first person to deploy to production currently hits an undocumented ceremony.

### Acceptance criteria

- [ ] The production deploy command applies pending migrations before building and deploying
- [ ] Verified by running it against a database with a genuinely pending migration
- [ ] Deployment remains manual — no pipeline, build-service connection, or approval gate is introduced
- [ ] The per-environment migration bootstrap is documented
- [ ] The bootstrap procedure is followed end to end from a clean environment by someone who has not done it before

---

## Phase 10: Agent-doc integrity

**User stories**: 39, 40, 41, 42

### What to build

The agent instructions lie in small, corrosive ways that coding agents act on as ground truth. They point to a rule file that does not exist. They declare a documentation directory that does not exist. They embed a configuration value that an automated bot is guaranteed to make stale. And the two agent-instruction files are byte-identical with no mechanism preventing divergence.

Unify the two instruction files by symlink so drift is structurally impossible rather than test-detected. The known cost is that some tooling and some Windows checkouts handle symlinks poorly; this was accepted over a guard test because a guard test detects drift only after it happens and still leaves two files to reconcile.

Fix every dangling pointer. Create the documentation directory with a README explaining the convention, so forks have a defined home for design documents and the rule stops dangling.

Give the auto-updated compatibility date exactly one writer: the script that bumps it becomes responsible for every occurrence in the repository, including any embedded in documentation. A value an automated bot updates must not exist anywhere the bot does not know about.

Because this class of rot has now recurred, verify pointer resolution mechanically rather than by reading.

### Acceptance criteria

- [ ] Every rule-file pointer in the instructions resolves to an existing file, verified mechanically
- [ ] The two agent-instruction files resolve to the same content through the symlink
- [ ] The documentation directory exists with a README explaining the convention
- [ ] After the compatibility-date bump script runs, no occurrence anywhere in the repository disagrees with the configuration
- [ ] A deliberately stale documentation occurrence is corrected by running the bump script, proving it is the single writer

---

## Phase 11: Non-Claude agent config

**User stories**: 43, 44

### What to build

The existing agent setup is strong but tool-specific. A developer using a different coding agent inherits none of it.

Add machine-readable configuration declaring the Cloudflare documentation server, so an agent with documentation access answers platform questions from current documentation rather than memory. Add a Cursor-format mirror of the instruction sections.

This extends the existing setup rather than replacing it. The unified instruction file from Phase 10 remains the source; the mirror must not become a third thing that can drift independently.

### Acceptance criteria

- [ ] Machine-readable server configuration exists and is valid
- [ ] An agent with documentation access resolves a platform question through the declared server
- [ ] A Cursor-format mirror of the instruction sections exists
- [ ] The mirror's relationship to the unified source file is stated, so it does not become an independent source of drift

---

## Phase 12: Type truthfulness & dead-code scope

**User stories**: 48, 50

### What to build

Two small untruths and one blind spot.

The chain configuration exposes a single name that reads as a multi-entry list but holds exactly one entry, inviting a forker to iterate something that will never have more than one element. Expose the active chain and the known-chain registry under distinct names so the two concepts are separable.

Dead-code detection blanket-exempts the database and error-handling modules — the most-copied areas of the template are invisible to the check. Narrow the exemptions to the specific generated or entry-point files that genuinely need them.

The database-secret typing from this group was folded into Phase 2, where the consuming module is built.

### Acceptance criteria

- [ ] The active chain and the known-chain registry are exposed under distinct, accurately-named exports
- [ ] No caller iterates a single-element collection under the impression it is multi-entry
- [ ] Dead-code exemptions cover only specific generated or entry-point files
- [ ] Dead-code detection runs clean with the narrowed exemptions
- [ ] Type-check and the full test suite pass

---

## Phase 13: Scheduled majors report

**User stories**: 45

### What to build

The existing dependency bot runs in minor-and-patch mode and will never propose a major upgrade, so majors accumulate invisibly. Two are already frozen.

Add a scheduled report that opens or updates a single tracked issue listing available major upgrades. Updating one issue rather than opening many keeps the signal in one place and avoids notification noise.

### Acceptance criteria

- [ ] The scheduled report opens a tracked issue on its first run
- [ ] A subsequent run updates that issue rather than opening a second one
- [ ] The report lists the currently-frozen majors
- [ ] The report distinguishes majors from the minor-and-patch upgrades the existing bot already handles

---

## Phase 14: Frozen-major decisions

**User stories**: 46, 47

### What to build

Two majors are frozen without a recorded reason. This phase's deliverable is a written verdict on each, not a merge — its definition of done differs from every other phase.

For the wallet library, a new major generation is available while the connector library in use belongs to the previous generation. The substance of the investigation is that peer compatibility, because it determines whether the upgrade is a migration or a connector replacement. Record the finding and the decision.

For the build tool — the manifest's only exact pin, with a newer major available — either record the pin's reason inline next to the pin, or verify compatibility with the platform plugin and the application framework and lift it.

Executing either migration is explicitly follow-up work, not part of this phase.

### Acceptance criteria

- [ ] The connector library's compatibility with the new wallet-library major is determined and recorded
- [ ] A decision is recorded: migrate, replace the connector, or stay — with reasoning
- [ ] The build-tool pin either carries an inline reason or has been lifted after verified compatibility
- [ ] If lifted, the full check suite passes on the newer major
- [ ] Neither migration is executed in this phase; follow-up work is filed separately if the decision is to proceed
