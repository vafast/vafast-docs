---
title: Request Logger - Vafast
description: 'Vafast request logger: log method, path, status and duration for each request, with configurable formats, filters and slow request highlighting.'
---

# Request Logger

`@vafast/request-logger` is an HTTP **access log middleware**: it records method, path, duration and sanitized headers/body/response, ships them asynchronously to a remote service, and can also write to stdout.

::: tip How it differs from @vafast/logger
| Package | Purpose |
|----|------|
| `@vafast/logger` | In-app `logger.info` / `error` (**not** middleware) |
| `@vafast/request-logger` | Access log middleware for every HTTP request |
:::

## Installation

```bash
npm install @vafast/request-logger
```

## Quick Start

`url` and `service` are **required**:

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { requestId } from '@vafast/request-id'
import { requestLogger } from '@vafast/request-logger'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => ({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(requestId())
server.use(
  requestLogger({
    url: 'http://log-server:9005/api/logs/ingest',
    service: 'my-server',
  }),
)

serve({ fetch: server.fetch, port: 3000 })
```

Default behavior: stdout JSON dual-write on, sensitive fields sanitized, circuit breaker + error throttling on upload failures.

## Usage

### Auth Headers and Excluded Paths

```typescript
server.use(
  requestLogger({
    url: process.env.LOG_INGEST_URL!,
    service: 'auth-server',
    headers: {
      Authorization: `Bearer ${process.env.LOG_INGEST_TOKEN}`,
    },
    excludePaths: ['/health', '/metrics', /^\/internal/],
  }),
)
```

`excludePaths`: strings match exactly or as "prefix + `/`"; a `RegExp` uses `test(path)`.

### Disabling Per Route

Set `log: false` on the route definition (read via the framework's `getRoute`):

```typescript
defineRoute({
  method: 'GET',
  path: '/health',
  log: false,
  handler: () => ({ ok: true }),
})
```

### stdout Dual-Write (K8s)

```typescript
requestLogger({
  url: '...',
  service: 'auth-server',
  stdout: {
    enabled: true, // default true; set false to disable
    format: 'json', // or 'text'
    includeBody: true,
    includeResponse: false, // response bodies can be large
  },
})
```

stdout levels: 2xx → 30 (INFO), 4xx → 40 (WARN), 5xx → 50 (ERROR).

### Custom Business Fields

```typescript
requestLogger({
  url: '...',
  service: 'billing-server',
  getUserId: ({ req }) => req.__locals?.userInfo?.id,
  getAppId: async ({ path, body }) => {
    if (path !== '/notify/alipay') return undefined
    const form = body as Record<string, string>
    return lookupAppId(form.out_trade_no)
  },
  getAuthType: ({ headers }) =>
    headers.authorization?.startsWith('Bearer ak_') ? 'apiKey' : undefined,
})
```

Defaults when no getter is provided:

- `appId` ← header `app-id`
- `authType` ← heuristic on the `Authorization` prefix (`Bearer ak_` → apiKey, `Bearer eyJ` → jwt)
- `userId` ← `sub` / `userId` / `id` from the JWT payload, parsed without signature verification
- `clientKey` ← the `client-key` header (Ones App Client)
- `platform` ← header `x-platform`
- `appVersion` ← header `x-app-version`

These fields are resolved before header sanitization and written at the **top level** of the ingest payload; missing or empty values become `null`. log-server no longer falls back to headers.

### Sampling and Circuit Breaking

```typescript
requestLogger({
  url: '...',
  service: 'gateway',
  sampleRate: 0.1, // log only about 10%
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60_000,
  },
  errorThrottle: { interval: 60_000 },
  onError: (error, { droppedCount }) => {
    console.warn(error.message, droppedCount)
  },
})
```

### With request-id

Prefers `req.id`; otherwise reads `requestIdHeader` (default `x-request-id`):

```typescript
server.use(requestId())
server.use(requestLogger({ url: '...', service: 'my-server' }))
```

## Full API Parameters

### `requestLogger(options)`

```typescript
requestLogger(options: RequestLoggerOptions): Middleware
```

`createRequestLogger` is an alias with the same signature (**deprecated**).

### `RequestLoggerOptions`

| Parameter | Type | Required | Default | Description |
|------|------|------|------|------|
| `url` | `string` | **Yes** | — | Remote ingest URL |
| `service` | `string` | **Yes** | — | Service identifier |
| `headers` | `Record<string, string>` | No | `{}` | Extra headers on upload requests |
| `timeout` | `number` | No | `5000` | Upload timeout (ms) |
| `enabled` | `boolean` | No | `true` | Master switch |
| `excludePaths` | `(string \| RegExp)[]` | No | `[]` | Excluded paths |
| `sanitize` | `SanitizeConfig` | No | Built-in defaults | Sanitization for body/headers/response |
| `onError` | `(error, { droppedCount }) => void` | No | Structured warn JSON | Upload failure callback |
| `circuitBreaker` | `CircuitBreakerConfig` | No | See below | Circuit breaker |
| `errorThrottle` | `ErrorThrottleConfig` | No | See below | Error throttling |
| `stdout` | `StdoutConfig` | No | See below | stdout dual-write |
| `sampleRate` | `number` | No | `1` | `0–1`, sampling rate |
| `requestIdHeader` | `string` | No | `'x-request-id'` | Header read when there's no `req.id` |
| `getAppId` | `ContextGetter` | No | — | Custom appId |
| `getUserId` | `ContextGetter` | No | — | Custom userId |
| `getAuthType` | `ContextGetter` | No | — | Custom authType |

`ContextGetter`:

```typescript
(context: RequestLoggerContext) => string | undefined | Promise<string | undefined>
```

`RequestLoggerContext` contains: `req`, `response`, `method`, `url`, `path`, `headers`, `body`, `responseData`.

### `CircuitBreakerConfig`

| Parameter | Default | Description |
|------|------|------|
| `failureThreshold` | `5` | Opens the circuit after this many consecutive failures |
| `resetTimeout` | `60000` | Wait time before retrying after the circuit opens (ms) |

### `ErrorThrottleConfig`

| Parameter | Default | Description |
|------|------|------|
| `interval` | `60000` | Throttle interval for errors of the same kind (ms) |

### `StdoutConfig`

| Parameter | Default | Description |
|------|------|------|
| `enabled` | `true` | Outputs whenever `enabled !== false` |
| `format` | `'json'` | `'json'` \| `'text'` |
| `includeBody` | `true` | Whether to include the request body |
| `includeResponse` | `false` | Whether to include the response body |

### `SanitizeConfig`

| Parameter | Default | Description |
|------|------|------|
| `removeFields` | password / secret, etc. | Exact field-name match (lowercase) → placeholder |
| `maskFields` | token / authorization, etc. | Field name contains match → partially masked |
| `placeholder` | `'[REDACTED]'` | Placeholder |
| `maxDepth` | `10` | Recursion depth |

Also exported: `sanitize`, `sanitizeHeaders`, `isSensitiveField` (see the package source).

### Upload Payload (Illustrative)

```typescript
{
  method, url, path, headers, body, query,
  status, duration, service,
  appId, authType, userId, clientKey, platform, appVersion,
  ip, traceId, userAgent,
  createdAt, response,
  clientIp?, requestId?
}
```

## Best Practices

- `url` + `service` are **required**; locally, point `url` at a fake service or set `enabled: false`  
- Mount `requestId()` before `requestLogger()` so `traceId` / `requestId` stay consistent  
- Use `excludePaths` or route `log: false` for health checks and metrics  
- Use `sampleRate` at high QPS; don't enable `stdout.includeResponse` for response bodies by default  
- For scenarios without a logged-in user, like payment callbacks, use `getAppId` to look up the tenant from the body

## Notes

- Uploading runs **asynchronously after** `next()` and doesn't block the response; failures only trigger the circuit breaker / `onError`, never affecting business logic  
- The body is read via `req.clone()` before business logic; paths that skip logging (excluded / `log: false` / sampled out) **don't** read the body  
- `/health` is not excluded by default; configure `excludePaths` yourself  
- The default JWT `userId` parsing **doesn't verify signatures**; it's only for log attribution  
- The sanitize config fields are `removeFields` / `maskFields`, not `fields` / `mask`

## Related Links

- [Logger](/en/middleware/logger)
- [Request ID](/en/middleware/request-id)
- [Best Practices](/en/essential/best-practice)
