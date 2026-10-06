---
title: Rate Limit Middleware - Vafast
description: 'Vafast rate limit middleware: throttle requests per IP or key with configurable windows, limits, custom stores and rate limit headers to protect your API.'
---

# Rate Limit

`@vafast/rate-limit` limits request rate per client **key**. Each key may make at most `max` requests within a time window; beyond that it returns **429** and can write `RateLimit-*` / `Retry-After` response headers.

## Key Concepts (for New Users)

### What Is the Rate Limit Key?

The middleware doesn't naturally limit "per connection" or "per route". Instead, it maps each request to a string key and counts that key in the `context` (an in-memory table by default).

By default the key comes from client-IP-related request headers (order below). If the headers aren't trustworthy behind your proxy, or you want to limit per user / API key, define a custom `generator`.

### `skip` Semantics (Remember This)

| `skip` returns | Behavior |
|---------------|------|
| **`true`** | **Skip** rate limiting: no key generated (if not yet), no increment, no rate limit headers |
| **`false`** | **Apply** rate limiting: generate the key (if needed), increment, possibly 429 |

The default `skip: () => false` means every request is rate limited.

`skip.length` affects when the key is generated:

- `skip.length < 2` (takes only `req`): `skip(req)` runs first; `generator` runs only if not skipped
- `skip.length >= 2` (takes `req, key`): `generator` runs first, then `skip(req, key)`

This avoids needless key computation when "skipping by path only", while ensuring the key exists when "deciding to skip by key".

### Counting and the Limit Check

The flow is **`increment` first, then check**:

```text
current >= max + 1  →  429
```

For example, with `max: 10`, the 11th request is rejected. The window length is set by `duration` (milliseconds); `Retry-After` is about `ceil(duration / 1000)` seconds.

### Default In-Memory Store and Multiple Instances

`DefaultContext` uses an in-process LRU counter. In multi-process / multi-replica deployments, **counts are not shared between instances**, so the global QPS limit is roughly `max × number of instances`. For cluster-wide limits, implement a custom `Context` (e.g. Redis) and pass it via the `context` option.

## Installation

```bash
npm install @vafast/rate-limit
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(
  rateLimit({
    max: 100,
    duration: 60_000,
  }),
)
serve({ fetch: server.fetch, port: 3000 })
```

## Usage

### Global Rate Limiting

```typescript
server.use(
  rateLimit({
    max: 100,
    duration: 60_000,
  }),
)
```

### Per-Route Rate Limiting

```typescript
defineRoute({
  method: 'POST',
  path: '/login',
  middleware: [rateLimit({ max: 10, duration: 60_000 })],
  handler: () => json({ ok: true }),
})
```

### Skipping Health Checks and Similar Paths

`skip` returning **`true` means skip** counting and limiting:

```typescript
server.use(
  rateLimit({
    max: 60,
    duration: 60_000,
    skip: (req) => {
      const path = new URL(req.url).pathname
      return path === '/' || path === '/health'
    },
  }),
)
```

### Custom Rate Limit Key

```typescript
rateLimit({
  max: 30,
  duration: 60_000,
  generator: (req) =>
    req.headers.get('authorization') ??
    req.headers.get('x-forwarded-for') ??
    'anonymous',
})
```

### Custom Limit Response (Three Forms of `errorResponse`)

| Type | Behavior |
|------|------|
| `string` | Returns the string as a **429** text response (`text(...)`); rate limit headers can be added |
| `Response` | Returned after `clone()`; with `headers: true`, `RateLimit-*` / `Retry-After` are written to the clone |
| `Error` | The Error is **thrown** (handled by the error handling upstream) |
| Anything else | Falls back to the text `'Too Many Requests'` with status 429 |

```typescript
import { err } from 'vafast'

rateLimit({
  max: 5,
  duration: 60_000,
  errorResponse: new Response(JSON.stringify({ error: 'Too Many Requests' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  }),
  // or throw: errorResponse: err('Too Many Requests', 429)
  // or plain text: errorResponse: 'rate-limit reached'
})
```

### Custom `Context` (Storage)

For external storage like Redis, implement the `Context` interface and pass it in:

