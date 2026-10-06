---
title: Webhook Middleware - Vafast
description: 'Vafast webhook middleware: declare webhook events on routes, sign and deliver payloads, verify signatures and retry failed deliveries reliably.'
---

# Webhook

`@vafast/webhook`: declare `webhook` on a route, and when the handler returns **HTTP 2xx with a `Content-Type` containing `application/json`**, the middleware pushes an event to subscribers **asynchronously** after the response is sent.

It solves "how to reliably notify external systems of the same result after a business endpoint succeeds", not a replacement for the business API itself.

## Key Concepts (for New Users)

### What Is an Event?

Each webhook corresponds to an **event key** `eventKey` (e.g. `user.created`, `auth.signIn`). The middleware resolves the `eventKey` from the route matched by the current request, asks storage "who subscribes to this event", then delivers to each.

`eventKey` source priority:

1. The route's `webhook.eventKey` (explicit)
2. Otherwise generated from the path: strip `pathPrefix`, then join the path segments with `.`  
   - `/users/create` → `users.create`  
   - `/restfulApi/auth/signIn` + `pathPrefix: '/restfulApi'` → `auth.signIn`

### Storage vs. Dispatcher

| Role | Responsibility | Typical implementation |
|------|------|----------|
| **Storage** | Look up subscriptions `findSubscriptions`, write delivery logs `saveLog` | `defineWebhooks` / MongoDB / remote HTTP |
| **Dispatcher** (optional) | Actually sends the event | Default local `fetch` POST; or hand off to a webhook-server via `createHttpDispatcher` |

Without a `dispatcher`: the middleware POSTs directly to the subscription's `endpointUrl` with local `fetch` and generates an HMAC signature header from the subscription's `secret`.  
With a `dispatcher`: delivery is handled by the dispatcher (the local `fetch` / HMAC path is skipped), while storage still looks up subscriptions and writes logs.

### How Does the Response Become the Outgoing Body?

The middleware:

1. `clone`s the response and parses it with `json()`
2. Uses `isSuccess` to decide whether to fire (default: a JSON **object**, not an array)
3. Uses `getData` to extract the business object (default: the whole JSON object)
4. If `condition` is configured and returns false, doesn't fire
5. Applies the field policy: sensitive fields → `include` → `exclude` → `transform` → appends `clientIp` / `userAgent` / `timestamp`
6. Dispatches asynchronously via `setImmediate`, **without blocking** the original HTTP response

## Installation

```bash
npm install @vafast/webhook
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { webhook, defineWebhooks } from '@vafast/webhook'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    name: 'Create user',
    description: 'Notify subscribers after successful sign-up',
    webhook: {
      eventKey: 'user.created',
      exclude: ['password'],
    },
    handler: ({ body }) => ({ id: '123', ...body }),
  }),
])

const storage = defineWebhooks([
  {
    eventKey: 'user.created',
    url: 'https://example.com/webhook',
    secret: process.env.WEBHOOK_SECRET!,
  },
])

const server = new Server(routes)
server.use(webhook({ storage }))
serve({ fetch: server.fetch, port: 3000 })
```

Shorthand: `webhook: true` or `webhook: {}` (equivalent; `eventKey` is derived from the path). Use `pathPrefix` to strip your API prefix before generating the `eventKey`.

## Usage

### Route Fields

| Field | Location | Description |
|------|------|------|
| `webhook` | Route extension | `true` or a config object (see below) |
| `name` | Route itself | Event display name; **not** a field inside `webhook` |
| `description` | Route itself | Event description; **not** a field inside `webhook` |

```typescript
webhook: true
// or
webhook: {
  eventKey?: string
  include?: string[]
  exclude?: string[]
  condition?: (data: Record<string, unknown>) => boolean
  transform?: (data: Record<string, unknown>, req: Request) => Record<string, unknown>
}
```

### `include` / `exclude` / `condition` / `transform`

Field processing in `processFields` runs in a fixed order:

1. **Always strip** `sensitiveFields` (see the default list below; can be overridden in the middleware config)
2. **`include` (allowlist)**: if configured and non-empty, keep only the listed fields
3. **`exclude` (blocklist)**: then remove the listed fields
4. **`transform`**: custom rewrite; signature `(data, req) => Record<string, unknown>`
5. **Append common fields**: `clientIp`, `userAgent`, `timestamp` (ISO)

`condition` is evaluated before field processing, against the raw business object returned by `getData`: returning `false` means no event. When not configured, it always fires.

```typescript
webhook: {
  eventKey: 'order.paid',
  include: ['orderId', 'amount', 'currency'],
  exclude: ['internalNote'],
  condition: (data) => data.status === 'paid',
  transform: (data, req) => ({
    ...data,
    requestId: req.headers.get('x-request-id'),
  }),
}
```

### Trigger Conditions

The middleware dispatches only when all of the following hold:

1. The response is `ok` (HTTP 2xx)
2. `Content-Type` contains `application/json`
3. The route has `webhook` registered
4. `isSuccess(data)` is true (default: `isWebhookResponseSuccess`, which requires a JSON object body)
5. `condition` (if configured) is true

