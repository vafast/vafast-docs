---
title: Vafast：一个让我放弃 Express 和 Hono 的 TypeScript Web 框架
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../components/blog/Layout.vue'
</script>

<Blog
title="Vafast：一个让我放弃 Express 和 Hono 的 TypeScript Web 框架"
src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
alt="Vafast 框架介绍"
author="vafast"
date="2025 年 1 月"
>

> 声明式路由 + 端到端类型安全 + 比 Express 快 1.8 倍，这就是我想要的 Node.js 框架

## 前言

作为一个写了多年 Node.js 后端的开发者，我用过 Express、Koa、Fastify、Hono、Elysia... 每个框架都有自己的优点，但也有让我难受的地方：

- **Express**：生态丰富，但性能差、类型支持弱
- **Hono**：轻量快速，但链式 API 一长就看不清有哪些路由
- **Elysia**：性能强、类型好，但 Bun 限定，且链式调用让类型跨文件就丢失

直到我遇到了 **Vafast**，一个专为 TypeScript 设计的声明式 Web 框架。

## 为什么选择 Vafast？

### 1. 路由一眼看清，不用翻代码

先看看传统框架怎么写路由：

```typescript
// Hono / Express 风格
app.get('/users', getUsers)
app.post('/users', createUser)
app.get('/users/:id', getUser)
app.put('/users/:id', updateUser)
app.delete('/users/:id', deleteUser)
app.get('/posts', getPosts)
// ... 100 行后你还能找到某个路由吗？
```

再看 Vafast：

```typescript
// Vafast 风格
const routes = defineRoutes([
  { method: 'GET',    path: '/users',     handler: getUsers },
  { method: 'POST',   path: '/users',     handler: createUser },
  { method: 'GET',    path: '/users/:id', handler: getUser },
  { method: 'PUT',    path: '/users/:id', handler: updateUser },
  { method: 'DELETE', path: '/users/:id', handler: deleteUser },
  { method: 'GET',    path: '/posts',     handler: getPosts },
])
```

**路由就是数组，所有 API 端点一目了然。** 这在团队协作和代码 Review 时特别有用。

### 2. 类型安全，从请求到响应全程覆盖

Vafast 基于 TypeBox 实现 Schema 验证，定义一次，类型自动推断：

```typescript
import { defineRoute, Type } from 'vafast'

const createUser = defineRoute({
  method: 'POST',
  path: '/users',
  schema: {
    body: Type.Object({ 
      name: Type.String(), 
      email: Type.String({ format: 'email' }),
      age: Type.Number({ minimum: 0 })
    })
  },
  handler: ({ body }) => {
    // body.name 是 string ✅
    // body.email 是 string ✅
    // body.age 是 number ✅
    return { success: true, user: body }
  }
})
```

> **新框架用法说明**：
> - Schema 验证在路由配置的 `schema` 字段中定义
> - Handler 直接接收验证后的数据，自动获得类型推断

**运行时验证 + 编译时类型推断，一举两得。**

### 3. 前后端类型自动同步

这是我最喜欢的特性。服务端定义好路由，客户端自动获得完整类型提示：

```typescript
// 服务端
import { defineRoute, defineRoutes, Type } from 'vafast'

// 定义路由（使用 as const 保留字面量类型）
export const routeDefinitions = [
  defineRoute({
    method: 'POST',
    path: '/login',
    schema: {
      body: Type.Object({ email: Type.String(), password: Type.String() })
    },
    handler: ({ body }) => ({ token: 'xxx', user: { id: '1', email: body.email } })
  })
] as const

// 创建服务器
export const routes = defineRoutes(routeDefinitions)
export type AppRoutes = typeof routeDefinitions
```

```typescript
// 客户端
import { eden, InferEden } from '@vafast/api-client'
import type { AppRoutes } from './server'

// 自动推断类型
type Api = InferEden<AppRoutes>
const api = eden<Api>('http://localhost:3000')

// 完整类型提示 ✅
const { data } = await api.login.post({ 
  email: 'test@example.com',  // 必填，有提示
  password: '123456'          // 必填，有提示
})
console.log(data?.token)  // string 类型 ✅
```

**不用写接口文档，不用手动同步类型，不用生成代码。**

### 4. 性能：比 Express 快 1.8 倍

| 框架 | RPS | 相对性能 |
|------|-----|----------|
| Elysia | ~118K | 100% |
| **Vafast** | **~101K** | **86%** |
| Hono | ~56K | 47% |
| Express | ~56K | 48% |

> 测试环境：Bun 1.2.20, macOS, wrk (4线程, 100连接, 30s)

Vafast 通过以下优化实现高性能：
- **JIT 编译验证器**：Schema 验证器首次编译后缓存，后续调用直接使用
- **Radix Tree 路由**：O(k) 时间复杂度的路由匹配
- **优化的请求解析**：Query/Cookie 解析比标准方法快 2x

### 5. 一套代码，到处运行

Vafast 基于 Web 标准 Fetch API 构建，同一份代码可以跑在：

```typescript
// Bun
export default { port: 3000, fetch: server.fetch }

// Cloudflare Workers
export default { fetch: server.fetch }

// Node.js
import { serve } from 'vafast'
serve({ fetch: server.fetch, port: 3000 })
```

## 快速上手

### 安装

```bash
npm install vafast
```

### 最小示例

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => ({ message: 'Hello Vafast!' })
  })
])

const server = new Server(routes)
export default { port: 3000, fetch: server.fetch }
```

## 内置 Format 验证

Vafast 内置 30+ 常用格式验证器，开箱即用：

```typescript
const UserSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  phone: Type.String({ format: 'phone' }),      // 中国手机号
  website: Type.String({ format: 'url' }),
  avatar: Type.String({ format: 'uuid' }),
  birthday: Type.String({ format: 'date' }),
})
```

## 错误处理

Vafast 提供语义化的错误 API：

```typescript
import { err } from 'vafast'

throw err.badRequest('参数错误')     // 400
throw err.unauthorized('请先登录')   // 401
throw err.forbidden('无权限')        // 403
throw err.notFound('资源不存在')     // 404
throw err.conflict('数据冲突')       // 409
throw err.internal('服务器错误')     // 500
```

## 总结

Vafast 不是要取代所有框架，而是提供一种**结构、清晰、可控**的开发方式。

如果你：
- 厌倦了在链式调用中找路由
- 受够了跨文件类型丢失的问题
- 想要更好的团队协作体验

那么 Vafast 值得你试一试。

```bash
npx create-vafast-app my-app
cd my-app
npm run dev
```

</Blog>
