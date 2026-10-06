---
title: IP Middleware - Vafast
description: 'Vafast IP middleware: get the real client IP behind proxies and CDNs from headers like X-Forwarded-For, CF-Connecting-IP and X-Real-IP, with trusted proxy support.'
---

# IP

`@vafast/ip` resolves the client IP from request headers and injects it into the handler context via `next({ ip })`. Don't rely on `req.ip` (on Node/undici `Request`, `ip` may be a read-only getter, so writing to it fails).

## Installation

```bash
npm install @vafast/ip
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { ip } from '@vafast/ip'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/whoami',
    middleware: [ip()],
    handler: ({ ip: clientIp }) => json({ ip: clientIp }),
  }),
])

const server = new Server(routes)
serve({
  fetch: server.fetch,
  port: 3000,
  trustProxy: true,
})
```

Prefer the `ip` handler parameter; no need for `(req as any).ip`.

## Usage

### Global Mounting

```typescript
const server = new Server(routes)
server.use(ip())
```

```typescript
defineRoute({
  method: 'GET',
  path: '/',
  handler: ({ ip: clientIp }) => json({ ip: clientIp }),
})
```

### Custom Headers to Check

```typescript
server.use(
  ip({
    checkHeaders: ['x-forwarded-for', 'x-real-ip'],
  }),
)
```

### Combining with Rate Limiting

The rate limiter's `generator` can't see context injected later by other middleware for the same request, so read the trusted header directly or reuse `getIP`:

```typescript
import { rateLimit } from '@vafast/rate-limit'
import { getIP } from '@vafast/ip'

server.use(
  rateLimit({
    max: 60,
    duration: 60_000,
    generator: (req) => getIP(req.headers) || 'unknown',
  }),
)
```

## API

### Exports

| Export | Description |
|------|------|
| `ip(options?)` | Main entry, returns the middleware |
| `getIP(headers, checkHeaders?)` | Utility that resolves the IP from `Headers` only |
| `defaultOptions` / `headersToCheck` | Default config and default header list |
| `Options` / `IPHeaders` / `InjectServer` | Related types |

### `ip(options?: Partial<Options>)`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `checkHeaders` | `IPHeaders[]` | See default list below | Request headers checked in order |
| `headersOnly` | `boolean` | `false` | **Reserved in types; not used by the current implementation** |
| `injectServer` | `(app) => any \| null` | `() => null` | **Reserved in types; not used by the current implementation** |

Current plugin logic: call `getIP(request.headers, options.checkHeaders)`, then `next({ ip })`.

### Default `headersToCheck`

1. `x-real-ip`
2. `x-client-ip`
3. `cf-connecting-ip`
4. `fastly-client-ip`
5. `x-cluster-client-ip`
6. `x-forwarded`
7. `forwarded-for`
8. `forwarded`
9. `appengine-user-ip`
10. `true-client-ip`
11. `cf-pseudo-ipv4`
12. `fly-client-ip`

With the **default** header list, `getIP` tries `x-forwarded-for` first (taking the first entry), then looks through the table above in order.

## Best Practices

- Behind a reverse proxy / CDN, configure the correct forwarding headers and use it with `serve({ trustProxy: true })`.
- Read the IP in handlers via `({ ip })` to keep types clear.
- Only trust headers written by your own infrastructure; never trust arbitrary client-forged `X-Forwarded-For` directly on the public internet.

## Notes

- The IP is only injected into the context via `next({ ip })`; it is **not** written to `req.ip`.
- Although `headersOnly` / `injectServer` appear in the types and default config, **the plugin doesn't read them**; the effective option is `checkHeaders`.
- When resolution fails, `ip` may be an empty string `''`.
- For debugging, set the environment variable `NODE_DEBUG=* ` or `NODE_DEBUG=@vafast/ip`.

## Related Links

- [Rate Limit](/en/middleware/rate-limit)
- [API · serve](/en/api)
- [Best Practices](/en/essential/best-practice)
