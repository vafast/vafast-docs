---
title: Advanced Usage - Vafast API Client
description: 'Advanced Vafast API client usage: interceptors, auth headers, retries, timeouts, multiple services, custom fetch and error handling for type-safe TypeScript API calls.'
---

# Advanced Usage

Multi-tenant headers, token refresh queues, multi-service / multi-context clients, the untyped fallback, upload orchestration and more. For the basics, see the [Overview](/en/api-client/overview) and [Basic Usage](/en/api-client/fetch).

## Dynamic Headers (app-id / token)

```typescript
import { defineMiddleware } from '@vafast/api-client'

/** Multi-tenancy: send the app-id with every request */
const appIdMiddleware = defineMiddleware(async (ctx, next) => {
  ctx.headers.set('app-id', import.meta.env.VITE_APP_ID)
  return next()
}, { name: 'app-id' })

/** Optional login: only send Authorization when there's a token */
const tokenMiddleware = defineMiddleware(async (ctx, next) => {
  const token = localStorage.getItem('token')
  if (token) {
    ctx.headers.set('Authorization', `Bearer ${token}`)
  }
  return next()
}, { name: 'token' })
```

## Token Expiry: Single-Flight Refresh + Queued Retries

When several requests hit the expired-token code at the same time, refresh only once; the rest wait in a queue for the new token and then retry:

```typescript
const TOKEN_EXPIRED = 40101 // business code agreed with the auth service

let refreshing = false
let queue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

async function refreshAccessToken(): Promise<string> {
  const res = await fetch('/auth/api/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'app-id': APP_ID },
    body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
  })
  const body = await res.json()
  if (!body.jwtToken) throw new Error(body.message ?? 'refresh failed')
  localStorage.setItem('token', body.jwtToken)
  return body.jwtToken
}

const tokenRefreshMiddleware = defineMiddleware(async (ctx, next) => {
  const response = await next()
  if (response.error?.code !== TOKEN_EXPIRED) return response

  if (refreshing) {
    const token = await new Promise<string>((resolve, reject) => {
      queue.push({ resolve, reject })
    })
    ctx.headers.set('Authorization', `Bearer ${token}`)
    return next()
  }

  refreshing = true
  try {
    const token = await refreshAccessToken()
    queue.forEach((p) => p.resolve(token))
    queue = []
    ctx.headers.set('Authorization', `Bearer ${token}`)
    return next()
  } catch (e) {
    queue.forEach((p) => p.reject(e))
    queue = []
    // clear the session, redirect to login…
    return response
  } finally {
    refreshing = false
  }
}, { name: 'token-refresh' })
```

## Middleware Stacking Order

Recommended: **business headers / auth → refresh → retry / logging**.

```typescript
import { createClient, retryMiddleware, loggerMiddleware } from '@vafast/api-client'

const client = createClient({ baseURL: '/blog/api', timeout: 30_000 })
  .use(appIdMiddleware)
  .use(tokenMiddleware)
  .use(tokenRefreshMiddleware)
  .use(retryMiddleware({ count: 2, delay: 500 }))
  .use(loggerMiddleware({ prefix: '[blog]' }))
```

## Multiple Services

```typescript
import { createClient } from '@vafast/api-client'
import { createApiClient as createAuthClient } from './types/auth.generated'
import { createApiClient as createBlogClient } from './types/blog.generated'

const AUTH = { baseURL: '/auth/api', timeout: 30_000 }
const BLOG = { baseURL: '/blog/api', timeout: 30_000 }

export const auth = createAuthClient(
  createClient(AUTH).use(tokenMiddleware).use(tokenRefreshMiddleware),
)

export const blog = createBlogClient(
  createClient(BLOG).use(appIdMiddleware).use(tokenMiddleware).use(tokenRefreshMiddleware),
)

const { data, error } = await blog.posts.find.post({ current: 1, pageSize: 10 })
```

## Same Service, Different Tenant Contexts

Use the same generated types with different middleware to create multiple exports:

```typescript
const tenantAppId = defineMiddleware(async (ctx, next) => {
  ctx.headers.set('app-id', currentTenantId())
  return next()
})

const systemAppId = defineMiddleware(async (ctx, next) => {
  ctx.headers.set('app-id', SYSTEM_APP_ID)
  return next()
})

export const blog = createBlogClient(createClient(BLOG).use(tenantAppId).use(tokenMiddleware))
export const blogSystem = createBlogClient(createClient(BLOG).use(systemAppId).use(tokenMiddleware))

/** Call a specific tenant's API ad hoc */
export function createBlogForTenant(appId: string) {
  const mw = defineMiddleware(async (ctx, next) => {
    ctx.headers.set('app-id', appId)
    return next()
  })
  return createBlogClient(createClient(BLOG).use(mw).use(tokenMiddleware))
}
```

## Call Styles: REST vs. Body RPC

| Style | Example | Server side |
|------|------|------------|
| REST path params | `api.users({ id: '1' }).get()` | `GET /users/:id` |
| Body RPC | `api.users.find.post({ id: '1' })` | `POST /users/find` |

```typescript
const one = await api.users({ id: '1' }).get()

const list = await api.users.find.post({ current: 1, pageSize: 20 })
const detail = await api.users.findOne.post({ id: '1' })
```

## Without Generated Types: `client.request`

For gradual adoption or ad hoc paths, use the lower-level `request` (it still goes through middleware and still returns `{ data, error }`):

```typescript
const client = createClient('/queue/api').use(tokenMiddleware)

const { data, error } = await client.request<{ ok: boolean }>(
  'POST',
  '/jobs/run',
  { name: 'cleanup' },
)

if (error) {
  showError(error.message)
  return
}
console.log(data.ok)
```

## Sharing One Client Concurrently

```typescript
const [users, posts] = await Promise.all([
  blog.users.find.post({ current: 1, pageSize: 10 }),
  blog.posts.find.post({ current: 1, pageSize: 10 }),
])

if (users.error || posts.error) {
  showError(users.error?.message ?? posts.error?.message ?? 'Failed to load')
  return
}
```

## Upload Orchestration (Credentials → Direct Upload → Register)

Large files usually aren't sent in the API body; instead, orchestrate multiple `{ data, error }` steps and cancel with an `AbortSignal`:

```typescript
async function uploadFile(file: File, signal: AbortSignal) {
  const cred = await blog.upload.credentials.post({ filename: file.name }, { signal })
  if (cred.error) return cred

  await fetch(cred.data.uploadUrl, {
    method: 'PUT',
    body: file,
    signal,
    headers: cred.data.headers,
  })

  return blog.files.create.post(
    { key: cred.data.key, size: file.size },
    { signal },
  )
}

const controller = new AbortController()
const { data, error } = await uploadFile(file, controller.signal)
if (error) showError(error.message)
```

## Related

- [Overview](/en/api-client/overview)
- [Basic Usage](/en/api-client/fetch)
- [CLI](/en/tools/cli)
