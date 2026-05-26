// Project-specific extension of the wrangler-generated `BaseEnv`.
// `BaseEnv` (from worker-configuration.d.ts) holds the bindings declared in
// wrangler.jsonc. Add anything else the runtime expects (service bindings,
// queue messages, workflow params, etc.) by extending it here.
//
// Secrets are NOT declared in wrangler.jsonc (that would commit them as
// plaintext `vars`). They are bootstrapped per-env via `wrangler secret put`
// (see README → Secrets & Environments) and declared here so TS sees them.
interface Env extends BaseEnv {
	DATABASE_HOST: string;
	DATABASE_USERNAME: string;
	DATABASE_PASSWORD: string;
}