Dispatch runs asynchronously in `setImmediate`; failures are only logged / `saveLog`ged and **don't affect** the original HTTP response.

### Storage

```typescript
interface WebhookStorage {
  findSubscriptions(
    appId: string | undefined,
    eventKey: string,
  ): Promise<WebhookSubscription[]>
  saveLog(log: WebhookLog): Promise<void>
}
```

| API | Use case |
|-----|------|
| `defineWebhooks([...])` | In-memory / config-based subscriptions; `eventKey` supports wildcards like `auth.*` |
| `createWebhookStorage({...})` | MongoDB adapter (filters by `sourceService`) |
| `createHttpStorage({...})` | Remote webhook-server HTTP storage (`/internal/findSubscriptions`, `/internal/saveLog`) |
| Custom implementation | Any database / Redis / API |

`defineWebhooks` entries use `url`, mapped internally to the subscription's `endpointUrl`; it also has `add` / `logs` / `clearLogs` for testing.

### Subscription Fields (`WebhookSubscription`)

| Field | Description |
|------|------|
| `id` | Subscription ID; logged as `webhookId` |
| `appId` | Optional; used for matching in multi-tenant setups; can be omitted for single-tenant |
| `eventKey` | Subscribed event key (in-memory storage supports `xxx.*` wildcards) |
| `endpointUrl` | Delivery target URL |
| `secret` | Optional; used for the HMAC-SHA256 signature header in local delivery |
| `signSecret` | Optional; passed through to the dispatcher / webhook-server (the local `fetch` path uses `secret`) |
| `deliveryType` | Optional; e.g. `generic` / `feishu` / `dingtalk` / `wecom` / `slack` |
| `status` | `'enabled' \| 'disabled'`; only `enabled` subscriptions are returned |
| `sourceService` | Optional; source service identifier (Mongo/HTTP storage filters by it) |
| `name` | Optional; display name |
| `type` | Optional; for categorization |

### Storage vs. Dispatcher (Once More)

```typescript
// development: in-memory subscriptions + direct local delivery
server.use(webhook({ storage: defineWebhooks([...]) }))

// production microservices: HTTP subscription lookup/logging + HTTP delivery
server.use(
  webhook({
    storage: createHttpStorage({ baseUrl, sourceService, apiKeyId, apiKeySecret }),
    dispatcher: createHttpDispatcher({ baseUrl, apiKeyId, apiKeySecret }),
  }),
)
```

- **Storage only**: this process `fetch`es the subscription URL and signs when a `secret` is present.
- **Storage + dispatcher**: `dispatcher.dispatch(...)` delivers; signing / channel adaptation is handled remotely.

### HMAC Signatures (Local Delivery)

When the subscription has a `secret`, outgoing requests include:

```http
X-Webhook-Signature: <hex>
```

Algorithm: `HMAC-SHA256(secret)` over the **full JSON body string**, output as hex. Receivers should verify with the same algorithm. With a `dispatcher` configured, this header is not computed locally.

### Retries (`retry`)

Total attempts = `(retry.count ?? 0) + 1` (`count` is the number of retries after a failure).  
After the `i`-th failure (if another attempt remains), it waits:

```text
min(delay * backoff^i, maxDelay)
```

| Field | Default | Description |
|------|------|------|
| `count` | `0` | Retries after a failure (0 = only one attempt) |
| `delay` | `1000` | Initial interval (ms) |
| `backoff` | `2` | Exponential backoff multiplier |
| `maxDelay` | `30000` | Interval cap (ms) |

`attempt` in the logs is the actual attempt number (starting at 1).

### Manual Dispatch

The signature is **`(storage, logger, options)`**; don't put storage inside options:

```typescript
import { dispatchWebhook } from '@vafast/webhook'

dispatchWebhook(storage, logger, {
  appId,
  eventKey: 'auth.oauth',
  data: { userId, provider },
  req,
})
```

Useful for cases like OAuth callbacks that return a redirect and can't use the automatic JSON hook. Manual dispatch adds `clientIp` / `userAgent` / `timestamp`, but does **not** apply the route's `include` / `exclude` / `sensitiveFields` / `condition` / `transform`.

### Delivery Payload and Headers

The outgoing body looks roughly like:

```json
{
  "eventId": "evt_...",
  "eventType": "auth",
  "eventKey": "auth.signIn",
  "timestamp": "2026-01-07T12:00:00.000Z",
  "appId": "app_123",
  "data": { "...": "business fields + clientIp / userAgent / timestamp" }
}
```

`eventType` is the segment of `eventKey` before the first `.`; `appId` is only written when present.

| Header | Description |
|--------|------|
| `Content-Type` | `application/json` |
| `X-Webhook-Event` | Event key |
| `X-Webhook-Event-Id` | Event ID for idempotency (`evt_{timestamp}_{random}`) |
| `X-Webhook-Timestamp` | ISO time |
| `X-Webhook-Signature` | HMAC-SHA256 when the subscription has a `secret` and local delivery is used |

### Querying Route Events

```typescript
import {
  getAllWebhookEvents,
  getWebhookCategories,
  getWebhookEventsByCategory,
} from '@vafast/webhook'

getAllWebhookEvents('/restfulApi')
getWebhookCategories('/restfulApi')
getWebhookEventsByCategory('auth', '/restfulApi')
```

