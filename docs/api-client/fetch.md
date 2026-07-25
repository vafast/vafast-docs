---
title: 基础用法 - Vafast API 客户端
---

# 基础用法

所有请求返回 Go 风格的 `{ data, error }`：**不要**用 try/catch 判断业务失败（网络层异常才会抛出）。

## 创建客户端

```typescript
import { createClient, eden } from '@vafast/api-client'
import { createApiClient } from './api.generated' // CLI 生成，可选

const client = createClient({
  baseURL: 'https://api.example.com',
  timeout: 30_000,
  headers: { 'X-App-Id': 'my-app' },
})

// 有生成类型时
const api = createApiClient(client)

// 或手动契约
// const api = eden<Api>(client)
```

## 链式调用

最后一个方法决定 HTTP 动词，中间段是路径：

```typescript
// GET /users?page=1
const { data, error } = await api.users.get({ page: 1 })

// POST /users
const created = await api.users.post({ name: 'Ada' })

// GET /users/123
const one = await api.users({ id: '123' }).get()

// PUT /users/123
const updated = await api.users({ id: '123' }).put({ name: 'Ada Lovelace' })

// DELETE /users/123
const removed = await api.users({ id: '123' }).delete()
```

| 写法 | 请求 |
|------|------|
| `api.users.get(query?)` | `GET /users` |
| `api.users.post(body)` | `POST /users` |
| `api.users({ id }).get()` | `GET /users/:id` |
| `api.users.find.post(body)` | `POST /users/find` |

## Go 风格错误处理

```typescript
const { data, error } = await api.users.get({ page: 1 })

if (error) {
  // error: { code: number; message: string; type?: ErrorType; details?: ErrorDetail[] }
  console.error(`${error.code}: ${error.message}`)
  return
}

// 此处 data 非 null
console.log(data.users)
```

按状态码分支：

```typescript
const { data, error } = await api.users.post(form)

if (error) {
  switch (error.code) {
    case 401:
      redirectToLogin()
      break
    case 403:
      showPermissionDenied()
      break
    case 422:
      // 见下方校验错误
      break
    default:
      showError(error.message)
  }
  return
}

console.log(data)
```

### 422 Schema 校验错误

与服务端一致：HTTP 422 + `details`。用工具函数绑表单：

```typescript
import { isValidationError, mapDetailsToFormFields } from '@vafast/api-client'

const { error } = await api.users.post(formData)

if (error && isValidationError(error)) {
  formRef.setFields(mapDetailsToFormFields(error.details))
  return
}
```

| `error.type` | 含义 | 典型 `code` |
|--------------|------|-------------|
| `network` | 无法连接 | `0` |
| `timeout` | 超时 | `408` |
| `abort` | 被取消 | `0` |
| `server` | 4xx / 5xx | HTTP 状态码 |
| `parse` | 响应解析失败 | `0` |

## 请求级配置

第二参数传 `RequestConfig`（如取消、超时、额外头）：

```typescript
const controller = new AbortController()

const { data, error } = await api.users.get(
  { page: 1 },
  {
    signal: controller.signal,
    timeout: 5_000,
    headers: { Authorization: `Bearer ${token}` },
  },
)

// 取消
controller.abort()
```

## 中间件

```typescript
import { createClient, defineMiddleware, retryMiddleware, loggerMiddleware } from '@vafast/api-client'

const auth = defineMiddleware(async (ctx, next) => {
  const token = localStorage.getItem('token')
  if (token) ctx.headers.set('Authorization', `Bearer ${token}`)

  const res = await next()

  if (res.status === 401) {
    // Token 过期：刷新或跳登录
  }
  return res
})

const client = createClient({ baseURL: '/api' })
  .use(auth)
  .use(retryMiddleware({ count: 3, delay: 1000 }))
  .use(loggerMiddleware({ prefix: '[API]' }))
```

## SSE

普通方法后接 `.sse()`（走同一套中间件）：

```typescript
const sub = api.chat.stream.post({ prompt: '你好' }).sse({
  onMessage: (chunk) => console.log(chunk),
  onError: (error) => console.error(error),
  onClose: () => console.log('done'),
})

sub.unsubscribe()
```

## 完整示例

```typescript
import { createClient, isValidationError, mapDetailsToFormFields } from '@vafast/api-client'
import { createApiClient } from './api.generated'

const api = createApiClient(
  createClient({ baseURL: '/api', timeout: 30_000 }),
)

async function loadUsers(page: number) {
  const { data, error } = await api.users.get({ page })
  if (error) {
    showError(error.message)
    return null
  }
  return data
}

async function createUser(form: { name: string; email: string }) {
  const { data, error } = await api.users.post(form)
  if (error) {
    if (isValidationError(error)) {
      formRef.setFields(mapDetailsToFormFields(error.details))
      return null
    }
    showError(error.message)
    return null
  }
  return data
}
```

## 下一步

- [概述](/api-client/overview) — SSE、多服务配置
- [测试](/api-client/test)
- [CLI](/tools/cli) — 同步服务端类型
