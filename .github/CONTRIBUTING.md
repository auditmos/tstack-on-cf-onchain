# Contributing to TanStack Start on Cloudflare — On-chain Edition

Thanks for your interest in contributing!
This guide will help you get started.

## Code Style

- Use TypeScript
- Solidity contracts in `contracts/src/`, Forge tests in `contracts/test/`
- Follow existing code patterns

## Feature Implementation Workflow (with Claude Code)

```
┌─────────────────────────────────────────────────────────────┐
│  1. DESIGN                                                  │
│     User: "I need a feature for X"                          │
│     → dd-w agent creates design doc in /docs/NNN-*.md       │
│     → User reviews, iterates if needed                      │
├─────────────────────────────────────────────────────────────┤
│  2. IMPLEMENT                                               │
│     User: "Implement doc NNN"                               │
│     → dd-i agent reads doc, implements across codebase      │
│     → Rules auto-apply based on files being edited          │
├─────────────────────────────────────────────────────────────┤
│  3. DEPLOY                                                  │
│     pnpm contracts:deploy:* (chain side)                    │
│     pnpm deploy (Workers side)                              │
└─────────────────────────────────────────────────────────────┘
```

### Claude Code Primitives

| Primitive | Role |
|-----------|------|
| `dd-w` | Writes design docs with full project context |
| `dd-i` | Implements from design docs following all rules |
| `.claude/rules/*` | Auto-load per file path, enforce patterns |
| `AGENTS.md` | Project-wide context |

### Example

```bash
# 1. Design
"Create a design doc for adding a Vault contract + UI"

# 2. Review & iterate
"Add deposit-cap parameter and re-entrancy guard"

# 3. Implement
"Implement doc 003"

# 4. Deploy
pnpm contracts:test
pnpm contracts:deploy:testnet
pnpm deploy
```

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Test your changes locally:
   - `pnpm types && pnpm test && pnpm lint` (frontend/API)
   - `pnpm contracts:build && pnpm contracts:test` (Solidity)
5. Commit with a [Conventional Commits](https://www.conventionalcommits.org/) message — `feat:`, `fix:`, etc. (see `.github/workflows/release.yml` for the version-bump mapping)
6. Push and open a PR. Add a detailed description of your changes and attach a screenshot if you made UI changes.
