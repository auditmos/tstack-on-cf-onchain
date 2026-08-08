# Hono Framework Rules

## App Setup

- Type bindings via `Hono<{ Bindings: Env }>`
- Access env via `c.env`, not `process.env`
- Export `app.fetch` for Workers

```ts
import { Hono } from 'hono'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

export default {
  fetch: app.fetch,
}
```

## Middleware Chain

Three stages are implemented, attached once where `apiHono` is constructed
(`src/hono/api.ts`) — not per-route — so every current and future endpoint
inherits them and none can opt out by omission. Order: requestId →
errorHandler → cors → rateLimiter.

```ts
apiHono.use('*', requestId())      // hono/request-id — propagates a caller-supplied
                                    // X-Request-Id or generates one; c.get('requestId')
apiHono.use('*', apiCors())        // src/hono/middleware/cors.ts — origin allowlist from
                                    // the ALLOWED_ORIGINS env var, read per-request
apiHono.use('*', rateLimiter())    // src/hono/middleware/rate-limit.ts — the
                                    // API_RATE_LIMITER binding, 429 before reaching a handler
apiHono.onError((err, c) => { ... }) // wraps everything above; logs c.get('requestId')
                                      // alongside the error so a response correlates to its log line
```

**Authentication is a fork-supplied extension point, not implemented here.**
This template deliberately ships with no auth story — add your own stage
(session cookie, JWT, API key, etc.) at this same construction point when
your fork needs one.

## Route Structure

- Handlers: thin wrappers, call query functions from `@/db/{domain}`
- Keep handlers focused on HTTP concerns (validation, status codes, response shape)

## Request Validation

Preferred: use `zValidator` from `@hono/zod-validator` with named schemas from `@/db/{domain}`.
If `@hono/zod-validator` is not yet installed, use `safeParse` from `@/db/{domain}` schemas — never inline `z.object()`.

```ts
// Best — zValidator (when available)
import { zValidator } from '@hono/zod-validator'
import { ClientCreateSchema, ClientIdParamSchema } from '@/db/client'

app.post('/clients',
  zValidator('json', ClientCreateSchema),
  async (c) => {
    const data = c.req.valid('json') // typed!
  }
)

// Acceptable — safeParse with named schema
import { clientCreateSchema } from '@/db/client'

const result = clientCreateSchema.safeParse(await c.req.json())
if (!result.success) return c.json({ error: 'Validation failed' }, 400)
```

## Error Handling

- Use `AppError` from `@/core/errors` for known errors
- Use `isUniqueViolation` for constraint conflicts
- Centralize via error middleware
- Return consistent error shapes

```ts
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Internal error' }, 500)
})
```

## Response Patterns

```ts
// Success
return c.json({ data: entity })
return c.json({ data: entities, meta: { total, page } })

// Error
return c.json({ error: 'Not found' }, 404)
return c.json({ error: 'Validation failed', details: errors }, 400)
```