### Type Extension

```typescript
import { withContext } from 'vafast'
import type { WebhookRouteExtensions } from '@vafast/webhook'

const defineRoute = withContext<MyContext, WebhookRouteExtensions>()
```

If you use `defineAuthRouteWithApp` from `@vafast/auth-middleware` in production, a slimmed-down `webhook` type is built in (no `condition` / `transform`).

## API

### `webhook(config)`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `storage` | `WebhookStorage` | — | **Required**. Looks up subscriptions, writes logs |
| `dispatcher` | `WebhookDispatcher` | Local `fetch` | Optional; e.g. `createHttpDispatcher` |
| `logger` | `WebhookLogger` | console wrapper | `debug` / `info` / `warn` / `error` |
| `pathPrefix` | `string` | `''` | Path prefix stripped when generating `eventKey` |
| `sourceService` | `string` | — | Exists in the type; **not currently read by the middleware**. Configure it on `createWebhookStorage` / `createHttpStorage` |
| `getAppId` | `(req) => string \| null \| undefined` | Not set | Multi-tenancy; single-tenant by default (no appId). Does **not** read `app-id` automatically |
| `isSuccess` | `(data) => boolean` | `isWebhookResponseSuccess` | Whether to fire |
| `getData` | `(data) => Record<string, unknown>` | `getWebhookResponseData` | Extracts the payload from the response |
| `timeout` | `number` | `30000` | Local delivery timeout (ms) |
| `sensitiveFields` | `string[]` | See table below | Fields always stripped |
| `retry` | `RetryConfig` | No retries | See above |
| `concurrency` | `number` | `10` | Max concurrent deliveries per event |

### Default `sensitiveFields` (Source Constant)

These fields are removed before `include` / `exclude`:

| Field |
|------|
| `password` |
| `token` |
| `jwtToken` |
| `refreshToken` |
| `secret` |
| `accessToken` |
| `apiKey` |

Override the whole list with `webhook({ sensitiveFields: [...] })`.

### `dispatchWebhook(storage, logger, options)`

| Parameter | Description |
|------|------|
| `storage` | `WebhookStorage` |
| `logger` | `WebhookLogger` |
| `options.appId` | Optional |
| `options.eventKey` | Event key |
| `options.data` | Business data |
| `options.req` | Used to fill in `clientIp` / `userAgent` |
| `options.timeout` | Default `30000` |
| `options.retry` | Same as the middleware |
| `options.concurrency` | Default `10` |
| `options.dispatcher` | Optional |

### `RetryConfig`

| Field | Default | Description |
|------|------|------|
| `count` | `0` | Retries after a failure |
| `delay` | `1000` | Initial interval (ms) |
| `backoff` | `2` | Exponential backoff multiplier |
| `maxDelay` | `30000` | Interval cap |

### Factories and Utilities

| Export | Description |
|------|------|
| `defineWebhooks` | In-memory subscriptions + `add` / `logs` / `clearLogs`; supports `eventKey` wildcards |
| `createWebhookStorage` | MongoDB; requires `collection` + `sourceService` |
| `createHttpStorage` | HTTP subscription lookup / logging |
| `createHttpDispatcher` | HTTP delivery (`/internal/dispatchEvent`, default timeout 10000ms) |
| `isWebhookResponseSuccess` / `getWebhookResponseData` | Default success check and data extraction |
| `getWebhookEventConfig` / `getAllWebhookEvents` / … | Route event queries |
| `generateSignature` / `generateEventId` / `DEFAULT_SENSITIVE_FIELDS` | Utilities and constants |

## Best Practices

- Describe events with the route's `name` / `description`; keep only trigger and field policies in `webhook`.
- Prefer a persistent `WebhookStorage` in production; `defineWebhooks` is fine for development.
- Configure a `secret` on subscriptions and have receivers verify `X-Webhook-Signature`.
- Use `eventId` (`X-Webhook-Event-Id`) for idempotency; use `retry` + `concurrency` to handle failures without overwhelming downstream.
- For microservices: hand off to a central webhook-server with `createHttpStorage` + `createHttpDispatcher`.
- Use `condition` to fire based on business semantics and `transform` to reshape data, instead of stuffing webhook-specific fields into the handler.

## Notes

- Only 2xx + JSON is handled; redirects / HTML / non-object JSON (with the default `isSuccess`) don't fire automatically.
- The default sensitive fields remove those listed above; still consider adding `exclude` on the business side.
- `getAppId` does **not** read `app-id` by default; omit it for single-tenant and implement it yourself for multi-tenant.
- `WebhookMiddlewareConfig.sourceService` is currently unused by the middleware; configure it on the storage factory.
- Dispatch failures are only logged / `saveLog`ged and don't affect the original HTTP response.
- `dispatchWebhook` doesn't apply route-level field policies or `sensitiveFields`.

## Related Links

- [Auth Middleware](/en/middleware/auth-middleware)
- [Middleware Overview](/en/middleware/overview)
- [Best Practices](/en/essential/best-practice)
