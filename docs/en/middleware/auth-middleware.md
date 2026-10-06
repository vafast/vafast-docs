---
title: Auth Middleware - Vafast
description: 'Vafast auth middleware: JWT and API key authentication against a separate auth service, app-id handling, requireUser/requireApp guards and type-safe route wrappers.'
---

# Auth Middleware

`@vafast/auth-middleware` integrates with a separate **auth-server** and provides JWT / API key **hard authentication**, `app-id` validation, guards and typed route definers.

Hard authentication means: once the middleware is attached, verification must succeed; failures return an error response immediately, and there's no preconfigured "treat failed verification as a guest and continue" path. Attach it where auth is required, leave it off where it isn't.

## Key Concepts (for New Users)

### Bearer JWT vs API Key

Clients always use the same request header:

```http
Authorization: Bearer <credential>
```

The middleware distinguishes the two methods by **whether the credential contains a colon `:`**:

| Method | Credential shape | Behavior |
|------|----------|------|
| **JWT** | A token string without `:` | Calls auth-server `/verifyJwt`; optionally passes the `app-id` request header along |
| **API Key** | `apiKeyId:secretKey` (contains a colon) | Calls `/verifyApiKey`; injects `userInfo` + `apiKey` |

Therefore:

- `jwtAuth` / `authenticateJwt`: if the token contains `:`, returns 401 immediately ("无效的 JWT Token", i.e. invalid JWT token)
- `apiKeyAuth` / `authenticateApiKey`: if the token doesn't contain `:`, returns 401 immediately ("无效的 API Key 格式", i.e. invalid API key format)
- `auth` / `authenticate` / `authWithApp`: branch automatically on whether `:` is present

Note: the Bearer API key here (a user/caller credential) and the `AUTH_SERVICE_API_KEY_ID` / `SECRET` your service process uses to call auth-server (service-to-service communication) are two separate things.

### `app-id` and Multi-Tenancy

Multi-tenant endpoints usually require the request header:

```http
app-id: <appId>
```

| Middleware | Purpose |
|--------|------|
| `appValidator` / `validateApp` | Validates `app-id` and injects `app` |
| `authWithApp` / `authenticateWithApp` | Authenticates the user **and** validates `app-id`, injecting `userInfo` + `app` in one go (plus `apiKey` for API keys) |

On the JWT path, `authWithApp` passes `app-id` to `verifyJwt`; if the returned user info has no `app`, it's treated as an invalid `app-id` (400).  
On the API key path, it additionally calls `verifyApp(appId)`.

If a matching `app` (or `userInfo.app`) is already in the context, `validateApp` / `appValidator` reuse it to avoid duplicate requests.

### Failure Codes: 401 vs. 400

This package deliberately separates "identity problems" from "tenant / app problems":

| Scenario | Typical status | Description |
|------|------------|------|
| Missing / invalid `Authorization` | **401** | No credentials, invalid JWT / API key, disabled/deleted account, etc. |
| JWT / API key verification fails | **401** | auth-server error codes in 400–599 are passed through; otherwise falls back to 401 |
| Missing `app-id` (required) | **400** | E.g. "缺少必需的请求头: app-id" (missing required header: app-id) |
| Invalid `app-id` | **400** | Falls back to 400 by default; 4xx/5xx codes returned by auth-server may be passed through |
| Guard: no `userInfo` / no `apiKey` | **401** | `requireUser` / `requireApiKey` |
| Guard: no `app` | **400** | `requireApp` |
| Guard: `requireUserAndApp` | User checked first (**401**), then app (**400**) | |
| auth-server timeout | **504**-style | Message: auth service timed out… |
| auth-server unavailable (network, etc.) | **503**-style | Message: auth service temporarily unavailable… |

Implementation detail: user authentication failures mostly use `throw err(...)`; missing/invalid `app-id` mostly uses `Response.json({ code, message }, { status })`. To callers, both are the corresponding HTTP status.

## Installation

```bash
npm install @vafast/auth-middleware
```

## Quick Start

Configure the environment variables, then use the preconfigured middleware directly:

```bash
AUTH_API_BASE_URL=http://localhost:9003
AUTH_SERVICE_API_KEY_ID=ak_xxx
AUTH_SERVICE_API_KEY_SECRET=sk_xxx
# optional: AUTH_API_TIMEOUT=5000
```

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'

