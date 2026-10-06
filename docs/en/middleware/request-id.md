---
title: Request ID Middleware - Vafast
description: 'Vafast request ID middleware: generate or propagate a unique X-Request-ID for every request to correlate logs and traces across services.'
---

# Request ID

`@vafast/request-id` generates a unique ID for each request: it writes it to `req.id`, injects it into the handler context via `next({ requestId })`, and echoes it in a response header (default `X-Request-Id`).

## Installation

```bash
npm install @vafast/request-id
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { requestId } from '@vafast/request-id'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: ({ requestId: id, req }) => ({
      fromContext: id,
      fromReq: req.id,
    }),
  }),
])

const server = new Server(routes)
server.use(requestId())
serve({ fetch: server.fetch, port: 3000 })
```

The response will include:

```
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

## Usage

### Reading It in a Handler

The middleware calls `next({ requestId })`, so handlers can destructure it directly; it's also attached to `req.id`:

```typescript
defineRoute({
  method: 'GET',
  path: '/work',
  handler: ({ requestId: id, req }) => {
    console.log(id, req.id) // same value
    return { ok: true }
  },
})
```

### Type-Safe Helper

```typescript
import { getRequestId } from '@vafast/request-id'

const id = getRequestId(req) // string | undefined
```

### Custom Generator / Response Header

```typescript
import { requestId } from '@vafast/request-id'

server.use(
  requestId({
    generator: () => `req-${Date.now()}`,
    headerName: 'X-Correlation-Id',
  }),
)
```

### Distributed Tracing (Reusing an Upstream ID)

By default `useExisting: true`: if the incoming request already has the header, it's reused instead of generating a new one.

```typescript
server.use(
  requestId({
    headerName: 'X-Request-Id',
    existingHeaderName: 'X-Trace-Id', // read from a different request header
  }),
)

// always generate a new ID
server.use(requestId({ useExisting: false }))
```

### Combining with request-logger

```typescript
import { requestId } from '@vafast/request-id'
import { requestLogger } from '@vafast/request-logger'

server.use(requestId()) // mount first so req.id is set
server.use(
  requestLogger({
    url: process.env.LOG_INGEST_URL!,
    service: 'my-server',
  }),
)
```

`request-logger` reads `req.id` first, then falls back to the `x-request-id` header.

## Full API Parameters

### `requestId(options?)`

Returns a Vafast middleware.

#### `RequestIdOptions`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `generator` | `() => string` | `crypto.randomUUID()` | Custom ID generator |
| `headerName` | `string` | `'X-Request-Id'` | Name of the response header to write |
| `useExisting` | `boolean` | `true` | Whether to reuse the ID from the incoming request header |
| `existingHeaderName` | `string` | Same as `headerName` | Request header to read an existing ID from |

Behavior summary:

1. If `useExisting`, read the incoming ID from `existingHeaderName`  
2. Otherwise call `generator()`  
3. Assign it to `req.id` and call `next({ requestId: id })`  
4. Clone the response, set `headerName` and return it  

### `getRequestId(req)`

```typescript
getRequestId(req: Request): string | undefined
```

Reads `req.id`; `undefined` if the middleware isn't mounted.

### Types

```typescript
type IdGenerator = () => string

interface RequestIdOptions {
  generator?: IdGenerator
  headerName?: string
  useExisting?: boolean
  existingHeaderName?: string
}
```

The package also adds an optional `id?: string` to `Request` via `declare global`.

## Best Practices

- **Mount early**: before any middleware that needs to correlate logs (especially `request-logger`)  
- **Use one header name across the chain**: agree on `X-Request-Id` between gateway and services and keep `useExisting: true`  
- **Include the ID in business logs**: `logger.info({ requestId: id }, '...')` to correlate with access logs  
- For short IDs, use a custom `generator` (e.g. nanoid) instead of changing the global `crypto`

## Notes

- The middleware **creates a new Response** to write the header; the original `response.body` stream is forwarded, so don't rely on the same body after consuming it downstream  
- With `useExisting: true`, the incoming header is trusted without format validation; validate or sanitize it at the gateway  
- `@vafast/logger` is **not** request middleware; application logs need to include `requestId` themselves  
- Both the context `requestId` and `req.id` are available in handlers and hold the same string

## Related Links

- [Request Logger](/en/middleware/request-logger)
- [Logger](/en/middleware/logger)
- [Middleware Overview](/en/middleware)
