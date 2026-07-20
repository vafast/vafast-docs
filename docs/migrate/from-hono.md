---
title: 从 Hono 迁移 - Vafast
prev:
  text: '快速开始'
  link: '/quick-start'
next:
  text: '教程'
  link: '/tutorial'
---

<script setup>
import Compare from '../components/fern/compare.vue'
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'

import Benchmark from '../components/fern/benchmark-hono.vue'
</script>

# 从 Hono 到 Vafast

本指南适用于希望了解 Hono 与 Vafast 之间差异的 Hono 用户，包括语法，以及如何通过示例将应用程序从 Hono 迁移到 Vafast。

**Hono** 是一个轻量级、超快的 Web 框架，专为边缘运行时设计，支持多种平台。

**Vafast** 是一个高性能的 TypeScript Web 框架，支持 Node.js、Bun 等多种运行时，专注于类型安全、中间件系统和性能优化。设计时强调简单性和开发者友好，提供完整的 TypeScript 支持。

## 性能
由于 Radix Tree 路由匹配算法和 JIT 编译验证器，Vafast 在性能上相比 Hono 有显著提高。

<Benchmark />

## 路由

Hono 和 Vafast 都使用配置对象的方式定义路由，但 Vafast 提供了更结构化的 API 和更好的类型安全。

<Compare>

<template v-slot:left>

::: code-group

```ts [Hono]
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello World')
})

app.post('/user/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json({ id, name: body.name })
})

export default app
```

:::
</template>

<template v-slot:left-content>

> Hono 使用 `c` (context) 作为请求和响应对象

</template>

<template v-slot:right>

::: code-group

```ts [Vafast]
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  }),
  defineRoute({
    method: 'POST',
    path: '/user/:id',
    handler: async ({ params, req }) => {
      const body = await req.json()
      return { id: params.id, name: body.name }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

:::
</template>

<template v-slot:right-content>

> Vafast 使用配置对象定义路由，支持类型安全和中间件

</template>

</Compare>

## 主要差异

### 1. 路由定义方式

**Hono** 使用链式方法调用：
```typescript
app.get('/users', (c) => { ... })
app.post('/users', (c) => { ... })
```

**Vafast** 使用配置对象数组：
```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => { ... }
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: () => { ... }
  })
])
```

### 2. 请求处理

**Hono** 使用 `c` (context) 对象：
```typescript
app.get('/user/:id', (c) => {
  const id = c.req.param('id')
  const query = c.req.query()
  return c.json({ id, query })
})
```

**Vafast** 使用解构参数：
```typescript
defineRoute({
  method: 'GET',
  path: '/user/:id',
  handler: ({ params, query }) => {
    return { id: params.id, query }
  })
}
```

### 3. 中间件系统

**Hono** 使用 `app.use()` 和路由级中间件：
```typescript
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`)
  await next()
})

app.get('/admin', authMiddleware, (c) => {
  return c.text('Admin Panel')
})
```

**Vafast** 支持全局和路由级中间件：
```typescript
import { defineMiddleware } from 'vafast'

const loggingMiddleware = defineMiddleware(async (req, next) => {
  console.log(`${req.method} ${req.url}`)
  return await next()
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin',
    handler: () => 'Admin Panel',
    middleware: [authMiddleware]
  })
])

const server = new Server(routes)
server.use(loggingMiddleware)
```

### 4. 验证系统

**Hono** 使用 Zod 进行验证：
```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

app.post('/users', zValidator('json', userSchema), (c) => {
  const body = c.req.valid('json')
  return c.json(createUser(body))
})
```

**Vafast** 使用 TypeBox 进行验证：
```typescript
import { defineRoute, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: userSchema },
  handler: ({ body }) => {
    return createUser(body)
  }
})
```

> **新框架用法说明**：
> - Schema 验证在路由配置的 `schema` 字段中定义
> - Handler 直接接收验证后的数据，自动获得类型推断

### 5. 错误处理

**Hono** 使用错误处理器：
```typescript
app.onError((err, c) => {
  console.error(`${err}`)
  return c.text('Custom Error Message', 500)
})
```