| Method | Description |
|------|------|
| `init(options)` | Called when the middleware is created; can read `duration` / `max` etc. (excluding `context` itself) |
| `increment(key)` | Count +1, returns `{ count, nextReset }` |
| `decrement(key)` | Count -1; called when `countFailedRequest: false` and downstream throws |
| `reset(key?)` | Resets one key, or everything if no key is given |
| `kill()` | Cleanup hook when the process exits |

```typescript
import type { Context } from '@vafast/rate-limit'
import { rateLimit } from '@vafast/rate-limit'

const redisContext: Context = {
  init() { /* ... */ },
  async increment(key) { /* return { count, nextReset } */ },
  async decrement(key) { /* ... */ },
  async reset(key) { /* ... */ },
  async kill() { /* ... */ },
}

rateLimit({ max: 100, duration: 60_000, context: redisContext })
```

## API

### Exports

| Export | Description |
|------|------|
| `rateLimit(options?)` | Main entry, returns the middleware |
| `DefaultContext` | Default in-memory counter store (LRU; constructor `maxSize` defaults to 5000) |
| `defaultOptions` | Default config constant |
| `Options` / `Context` / `Generator` | Related types |

### `rateLimit(options?: Partial<Options>)`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `duration` | `number` | `60000` | Counting window (ms); also used for `Retry-After` |
| `max` | `number` | `10` | Max requests per window |
| `errorResponse` | `string \| Response \| Error` | `'rate-limit reached'` | Limit response; see the three forms above |
| `countFailedRequest` | `boolean` | `false` | When `false`, a downstream **throw** calls `decrement` to refund the count |
| `generator` | `(req, server, derived) => string \| Promise<string>` | `defaultKeyGenerator` | Rate limit key |
| `context` | `Context` | `new DefaultContext()` | Counter storage |
| `skip` | `(req, key?) => boolean \| Promise<boolean>` | `() => false` | Return **`true` to skip** rate limiting |
| `headers` | `boolean` | `true` | Whether to write `RateLimit-*` / `Retry-After` |
| `injectServer` | `() => any` | — | The server passed to `generator`; usually not needed |
| `scoping` | `'global' \| 'scoped'` | `'global'` | **Compatibility field; not used by the current implementation** |

### Default `generator` Header Order

`defaultKeyGenerator` takes the client address in this order, **returning on the first match**:

1. `x-real-ip`
2. `x-forwarded-for` (the **first** comma-separated entry, `trim`med)
3. `cf-connecting-ip`
4. `x-client-ip`

If all are missing: falls back to `ua:${user-agent || 'unknown'}` and logs a `console.warn`.

When `request` is `undefined`, it returns an empty string and warns.

### Response Headers (`headers: true`)

| Header | Description |
|----|------|
| `RateLimit-Limit` | Window limit (`max`) |
| `RateLimit-Remaining` | Remaining requests |
| `RateLimit-Reset` | Seconds until reset (rounded up) |
| `Retry-After` | Added **only when limited**; about `ceil(duration / 1000)` seconds |

### `skip` and Key Generation Timing

- `skip.length < 2`: `skip(req)` is called first; the key is generated only if not skipped
- `skip.length >= 2`: the key is generated first, then `skip(req, key)` is called

Counting happens only when `(await skip(...)) === false`; any other truthy value counts as a skip.

## Best Practices

- Use a smaller `max` for sensitive endpoints like login or SMS sending, or attach a separate route-level limiter.
- Behind a reverse proxy, make sure the IP-related request headers are trustworthy, or define a custom `generator` (e.g. by user ID / API key).
- Exclude health checks, static assets and the like with `skip` (return `true`) so monitoring isn't affected.
- The default in-memory `DefaultContext` isn't shared across instances; implement a custom `Context` for global limits.

## Notes

- `scoping` is kept only for compatibility and **doesn't change behavior**.
- Only `skip` returning `true` skips; the default `() => false` counts everything.
- The limit check is `current >= max + 1` (increment first, then check).
- With `countFailedRequest: false`, the count is refunded only when downstream **throws**; normal 4xx/5xx responses still count.
- Multiple instances + the default in-memory store ≠ cluster-wide rate limiting.

## Related Links

- [IP](/en/middleware/ip)
- [Middleware System](/en/middleware)
