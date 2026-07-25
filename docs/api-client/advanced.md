---
title: 高级用法 - Vafast API 客户端
---

# 高级用法

多租户 header、token 刷新队列、多服务 / 多上下文客户端、无类型 fallback、上传编排等。基础见 [概述](/api-client/overview)、[基础用法](/api-client/fetch)。

## 动态 Header（app-id / token）

```typescript
import { defineMiddleware } from '@vafast/api-client'

/** 多租户：每个请求带上 app-id */
const appIdMiddleware = defineMiddleware(async (ctx, next) => {
  ctx.headers.set('app-id', import.meta.env.VITE_APP_ID)
  return next()
}, { name: 'app-id' })

/** 可选登录：有 token 才带 Authorization */
const tokenMiddleware = defineMiddleware(async (ctx, next) => {
  const token = localStorage.getItem('token')
  if (token) {
    ctx.headers.set('Authorization', `Bearer ${token}`)
  }
  return next()
}, { name: 'token' })
```

## Token 过期：单飞刷新 + 排队重试

多个请求同时命中过期码时，只刷新一次，其余排队拿新 token 后重试：

```typescript
const TOKEN_EXPIRED = 40101 // 与认证服务约定的业务码

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
    // 清会话、跳登录…
    return response
  } finally {
    refreshing = false
  }
}, { name: 'token-refresh' })
```

## 中间件叠放顺序

建议：**业务 header / 鉴权 → 刷新 → 重试 / 日志**。

```typescript
import { createClient, retryMiddleware, loggerMiddleware } from '@vafast/api-client'

const client = createClient({ baseURL: '/blog/api', timeout: 30_000 })
  .use(appIdMiddleware)
  .use(tokenMiddleware)
  .use(tokenRefreshMiddleware)
  .use(retryMiddleware({ count: 2, delay: 500 }))
  .use(loggerMiddleware({ prefix: '[blog]' }))
```

## 多服务

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

## 同一服务、不同租户上下文

同一份 generated 类型，挂不同中间件拆成多个导出：

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

/** 临时打某个租户的 API */
export function createBlogForTenant(appId: string) {
  const mw = defineMiddleware(async (ctx, next) => {
    ctx.headers.set('app-id', appId)
    return next()
  })
  return createBlogClient(createClient(BLOG).use(mw).use(tokenMiddleware))
}
```

## 调用风格：REST vs Body RPC

| 风格 | 示例 | 对应服务端 |
|------|------|------------|
| REST 路径参数 | `api.users({ id: '1' }).get()` | `GET /users/:id` |
| Body RPC | `api.users.find.post({ id: '1' })` | `POST /users/find` |

```typescript
const one = await api.users({ id: '1' }).get()

const list = await api.users.find.post({ current: 1, pageSize: 20 })
const detail = await api.users.findOne.post({ id: '1' })
```

## 无生成类型：`client.request`

渐进接入或临时路径可用底层 `request`（仍走中间件、仍是 `{ data, error }`）：

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

## 并发共享同一 client

```typescript
const [users, posts] = await Promise.all([
  blog.users.find.post({ current: 1, pageSize: 10 }),
  blog.posts.find.post({ current: 1, pageSize: 10 }),
])

if (users.error || posts.error) {
  showError(users.error?.message ?? posts.error?.message ?? '加载失败')
  return
}
```

## 上传编排（凭证 → 直传 → 登记）

大文件常不把文件打进 API body，而是多步 `{ data, error }` 编排，并用 `AbortSignal` 取消：

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

## 相关

- [概述](/api-client/overview)
- [基础用法](/api-client/fetch)
- [CLI](/tools/cli)
