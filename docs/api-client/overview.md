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
import { createClient, eden, defineMiddleware } from '@vafast/api-client'

const tokenMiddleware = defineMiddleware(async (ctx, next) => {
  const token = localStorage.getItem('token')
  if (token) ctx.headers.set('Authorization', `Bearer ${token}`)
  return next()
})

const client = createClient({
  baseURL: 'http://localhost:3000',
  timeout: 30_000,
}).use(tokenMiddleware)

const api = eden<Api>(client)

const { data, error } = await api.users.get({ page: 1 })

if (error) {
  console.error(`${error.code}: ${error.message}`)
  return
}

console.log(data.users)
```

## 核心 API

### createClient(config)

```typescript
// 方式 1：只传 baseURL
const client = createClient('http://localhost:3000')
  .timeout(30_000)
  .use(tokenMiddleware)

// 方式 2：传配置对象（推荐）
const client = createClient({
  baseURL: 'http://localhost:3000',
  timeout: 30_000,
  headers: { 'X-App-Id': 'my-app' },
}).use(tokenMiddleware)
```

```typescript
interface ClientConfig {
  baseURL: string
  timeout?: number        // 默认 30000ms
  headers?: Record<string, string>
}
```

链式方法：`.use(middleware)` / `.headers(headers)` / `.timeout(ms)`

### eden\<T\>(client)

```typescript
import { createApiClient } from './api.generated'  // CLI 生成

const api = createApiClient(client)

const { data, error } = await api.users.find.post({ current: 1, pageSize: 10 })
```

## 中间件（基础）

```typescript
import { defineMiddleware, retryMiddleware, loggerMiddleware } from '@vafast/api-client'

const auth = defineMiddleware(async (ctx, next) => {
  const token = localStorage.getItem('token')
  if (token) ctx.headers.set('Authorization', `Bearer ${token}`)
  return next()
})

const client = createClient({ baseURL: '/api' })
  .use(auth)
  .use(retryMiddleware({ count: 3, delay: 1000 }))
  .use(loggerMiddleware({ prefix: '[API]' }))
```

多租户 `app-id`、token 刷新队列、多服务工厂见 [高级用法](/api-client/advanced)。

## Go 风格错误处理

所有请求返回 `{ data, error }`：**先判断 `error`，再使用 `data`**，不要用 try/catch 处理 4xx/5xx 业务失败。

```typescript
import { isValidationError, mapDetailsToFormFields } from '@vafast/api-client'

const { data, error } = await api.users.get()

if (error) {
  if (isValidationError(error)) {
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

console.log(data.users)
```

## SSE 流式响应

普通 HTTP 方法后接 `.sse()`：

```typescript
api.chat.stream.post({ messages: [{ role: 'user', content: '你好' }] }).sse({
  onMessage: (data) => {
    if (data.content) process.stdout.write(data.content)
  },
  onError: (error) => console.error(error),
  onClose: () => console.log('done'),
})

const sub = api.events.get({ channel: 'live' }).sse({ onMessage: console.log })
sub.unsubscribe()
```

## 请求取消

```typescript
const controller = new AbortController()
const { data, error } = await api.users.get({ page: 1 }, { signal: controller.signal })
controller.abort()
```

## 相关链接

- [对比](/api-client/comparison) — 与 tRPC / Eden / Hono / OpenAPI / Axios
- [基础用法](/api-client/fetch)
- [高级用法](/api-client/advanced) — 多租户、刷新队列、多服务、上传编排
- [CLI 工具](/tools/cli)
- [测试](/api-client/test)
