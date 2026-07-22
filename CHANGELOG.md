## [1.7.6](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.7.5...v1.7.6) (2026-07-22)


### Bug Fixes

* **knip:** ignore the anvil binary so deps-update stops failing ([643ef5d](https://github.com/auditmos/tstack-on-cf-onchain/commit/643ef5dc3f1c38bfac302b172cc024db4333dc2e))

## [1.7.5](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.7.4...v1.7.5) (2026-05-26)


### Bug Fixes

* **deps:** remove duplicate @vitest/coverage-v8 key from bumps PR [#33](https://github.com/auditmos/tstack-on-cf-onchain/issues/33) ([a63d220](https://github.com/auditmos/tstack-on-cf-onchain/commit/a63d220b2bc190511c7e4a80956c4ba40d5455af))

## [1.7.4](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.7.3...v1.7.4) (2026-05-26)


### Bug Fixes

* **test:** silence MaxListeners warning from WalletConnect heartbeat ([#32](https://github.com/auditmos/tstack-on-cf-onchain/issues/32)) ([7f4b475](https://github.com/auditmos/tstack-on-cf-onchain/commit/7f4b475758ea7b3c4e768b40c8533cc335d7da69))

## [1.7.3](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.7.2...v1.7.3) (2026-05-26)


### Bug Fixes

* **api:** centralize Hono error handling, stop leaking SQL on 500 ([#19](https://github.com/auditmos/tstack-on-cf-onchain/issues/19)) ([6010bd1](https://github.com/auditmos/tstack-on-cf-onchain/commit/6010bd1e32f3f3d151b12c20b3fde8d7b4b4220d))
* **api:** unify client response envelopes to { data } / { data, meta } ([#25](https://github.com/auditmos/tstack-on-cf-onchain/issues/25)) ([c71f163](https://github.com/auditmos/tstack-on-cf-onchain/commit/c71f163c0d82b8b63648aec923e26b0c8b428955))
* **api:** use zValidator on clients routes, return { error, details } shape ([f5d11f6](https://github.com/auditmos/tstack-on-cf-onchain/commit/f5d11f674a0b15ccb83c32eb5a1bad499fa0e15c)), closes [#20](https://github.com/auditmos/tstack-on-cf-onchain/issues/20) [#26](https://github.com/auditmos/tstack-on-cf-onchain/issues/26)
* **bundle:** gate web3 lazy() with import.meta.env.SSR to drop wagmi from Worker SSR ([#28](https://github.com/auditmos/tstack-on-cf-onchain/issues/28)) ([69d53f9](https://github.com/auditmos/tstack-on-cf-onchain/commit/69d53f9cfed66fe5162ac532db62605aee540e31))
* **db:** reject partial DB credentials, guard Env type regression ([#22](https://github.com/auditmos/tstack-on-cf-onchain/issues/22)) ([36e1efe](https://github.com/auditmos/tstack-on-cf-onchain/commit/36e1efee6b35e00bede9c105f6b9bb70775964d7))
* **health:** emit structured log when checkDatabase flips to disconnected ([7869653](https://github.com/auditmos/tstack-on-cf-onchain/commit/7869653ed797301c9734cf47da07d0d438055e58)), closes [#23](https://github.com/auditmos/tstack-on-cf-onchain/issues/23)
* **logging:** structured JSON in template console calls ([#21](https://github.com/auditmos/tstack-on-cf-onchain/issues/21)) ([0c218a8](https://github.com/auditmos/tstack-on-cf-onchain/commit/0c218a8df4df7c2038ad2d6c533c5b6fb3121af9))
* **server-fn:** swap .parse to safeParse + AppError in examplefunction template ([#27](https://github.com/auditmos/tstack-on-cf-onchain/issues/27)) ([386b710](https://github.com/auditmos/tstack-on-cf-onchain/commit/386b710298ca041dc320bfea4c424fad7140ac54))
* **server:** return 503 with structured log when DB env incomplete ([0c3b07e](https://github.com/auditmos/tstack-on-cf-onchain/commit/0c3b07e4c0f0d2f07819639978710bfaf437a38f)), closes [#24](https://github.com/auditmos/tstack-on-cf-onchain/issues/24)

## [1.7.2](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.7.1...v1.7.2) (2026-05-26)


### Bug Fixes

* **cf:** bump compatibility_date + add 180-day freshness test ([#18](https://github.com/auditmos/tstack-on-cf-onchain/issues/18)) ([3751fb9](https://github.com/auditmos/tstack-on-cf-onchain/commit/3751fb9c5324a7a50ba766ec40de652f886ced49))

## [1.7.1](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.7.0...v1.7.1) (2026-05-26)


### Bug Fixes

* **observability:** enable Workers Logs at top-level wrangler config ([#17](https://github.com/auditmos/tstack-on-cf-onchain/issues/17)) ([591049d](https://github.com/auditmos/tstack-on-cf-onchain/commit/591049de1fe9b00148fd2bfe0464861137441b72))

# [1.7.0](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.6.1...v1.7.0) (2026-05-26)


### Features

* **deploy:** add staging/production env blocks and deploy scripts ([#16](https://github.com/auditmos/tstack-on-cf-onchain/issues/16)) ([2a52ca4](https://github.com/auditmos/tstack-on-cf-onchain/commit/2a52ca41cfe57d7df9f0409a267ff9764a457624))

## [1.6.1](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.6.0...v1.6.1) (2026-05-26)


### Bug Fixes

* **security:** stop declaring DB credentials as wrangler vars ([#15](https://github.com/auditmos/tstack-on-cf-onchain/issues/15)) ([e9c5c6f](https://github.com/auditmos/tstack-on-cf-onchain/commit/e9c5c6f0bbdc9040ad8fff1236c52c8cd3664d12))

# [1.6.0](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.5.0...v1.6.0) (2026-05-05)


### Features

* add init-project script + foundry env support ([95a9ec0](https://github.com/auditmos/tstack-on-cf-onchain/commit/95a9ec04c3ec45291370dec097af53a654c89d72))

# [1.5.0](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.4.0...v1.5.0) (2026-04-30)


### Bug Fixes

* **contracts:** create test/tmp dir in DeploymentRegistry test setUp ([8942052](https://github.com/auditmos/tstack-on-cf-onchain/commit/89420527ed8d68468895e19b91752babd518417c))


### Features

* **web3:** Counter end-to-end UI (issue [#7](https://github.com/auditmos/tstack-on-cf-onchain/issues/7)) ([a7d8799](https://github.com/auditmos/tstack-on-cf-onchain/commit/a7d879925419926070a057e7806d0ae0e3643551))

# [1.4.0](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.3.0...v1.4.0) (2026-04-29)


### Features

* **web3:** wagmi + ConnectKit integration (issue [#6](https://github.com/auditmos/tstack-on-cf-onchain/issues/6)) ([13f5c7c](https://github.com/auditmos/tstack-on-cf-onchain/commit/13f5c7c2298ec17b4ad4d72ca072ebe097248e39))

# [1.3.0](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.2.0...v1.3.0) (2026-04-29)


### Features

* **contracts:** local dev orchestrator (anvil + deploy + typegen) ([677792d](https://github.com/auditmos/tstack-on-cf-onchain/commit/677792d4ff2122a19611e1be362189fb53459dbe)), closes [#5](https://github.com/auditmos/tstack-on-cf-onchain/issues/5)

# [1.2.0](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.1.0...v1.2.0) (2026-04-29)


### Features

* **contracts:** deploy scripts + deployment registry ([18aacfe](https://github.com/auditmos/tstack-on-cf-onchain/commit/18aacfed9b6b2a74eb4e0e102f53bc542331f089)), closes [#4](https://github.com/auditmos/tstack-on-cf-onchain/issues/4)

# [1.1.0](https://github.com/auditmos/tstack-on-cf-onchain/compare/v1.0.0...v1.1.0) (2026-04-29)


### Features

* **contracts:** ABI typegen pipeline ([2cb4f53](https://github.com/auditmos/tstack-on-cf-onchain/commit/2cb4f538b09c024f089ebfc2628ae286efdc0b4b))

# 1.0.0 (2026-04-24)


### Features

* add Foundry scaffold with soldeer and Counter.sol ([43240c4](https://github.com/auditmos/tstack-on-cf-onchain/commit/43240c480f73a083343ef249b461698ef7f8d930)), closes [#2](https://github.com/auditmos/tstack-on-cf-onchain/issues/2)

# [1.1.0](https://github.com/auditmos/tstack-on-cf/compare/v1.0.0...v1.1.0) (2026-04-09)


### Features

* add claude rules, agents, error infra, remove demo endpoint ([136b6a9](https://github.com/auditmos/tstack-on-cf/commit/136b6a90dda0c5ef70aa585161756803af0d70da))
* add clients CRUD UI, hooks, initial migration ([cc0e826](https://github.com/auditmos/tstack-on-cf/commit/cc0e8269163c5ef7ea82ed97cff4035b4444f7d7))
* add Neon PostgreSQL + Drizzle ORM database layer ([6de059a](https://github.com/auditmos/tstack-on-cf/commit/6de059a5483ade15f356ef6155e6967a5a20e376))

# 1.0.0 (2026-03-16)


### Bug Fixes

* specify packageManager for pnpm action-setup ([03ce86c](https://github.com/auditmos/tstack-on-cf/commit/03ce86ce7c313943d5bda304d036b8252d7ce08f))