const routes = defineRoutes([
  defineRoute({
    path: '/api/files',
    middleware: [authWithApp],
    children: [
      defineAuthRouteWithApp({
        method: 'GET',
        path: '/list',
        middleware: [requireUser],
        handler: ({ userInfo, app }) => ({
          userId: userInfo.id,
          appId: app.id,
        }),
      }),
    ],
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

## Usage

### Environment Variables

| Variable | Required | Description |
|------|------|------|
| `AUTH_API_BASE_URL` | Yes* | auth-server base URL |
| `AUTH_SERVICE_API_KEY_ID` | No | Service-to-service API key ID |
| `AUTH_SERVICE_API_KEY_SECRET` | No | Service-to-service API key secret |
| `AUTH_API_TIMEOUT` | No | Timeout in ms, default `5000` |

\* `createAuthClient` / the lazily loaded preconfigured middleware throw when `baseUrl` is missing (neither passed nor set in the environment).

### Request Headers

| Header | Description |
|--------|------|
| `Authorization: Bearer <jwt>` | JWT (the token must not contain `:`) |
| `Authorization: Bearer <apiKeyId>:<secret>` | API key (must contain a colon) |
| `app-id: <appId>` | Multi-tenancy / `validateApp` / `authWithApp` |

### Preconfigured Middleware (Lazy Singletons)

On the first request, `createAuthClient()` reads the environment variables; the same client is reused afterwards.

| Export | Behavior | Injected context |
|------|------|------------|
| `auth` | Auto-detects JWT + API key | `userInfo`, plus `apiKey` for API keys |
| `jwtAuth` | JWT only (`:` is treated as invalid) | `userInfo` |
| `apiKeyAuth` | API key only | `userInfo` + `apiKey` |
| `appValidator` | Requires `app-id` and validates it over the network | `app` |
| `authWithApp` | User auth + app (most common) | `userInfo` + `app` (plus `apiKey` for API keys) |

```typescript
import { auth, appValidator, authWithApp } from '@vafast/auth-middleware'

middleware: [auth, appValidator]
// or all in one step
middleware: [authWithApp]
```

### Factory Functions (Custom Config / Shared Client)

```typescript
import {
  createAuthClient,
  authenticate,
  authenticateJwt,
  authenticateApiKey,
  validateApp,
  authenticateWithApp,
} from '@vafast/auth-middleware'

const client = createAuthClient({
  baseUrl: 'http://127.0.0.1:9003',
  apiKeyId: 'xxx',
  apiKeySecret: 'yyy',
})

const authMw = authenticate(client) // or authenticate({ baseUrl: '...' }) / authenticate()
const jwtOnly = authenticateJwt()
const keyOnly = authenticateApiKey()
const appMw = validateApp(undefined, { required: false, verify: true })
const both = authenticateWithApp(client)
```

| Factory | Semantic alias | Description |
|------|------------|------|
| `authenticate` | `authJwtAndApiKey` | JWT + API Key |
| `authenticateJwt` | `authJwt` | JWT only |
| `authenticateApiKey` | `authApiKey` | API key only |
| `validateApp` | `validateAppId` | Validates `app-id` |
| `authenticateWithApp` | `authApp` | User + app |

`AuthMiddlewareOptions` = `AuthClientConfig | AuthClient | undefined`.

`options` for `validateApp(config?, options?)`:

| Field | Default | Description |
|------|------|------|
| `required` | `true` | Whether to reject when `app-id` is missing / invalid |
| `verify` | `true` | When `false`, only checks the header and injects a minimal `{ id, name: '', status: 'active' }` |

### Guards (No Network Requests)

They only check the `__locals` context:

| Guard | Condition | On failure |
|------|------|------|
| `requireUser` | Has `userInfo` | 401 ("未登录或用户信息缺失", not logged in or user info missing) |
| `requireApp` | Has `app` | 400 ("缺少有效的 app-id", missing a valid app-id) |
| `requireApiKey` | Has `apiKey` | 401 ("无效的 API Key", invalid API key) |
| `requireUserAndApp` | Has both `userInfo` + `app` | Missing user 401 / missing app 400 |

```typescript
middleware: [auth, appValidator, requireUserAndApp]
```

Typical combination: attach `authWithApp` (or `auth` + `appValidator`) to the route group, then `requireUser` etc. on leaves for both type and runtime guarantees.

### Route Definers

Built on `withContext` with zero runtime overhead, filling in handler types; includes `RouteExtensions.webhook`:

| Definer | Handler context |
|--------|----------------|
| `defineAuthRoute` | `{ userInfo: UserInfo }` |
| `defineOptionalAuthRoute` | `{ userInfo?: UserInfo }` |
| `defineApiKeyRoute` | `{ userInfo?, apiKey? }` |
| `defineAuthRouteWithApp` | `{ userInfo, app }` |
| `defineRouteWithApp` | `{ app }` |
| `defineOptionalAuthRouteWithApp` | `{ userInfo?, app }` |
| `defineFullAuthRoute` | `{ userInfo, apiKey?, app }` |

```typescript
defineAuthRouteWithApp({
  method: 'POST',
  path: '/create',
  name: 'Create resource',
  webhook: true, // or { eventKey, include, exclude }
  middleware: [requireUser],
  handler: ({ userInfo, app }) => ({ userId: userInfo.id, appId: app.id }),
})
```

`RouteExtensions.webhook` is `boolean | { eventKey?, include?, exclude? }` (slimmer than the full `@vafast/webhook` config; `condition` / `transform` require the webhook package's type extension).

### Auth Client

```typescript
const client = createAuthClient()

await client.verifyJwt(token, appId?)
await client.verifyApiKey(apiKeyId, secretKey)
await client.verifyApp(appId)
await client.getUsersBatch(userIds, options?)
await client.searchUsers({ keyword, appId, current, pageSize }, options?)
await client.getUsersStats({ appId, startTime, endTime }, options?)
```

Timeouts / network errors are normalized to 504 / 503-style error messages; disabled / deleted JWT accounts return 401.

## API

### `createAuthClient(config?)`

| Field | Type | Default | Description |
|------|------|------|------|
| `baseUrl` | `string` | `AUTH_API_BASE_URL` | Throws if missing |
| `apiKeyId` | `string` | `AUTH_SERVICE_API_KEY_ID` | Service-to-service Bearer |
| `apiKeySecret` | `string` | `AUTH_SERVICE_API_KEY_SECRET` | Combined with the ID as `id:secret` |
| `timeout` | `number` | `AUTH_API_TIMEOUT` or `5000` | Milliseconds |

### `UserInfo` and Organization Fields

```typescript
interface UserInfo {
  id: string
  appId: string
  email?: string
  phone?: string
  avatar?: string
  status?: string
  roleId?: string
  nickname?: string
  verified?: boolean
  /** Organization the member belongs to. Organization member identities belong directly to the organization. */
  organizationId?: string
  /** organization_member is an organization member; customer_user is an end user of a customer app. */
  accountType?: string
  /** true when an organization member accesses across apps; distinguishes back-office accounts from target app end users */
  isOrgMemberAccess?: boolean
  /** The target app pointed to by this request's app-id; differs from the user's original appId on cross-app access */
  targetAppId?: string
  /** Access mode for this request: direct = a user of the current app accessing directly; org_member_delegate = an organization member accessing on behalf. */
  accessMode?: 'direct' | 'org_member_delegate'
}
```

| Field | Meaning (matches the source comments) |
|------|------------------------|
| `organizationId` | Organization the member belongs to; organization member identities belong directly to the organization |
| `accountType` | `organization_member` = organization member; `customer_user` = end user of a customer app |
| `isOrgMemberAccess` | `true` when an organization member accesses across apps; distinguishes back-office accounts from target app end users |
| `targetAppId` | The target app pointed to by this request's `app-id`; differs from the user's original `appId` on cross-app access |
| `accessMode` | `direct`: a user of the current app accessing directly; `org_member_delegate`: an organization member accessing on behalf |

`VerifiedUserInfo` extends `UserInfo` with an optional `app?: AppInfo` (JWT verification results may include a verified app summary).

### Other Context Types

```typescript
interface ApiKeyInfo {
  id: string
  name: string
  appId: string
  userId: string
  status: string
  permissions?: string[]
}

interface AppInfo {
  id: string
  name: string
  status: string
  /** Structured app extensions maintained by auth-server, e.g. organizationId */
  extensions?: Record<string, unknown>
}
```

### Exports at a Glance

- Client: `createAuthClient`, `AuthClient`, `AuthClientConfig`
- Preconfigured: `auth`, `jwtAuth`, `apiKeyAuth`, `appValidator`, `authWithApp`
- Factories: `authenticate`, `authenticateJwt`, `authenticateApiKey`, `validateApp`, `authenticateWithApp` and aliases
- Guards: `requireUser`, `requireApp`, `requireApiKey`, `requireUserAndApp`
- Route definers: the 7 in the table above
- Types: `UserInfo`, `VerifiedUserInfo`, `ApiKeyInfo`, `AppInfo`, `ApiKeyContext`, `ValidateAppContext`, `AuthWithAppContext`, `ValidateAppOptions`, `RouteExtensions`, `WebhookConfigOptions`, etc.

## Best Practices

- Attach `authWithApp` to route groups and guards like `requireUser` to leaves as assertions.
- Don't attach auth middleware to public endpoints.
- Share one `createAuthClient()` instance across middleware to avoid duplicate configuration.
- Put `cors` / `requestId` globally; put auth on route groups rather than forcing login globally.
- When you need to distinguish end users from organization member delegate access, read `accessMode` / `isOrgMemberAccess` / `targetAppId` instead of only `userInfo.id`.

## Notes

- **Hard authentication**: once attached, it must succeed; there's no preconfigured "soft login, continue on failure" middleware (for optional context, don't attach auth, or write your own logic).
- The preconfigured middleware depends on process environment variables; for tests or other base URLs, use the factories with an explicit `createAuthClient`.
- `authenticateJwt` / `jwtAuth` reject tokens containing `:`; `authenticateApiKey` / `apiKeyAuth` require `id:secret`.
- User credential failures are mostly **401**; missing/invalid `app-id` is mostly **400**. Don't mix the semantics.
- auth-server timeouts return 504-style messages; unavailability returns 503-style.
- The package's `webhook` type extension is only for declaration; actual dispatch requires installing the package and `server.use(webhook(...))`.

## Related Links

- [Middleware System](/en/middleware) — `defineMiddleware` / `withContext`
- [Webhook](/en/middleware/webhook)
- [Routing Guide](/en/routing)
- [JWT](/en/middleware/jwt) — local signing / verification utilities (no auth-server integration)