**Vafast** 内置 `errorHandler`，在 handler 中 `throw err.xxx()` 即可：

```typescript
import { err } from 'vafast'

handler: ({ params }) => {
  if (!found) throw err.notFound('Not found')
  return data
}
```

> 框架自动注入 `errorHandler`，无需手写 try/catch 中间件。

## 迁移步骤

### 步骤 1: 安装 Vafast

```bash
npm install vafast
```

### 步骤 2: 重构路由定义

将 Hono 的路由定义转换为 Vafast 的配置对象格式：

```typescript
// Hono 风格
app.get('/api/users', (c) => {
  const users = getUsers()
  return c.json(users)
})

// Vafast 风格
defineRoute({
  method: 'GET',
  path: '/api/users',
  handler: () => {
    return getUsers()
  }
})
```

### 步骤 3: 更新中间件

将 Hono 中间件转换为 Vafast 中间件格式：

```typescript
// Hono 中间件
app.use('*', async (c, next) => {
  const token = c.req.header('authorization')
  if (!token) {
    return c.text('Unauthorized', 401)
  }
  await next()
})

// Vafast 中间件
import { defineMiddleware, json } from 'vafast'

const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return await next()
})
```

### 步骤 4: 更新验证系统

```typescript
// Hono 验证
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

app.post('/users', zValidator('json', userSchema), (c) => {
  const body = c.req.valid('json')
  return c.json(createUser(body))
})

// Vafast 验证
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

defineRoute({
  method: 'POST',
  path: '/users',
  schema: {
    body: userSchema
  },
  handler: ({ body }) => {
    return createUser(body)
  }
})
```

### 步骤 5: 更新错误处理

```typescript
// Hono 错误处理
app.onError((err, c) => {
  return c.text('Something went wrong', 500)
})

// Vafast：框架内置 errorHandler，handler 中 throw err.xxx()
import { err } from 'vafast'

handler: ({ params }) => {
  if (!found) throw err.notFound('Not found')
  return data
}
```

## 完整迁移示例

### Hono 应用

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

app.get('/users', (c) => {
  const users = getUsers()
  return c.json(users)
})

app.post('/users', zValidator('json', userSchema), (c) => {
  const body = c.req.valid('json')
  const user = createUser(body)
  c.status(201)
  return c.json(user)
})

app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  const user = getUserById(id)
  if (!user) {
    c.status(404)
    return c.json({ error: 'User not found' })
  }
  return c.json(user)
})

export default app
```

### Vafast 应用

```typescript
import { Server, defineRoute, defineRoutes, Type, json, err } from 'vafast'
import { cors } from '@vafast/cors'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => getUsers()
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => json(createUser(body), 201)
  }),
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => {
      const user = getUserById(params.id)
      if (!user) {
        throw err.notFound('User not found')
      }
      return user
    }
  })
])

const server = new Server(routes)
server.use(cors())

export default { fetch: server.fetch }
```

## 优势对比

| 特性 | Hono | Vafast |
|------|------|---------|
| 类型安全 | ⚠️ 需要额外配置 | ✅ 完整的 TypeScript 支持 |
| 性能 | ✅ 高性能 | 超高性能 |
| 验证系统 | ✅ Zod 支持 | ✅ TypeBox 支持 |
| 中间件系统 | ✅ 灵活 | ✅ 灵活可扩展 |
| 路由定义 | ⚠️ 链式调用 | ✅ 配置对象 |
| 错误处理 | ✅ 错误处理器 | ✅ 中间件链 |
| Bun 支持 | ⚠️ 需要适配 | ✅ 原生支持 |

## 下一步

现在您已经了解了如何从 Hono 迁移到 Vafast，建议您：

1. 查看 [快速入门](/quick-start) 开始使用 Vafast
2. 阅读 [核心概念](/key-concept) 深入了解 Vafast 的工作原理
3. 探索 [中间件系统](/middleware) 了解如何扩展功能
4. 跟着 [教程](/tutorial) 熟悉 Vafast 写法

如果您在迁移过程中遇到任何问题，欢迎在我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 社区寻求帮助。