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

**只有链末被调用的那一段**才是 HTTP 动词；前面的属性一律当作路径段。

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

### 注意事项：路径段与动词同名

路径里可能出现 `get` / `post` / `put` / `patch` / `delete` / `head` / `options` 这样的段名（例如 `POST /prices/delete`）。本库**不用** `$post` 之类前缀回避，约定是：

1. 中间段即使叫 `delete`，也只是路径的一部分  
2. **必须再写真正的 HTTP 动词**作为链末调用  

```typescript
// POST /prices/delete
await api.prices.delete.post({ ids: ['1', '2'] })

// GET /reports/export
await api.reports.export.get({ format: 'csv' })

// DELETE /prices/delete（路径末段与动词都是 delete）
await api.prices.delete.delete({ ids: ['1'] })
```

| 易混写法 | 实际含义 |
|----------|----------|
| `api.prices.delete()` | `DELETE /prices`（`delete` 被当成动词） |
| `api.prices.delete.post(...)` | `POST /prices/delete`（`delete` 是路径，`post` 是动词） |

补全与类型已按「路径节点 / 方法定义」区分，上表第二种可以正常提示。若接口路径段必须叫 `delete` 等，记住：**路径段后面一定要再跟 `.get` / `.post` / …**。

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

- [高级用法](/api-client/advanced) — 多租户、token 刷新、多服务、`client.request`、上传
- [概述](/api-client/overview)
- [测试](/api-client/test)
- [CLI](/tools/cli)
