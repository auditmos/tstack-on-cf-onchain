# Cloudflare Deployment Rules

## Custom Domains vs Routes

- Prefer `custom_domain: true` over `routes` with `zone_name` — custom domains auto-create DNS records and SSL certs; routes require manual DNS setup
- Routes with `zone_name` need a pre-existing proxied DNS record or requests fail with `ERR_NAME_NOT_RESOLVED`

```jsonc
// Good: auto-creates DNS + SSL
"routes": [{ "pattern": "app.example.com", "custom_domain": true }]

// Fragile: requires manual DNS record
"routes": [{ "pattern": "app.example.com/*", "zone_name": "example.com" }]
```

## HTTP→HTTPS Enforcement

- NEVER use Cloudflare "Redirect from HTTP to HTTPS" redirect rule template — it intercepts requests before Workers and causes 301 self-redirect loops on Worker custom domains
- USE "Always Use HTTPS" toggle in SSL/TLS → Edge Certificates instead — operates at TLS layer, doesn't conflict with Workers

## SSL/TLS Mode

- Zone SSL/TLS encryption mode MUST be **Full** or **Full (strict)**, never Flexible
- Flexible + any HTTPS redirect = infinite redirect loop

## Vite Plugin Environments (`@cloudflare/vite-plugin`)

- The plugin selects which `env.<name>` block to deploy by reading `process.env.CLOUDFLARE_ENV` **at build time**, then flattens that block into `dist/server/wrangler.json`.
- `vite build --mode <name>` alone does NOT pick the Cloudflare env — `--mode` is a Vite-only concept (`import.meta.env.MODE` + `.env.<mode>` loading). Use `cross-env CLOUDFLARE_ENV=<name> vite build`, or put `CLOUDFLARE_ENV=<name>` inside a `.env.<name>` file and run with `--mode <name>`.
- `wrangler deploy --env <name>` is **not applicable** with this plugin — deploy reads the already-flattened built manifest. Run plain `wrangler deploy` after the env-scoped build.
- Source: [Cloudflare Vite plugin — environments](https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/), [migrating from `wrangler dev`](https://developers.cloudflare.com/workers/vite-plugin/reference/migrating-from-wrangler-dev/).

## Per-Env `wrangler.jsonc` Shape

```jsonc
"env": {
  "staging": {
    "name": "tanstack-start-app-staging",
    "vars": { "CLOUDFLARE_ENV": "staging" },
    "observability": { "enabled": true, "logs": { "head_sampling_rate": 1 } }
  },
  "production": {
    "name": "tanstack-start-app-production",
    "vars": { "CLOUDFLARE_ENV": "production" },
    "observability": { "enabled": true, "logs": { "head_sampling_rate": 1 } }
  }
}
```

**Gotcha:** env-level `vars`, `bindings`, and secrets are **NOT inherited from top-level** — re-declare every value each env needs, or it will be missing at runtime. Secrets must be set with `wrangler secret put --env <env>` per env.

## Deploy Script Pattern

```jsonc
// Vite plugin reads CLOUDFLARE_ENV → flattens env.<name> into dist/server/wrangler.json
// cross-env keeps this Windows-portable
"build:staging":     "cross-env CLOUDFLARE_ENV=staging vite build",
"deploy:staging":    "pnpm run build:staging && wrangler deploy",
"build:production":  "cross-env CLOUDFLARE_ENV=production vite build",
"deploy:production": "pnpm run build:production && wrangler deploy"
```

## Debugging "Too Many Redirects"

1. `curl -sI https://domain/path` — check if response is 301 to same URL
2. If `server: cloudflare` with no app headers → request never reached Worker
3. Check: Redirect Rules > Page Rules > SSL mode > Worker binding
4. Disable redirect rules first — most common culprit with Workers
