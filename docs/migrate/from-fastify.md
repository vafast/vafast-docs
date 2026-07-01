---
title: 从 Fastify 迁移 - Vafast
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

import Benchmark from '../components/fern/benchmark-fastify.vue'
</script>

# 从 Fastify 到 Vafast

本指南适用于希望了解 Fastify 与 Vafast 之间差异的 Fastify 用户，包括语法，以及如何通过示例将应用程序从 Fastify 迁移到 Vafast。

**Fastify** 是一个专注于提供最大效率和速度的 Node.js Web 框架，具有低内存占用和优秀的性能。

**Vafast** 是一个高性能的 TypeScript Web 框架，支持 Node.js、Bun 等多种运行时，专注于类型安全、中间件系统和性能优化。设计时强调简单性和开发者友好，提供完整的 TypeScript 支持。

## 性能
由于 Radix Tree 路由匹配算法和 JIT 编译验证器，Vafast 在性能上相比 Fastify 有显著提高。

<Benchmark />

## 路由

Fastify 和 Vafast 都使用配置对象的方式定义路由，但 Vafast 提供了更简洁的 API 和更好的类型安全。

<Compare>

<template v-slot:left>

::: code-group

```ts [Fastify]
import Fastify from 'fastify'

const fastify = Fastify()

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.post('/user/:id', async (request, reply) => {
  const { id } = request.params
  const { name } = request.body
  return { id, name }
})

await fastify.listen({ port: 3000 })
```

:::
</template>

<template v-slot:left-content>

> Fastify 使用 `request` 和 `reply` 作为请求和响应对象

</template>

<template v-slot:right>

::: code-group

```ts [Vafast]
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return { hello: 'world' }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/user/:id',
    handler: ({ params, body }) => {
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

**Fastify** 使用链式方法调用：
```typescript
fastify.get('/users', async (request, reply) => { ... })
fastify.post('/users', async (request, reply) => { ... })
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

**Fastify** 使用 `request` 和 `reply` 对象：
```typescript
fastify.get('/user/:id', async (request, reply) => {
  const id = request.params.id
  const query = request.query
  return { id, query }
})
```

**Vafast** 使用解构参数：
```typescript
defineRoute({
  method: 'GET',
  path: '/user/:id',
  handler: ({ params, query }) => {
    return { id: params.id, query }
  }
})
```

### 3. Schema 验证

**Fastify** 使用内置的 JSON Schema 验证：
```typescript
const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  required: ['name']
}

fastify.post('/users', {
  schema: {
    body: userSchema
  }
}, async (request, reply) => {
  return createUser(request.body)
})
```

**Vafast** 使用 TypeBox 进行验证：
```typescript
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String(),
  age: Type.Optional(Type.Number())
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

### 4. 中间件系统

**Fastify** 使用钩子（hooks）和插件系统：
```typescript
fastify.addHook('preHandler', async (request, reply) => {
  console.log(`${request.method} ${request.url}`)
})

fastify.register(async function (fastify) {
  fastify.get('/admin', async (request, reply) => {
    return 'Admin Panel'
  })
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

### 5. 错误处理

**Fastify** 使用错误处理器：
```typescript
fastify.setErrorHandler((error, request, reply) => {
  reply.status(500).send({ error: error.message })
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

将 Fastify 的路由定义转换为 Vafast 的配置对象格式：

```typescript
// Fastify 风格
fastify.get('/api/users', async (request, reply) => {
  const users = getUsers()
  return users
})

// Vafast 风格
defineRoute({
  method: 'GET',
  path: '/api/users',
  handler: () => {
    return getUsers()
  }
})
}
```

### 步骤 3: 更新 Schema 验证

将 Fastify 的 JSON Schema 转换为 TypeBox：

```typescript
// Fastify Schema
const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'email']
}

// Vafast Schema
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})
```

### 步骤 4: 更新中间件和钩子

```typescript
// Fastify 钩子
fastify.addHook('preHandler', async (request, reply) => {
  const token = request.headers.authorization
  if (!token) {
    reply.status(401).send('Unauthorized')
  }
})

// Vafast 中间件
import { json } from 'vafast'

const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return await next()
}
```

### 步骤 5: 更新错误处理

```typescript
// Fastify 错误处理
fastify.setErrorHandler((error, request, reply) => {
  reply.status(500).send({ error: error.message })
})

// Vafast：框架内置 errorHandler，handler 中 throw err.xxx()
import { err } from 'vafast'

handler: ({ params }) => {
  if (!found) throw err.notFound('Not found')
  return data
}
```

## 完整迁移示例

### Fastify 应用

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

const fastify = Fastify()

await fastify.register(cors)
await fastify.register(helmet)

fastify.get('/users', async (request, reply) => {
  const users = getUsers()
  return users
})

fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      },
      required: ['name', 'email']
    }
  }
}, async (request, reply) => {
  const user = createUser(request.body)
  reply.status(201)
  return user
})

fastify.get('/users/:id', async (request, reply) => {
  const user = getUserById(request.params.id)
  if (!user) {
    reply.status(404)
    return { error: 'User not found' }
  }
  return user
})

await fastify.listen({ port: 3000 })
```

### Vafast 应用

```typescript
import { Server, defineRoute, defineRoutes, Type, json, err } from 'vafast'
import { cors } from '@vafast/cors'

const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String()
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

> **新框架用法说明**：
> - 所有路由使用 `defineRoute` 包装
> - Schema 验证在 `schema` 字段中定义
> - 全局中间件使用 `server.use()`

## 优势对比

| 特性 | Fastify | Vafast |
|------|---------|---------|
| 类型安全 | ⚠️ 需要额外配置 | ✅ 完整的 TypeScript 支持 |
| 性能 | ✅ 高性能 | 超高性能 |
| Schema 验证 | ✅ JSON Schema | ✅ TypeBox |
| 中间件系统 | ✅ 钩子系统 | ✅ 灵活可扩展 |
| 路由定义 | ⚠️ 链式调用 | ✅ 配置对象 |
| 错误处理 | ✅ 错误处理器 | ✅ 中间件链 |
| Bun 支持 | ❌ 需要适配 | ✅ 原生支持 |

## 下一步

现在您已经了解了如何从 Fastify 迁移到 Vafast，建议您：

1. 查看 [快速入门](/quick-start) 开始使用 Vafast
2. 阅读 [核心概念](/key-concept) 深入了解 Vafast 的工作原理
3. 探索 [中间件系统](/middleware) 了解如何扩展功能
4. 查看 [示例代码](/examples) 获取更多实践示例

如果您在迁移过程中遇到任何问题，欢迎在我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 社区寻求帮助。