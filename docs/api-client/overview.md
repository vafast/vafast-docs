---
title: API 客户端概述 - Vafast
---

# API 客户端概述

`@vafast/api-client` 是专为 Vafast 框架设计的类型安全 API 客户端，基于中间件架构，支持 Eden 风格链式调用。

## 核心特性

- 🎯 **类型安全** - 从 vafast 路由自动推断，或使用 CLI 同步类型
- 🧅 **中间件架构** - Koa 风格洋葱模型，灵活组合
- 🔄 **内置重试** - 支持指数退避、条件重试
- ⏱️ **超时控制** - 请求级别和全局超时
- 📡 **SSE 支持** - 流式响应、自动重连
- 🎨 **Go 风格错误** - `{ data, error }` 统一处理

## 安装

```bash
npm install @vafast/api-client
```

## 快速开始

```typescript
import { createClient, eden } from '@vafast/api-client'

// 1. 创建客户端（支持配置对象）
const client = createClient({
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  headers: { 'X-App-Id': 'my-app' }
}).use(authMiddleware)

// 2. Eden 类型包装
const api = eden<Api>(client)

// 3. 发起请求（Go 风格错误处理）
const { data, error } = await api.users.get({ page: 1 })

if (error) {
  console.error(`错误 ${error.code}: ${error.message}`)
  return
}

console.log(data.users)
```

## 核心 API

### createClient(config)

创建 HTTP 客户端，支持两种方式：

```typescript
// 方式 1：只传 baseURL
const client = createClient('http://localhost:3000')
  .timeout(30000)
  .use(authMiddleware)

// 方式 2：传配置对象（推荐）
const client = createClient({
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  headers: { 'X-App-Id': 'my-app' }
}).use(authMiddleware)
```

**配置对象：**

```typescript
interface ClientConfig {
  baseURL: string
  timeout?: number        // 默认 30000ms
  headers?: Record<string, string>
}
```

**链式方法：**

- `.use(middleware)` - 添加中间件
- `.headers(headers)` - 追加默认请求头
- `.timeout(ms)` - 设置默认超时

### eden\<T\>(client)

将 Client 包装为类型安全的 API 调用：

```typescript
import { createApiClient } from './api.generated'  // CLI 生成

const api = createApiClient(client)

// 类型安全调用
const { data, error } = await api.users.find.post({ current: 1, pageSize: 10 })
```

## 中间件

中间件采用洋葱模型，`next()` 之前处理请求，之后处理响应：

```typescript
import { defineMiddleware } from '@vafast/api-client'

const authMiddleware = defineMiddleware(async (ctx, next) => {
  // ========== 请求拦截 ==========
  const token = localStorage.getItem('token')
  if (token) {
    ctx.headers.set('Authorization', `Bearer ${token}`)
  }
  
  const response = await next()  // 执行请求
  
  // ========== 响应拦截 ==========
  if (response.status === 401) {
    // Token 过期处理
    await refreshToken()
  }
  
  return response
})
```

### 内置中间件

```typescript
import { retryMiddleware, timeoutMiddleware, loggerMiddleware } from '@vafast/api-client'

const client = createClient({ baseURL: '/api', timeout: 30000 })
  .use(retryMiddleware({ count: 3, delay: 1000 }))
  .use(loggerMiddleware({ prefix: '[API]' }))
```

## 多服务配置

```typescript
// 公共配置
const AUTH_API = { baseURL: '/auth/api', timeout: 30000 }
const BLOG_API = { baseURL: '/blog/api', timeout: 30000 }

// 创建客户端
const authClient = createClient(AUTH_API)
const blogClient = createClient(BLOG_API).use(appIdMiddleware)

// 使用 CLI 生成的类型安全客户端
import { createApiClient as createAuthClient } from './types/auth.generated'
import { createApiClient as createBlogClient } from './types/blog.generated'

export const auth = createAuthClient(authClient)
export const blog = createBlogClient(blogClient)

// 使用
const { data, error } = await blog.posts.find.post({ current: 1, pageSize: 10 })
```

## Go 风格错误处理

所有请求返回 `{ data, error }` 格式：

```typescript
const { data, error } = await api.users.get()

if (error) {
  // error: { code: number; message: string; details?: ErrorDetail[] }
  if (error.code === 422 && error.details) {
    formRef.setFields(mapDetailsToFormFields(error.details))
    return
  }
  switch (error.code) {
    case 401: redirectToLogin(); break
    case 403: showPermissionDenied(); break
    default: showError(error.message)
  }
  return
}

// data 在这里保证非 null
console.log(data.users)
```

### 422 校验错误

```typescript
import { isValidationError, mapDetailsToFormFields } from '@vafast/api-client'

const { error } = await api.users.post(formData)
if (error && isValidationError(error)) {
  // error.details: { location, path, field, message, value? }[]
  formRef.setFields(mapDetailsToFormFields(error.details))
}
```

## SSE 流式响应

SSE 通过**链式调用**实现：普通 HTTP 方法后接 `.sse()`。

```typescript
// POST SSE - AI 对话
api.chat.stream.post({ messages: [{ role: 'user', content: '你好' }] }).sse({
  onMessage: (data) => {
    // data 是服务端 yield 的原始数据
    if (data.content) process.stdout.write(data.content)
    if (data.done) console.log('\n[完成]')
  },
  onError: (error) => console.error('错误:', error),
  onOpen: () => console.log('连接建立'),
  onClose: () => console.log('连接关闭')
})

// GET SSE - 事件订阅
api.events.get({ channel: 'news' }).sse({
  onMessage: (data) => console.log(data)
})

// 取消订阅
const sub = api.events.get({ channel: 'live' }).sse({ onMessage: console.log })
sub.unsubscribe()
```

::: tip SSE 数据格式
服务端直接 `yield` 的数据会自动作为 `data` 字段发送。客户端通过 `onMessage` 接收解析后的数据，无需额外处理 SSE 格式。
:::

## 请求取消

```typescript
const controller = new AbortController()

const promise = api.users.get({ page: 1 }, { signal: controller.signal })

// 取消请求
controller.abort()
```

## 相关链接

- [CLI 工具](/tools/cli) - 从服务端同步类型
- [GitHub 仓库](https://github.com/vafast/vafast) - 源码和问题反馈
