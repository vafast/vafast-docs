---
title: Server Timing Middleware - Vafast
description: 'Vafast Server-Timing middleware: expose handler and middleware durations in the Server-Timing header to profile API performance right in browser devtools.'
---

# Server Timing

`@vafast/server-timing` measures request processing time and writes it to the `Server-Timing` response header so you can inspect it in browser DevTools.

The framework has no fine-grained lifecycle hooks, so only two timings are provided: **`handle`** / **`total`**.

## Installation

```bash
npm install @vafast/server-timing
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(serverTiming())
serve({ fetch: server.fetch, port: 3000 })
```

Example response:

```http
Server-Timing: handle;dur=1.23,total;dur=1.25
```

## Usage

### Enable Globally

```typescript
server.use(serverTiming())
```

### Force-Enable in Production

Disabled in production by default (`enabled` defaults to `NODE_ENV !== 'production'`):

```typescript
server.use(
  serverTiming({
    enabled: true,
  }),
)
```

### Write the Header Only for Some Paths

```typescript
server.use(
  serverTiming({
    enabled: true,
    allow: ({ request }) =>
      new URL(request.url).pathname.startsWith('/api'),
    trace: { handle: true, total: true },
  }),
)
```

### Output Only total

```typescript
server.use(
  serverTiming({
    trace: { handle: false, total: true },
  }),
)
```

## API

### Exports

| Export | Description |
|------|------|
| `serverTiming(options?)` | Main entry, returns the middleware |
| `default` | Same as `serverTiming` |
| `ServerTimingOptions` | Options type |

### `serverTiming(options?: ServerTimingOptions)`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `enabled` | `boolean` | `NODE_ENV !== 'production'` | Whether it's enabled; off in production by default |
| `allow` | `boolean \| ((ctx) => boolean \| Promise<boolean>)` | Allowed | Whether to write the header for this response; the function receives `{ request }` |
| `trace.handle` | `boolean` | `true` | Whether to output the `handle` metric |
| `trace.total` | `boolean` | `true` | Whether to output the `total` metric |

The current implementation **only supports** `handle` / `total`; there are no other lifecycle metrics.

## Best Practices

- The default config is fine for development; it's off in production by default to avoid needless overhead and information exposure.
- Use `allow` to limit paths or sample a fraction of requests when you need observation.
- For real production tracing, use [OpenTelemetry](/en/middleware/opentelemetry).

## Notes

- This is a development-time performance tool, not an APM.
- If the response `Headers` are immutable, `headers.set` may fail silently (the source wraps it in `try/catch`).
- With `enabled: false`, it just calls `next()` and writes no headers.

## Related Links

- [OpenTelemetry](/en/middleware/opentelemetry)
- [Middleware System](/en/middleware)
