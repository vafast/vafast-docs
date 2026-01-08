---
title: 从 Elysia 迁移 - Vafast
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
</script>

# 从 Elysia 到 Vafast

本指南适用于希望了解 Elysia 与 Vafast 之间差异的 Elysia 用户，包括语法，以及如何通过示例将应用程序从 Elysia 迁移到 Vafast。

**Elysia** 是一个为 Bun 优化的高性能 TypeScript Web 框架，以其出色的性能和类型安全著称。

**Vafast** 同样是一个高性能的 TypeScript Web 框架，支持 Node.js、Bun 等多种运行时，专注于结构化路由、类型安全和性能优化。

## 性能对比

Elysia 和 Vafast 都是高性能框架，Elysia 在 Bun 上性能略高，但 Vafast 提供更好的多运行时支持。

| 框架 | RPS | 特点 |
|------|-----|------|
| Elysia | ~118K | Bun 专属优化 |
| **Vafast** | **~101K** | 多运行时支持 |

## 路由

Elysia 和 Vafast 在路由定义上有显著差异。

<Compare>

<template v-slot:left>

::: code-group

```ts [Elysia]
import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/', () => 'Hello World')
  .post('/user/:id', ({ params, body }) => ({
    id: params.id,
    name: body.name
  }))

export default app
```

:::
</template>

<template v-slot:left-content>

> Elysia 使用链式方法调用，方法和路径在同一调用中

</template>

<template v-slot:right>

::: code-group

```ts [Vafast]
import { Server, defineRoutes, createHandler, serve } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello World')
  },
  {
    method: 'POST',
    path: '/user/:id',
    handler: createHandler(({ params, body }) => ({
      id: params.id,
      name: body.name
    }))
  }
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

:::
</template>

<template v-slot:right-content>

> Vafast 使用配置对象定义路由，结构清晰可见

</template>

</Compare>

## 主要差异

### 1. 路由定义方式

**Elysia** 使用链式方法调用：
```typescript
const app = new Elysia()
  .get('/users', () => getUsers())
  .post('/users', ({ body }) => createUser(body))
  .get('/users/:id', ({ params }) => getUserById(params.id))
```

**Vafast** 使用配置对象数组：
```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(() => getUsers())
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(({ body }) => createUser(body))
  },
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(({ params }) => getUserById(params.id))
  }
])
```

### 2. 请求参数

**Elysia** 直接解构：
```typescript
app.get('/user/:id', ({ params, query, body, headers }) => {
  return { id: params.id, query, body }
})
```

**Vafast** 同样使用解构：
```typescript
{
  method: 'GET',
  path: '/user/:id',
  handler: createHandler(({ params, query, body, req }) => {
    return { id: params.id, query, body }
  })
}
```

### 3. Schema 验证

**Elysia** 使用内置的 t (TypeBox 包装)：
```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .post('/users', ({ body }) => createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: 'email' })
    })
  })
```

**Vafast** 使用 TypeBox（从 vafast 导入 Type）：
```typescript
import { Server, defineRoutes, createHandler, Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      { body: UserSchema },
      ({ body }) => createUser(body)
    )
  }
])
```

### 4. 中间件/插件

**Elysia** 使用 `.use()` 和装饰器：
```typescript
const app = new Elysia()
  .use(cors())
  .derive(({ headers }) => ({
    user: verifyToken(headers.authorization)
  }))
  .get('/profile', ({ user }) => user)
```

**Vafast** 使用中间件函数：
```typescript
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  const user = await verifyToken(token)
  // 通过 req 扩展传递用户信息
  ;(req as any).user = user
  return await next()
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/profile',
    middleware: [authMiddleware],
    handler: createHandler(({ req }) => (req as any).user)
  }
])
```

### 5. 响应处理

**Elysia** 自动转换返回值：
```typescript
app.get('/json', () => ({ message: 'Hello' }))  // 自动 JSON
app.get('/text', () => 'Hello')                  // 自动 text
```

**Vafast** 同样自动转换：
```typescript
{
  method: 'GET',
  path: '/json',
  handler: createHandler(() => ({ message: 'Hello' }))  // 自动 JSON
},
{
  method: 'GET',
  path: '/text',
  handler: createHandler(() => 'Hello')  // 自动 text
}
```

### 6. 错误处理

**Elysia** 使用 `.onError()`：
```typescript
const app = new Elysia()
  .onError(({ error }) => {
    return { error: error.message }
  })
```

**Vafast** 使用中间件：
```typescript
import { json } from 'vafast'

const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    return json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
}

const server = new Server(routes)
server.use(errorHandler)
```

## 迁移步骤

### 步骤 1: 安装 Vafast

```bash
npm install vafast
# 或
bun add vafast
```

### 步骤 2: 重构路由定义

```typescript
// Elysia
const app = new Elysia()
  .get('/api/users', () => getUsers())
  .post('/api/users', ({ body }) => createUser(body))

// Vafast
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/users',
    handler: createHandler(() => getUsers())
  },
  {
    method: 'POST',
    path: '/api/users',
    handler: createHandler(({ body }) => createUser(body))
  }
])
```

### 步骤 3: 更新验证

```typescript
// Elysia
import { Elysia, t } from 'elysia'

app.post('/users', ({ body }) => createUser(body), {
  body: t.Object({
    name: t.String(),
    email: t.String({ format: 'email' })
  })
})

// Vafast
import { Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' })
})

{
  method: 'POST',
  path: '/users',
  handler: createHandler(
    { body: UserSchema },
    ({ body }) => createUser(body)
  )
}
```

### 步骤 4: 更新中间件

```typescript
// Elysia
app.derive(({ headers }) => ({
  user: verifyToken(headers.authorization)
}))

// Vafast
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  ;(req as any).user = await verifyToken(token)
  return await next()
}
```

## 完整迁移示例

### Elysia 应用

```typescript
import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(cors())
  .derive(({ headers }) => ({
    user: verifyToken(headers.authorization)
  }))
  .get('/users', () => getUsers())
  .post('/users', ({ body }) => createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: 'email' })
    })
  })
  .get('/users/:id', ({ params }) => {
    const user = getUserById(params.id)
    if (!user) throw new Error('User not found')
    return user
  })
  .onError(({ error }) => ({
    error: error.message
  }))

export default app
```

### Vafast 应用

```typescript
import { Server, defineRoutes, createHandler, serve, Type, json, err } from 'vafast'
import { cors } from '@vafast/cors'

const UserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  ;(req as any).user = await verifyToken(token)
  return await next()
}

const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(() => getUsers())
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      { body: UserSchema },
      ({ body }) => json(createUser(body), 201)
    )
  },
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(({ params }) => {
      const user = getUserById(params.id)
      if (!user) {
        throw err.notFound('User not found')
      }
      return user
    })
  }
])

const server = new Server(routes)
server.use(cors())
server.use(authMiddleware)
server.use(errorHandler)

serve({ fetch: server.fetch, port: 3000 })
```

## 优势对比

| 特性 | Elysia | Vafast |
|------|--------|--------|
| 性能 | 🚀 极高 (Bun) | 🚀 很高 (多运行时) |
| 类型安全 | ✅ 完整 | ✅ 完整 |
| 路由可见性 | ⚠️ 链式调用 | ✅ 配置数组 |
| 运行时支持 | ⚠️ 主要 Bun | ✅ Node.js/Bun/Deno |
| 验证系统 | ✅ TypeBox (t) | ✅ TypeBox (Type) |
| 插件生态 | ✅ 丰富 | 🔨 发展中 |
| 学习曲线 | ⚠️ 装饰器语法 | ✅ 简单直接 |

## 为什么选择 Vafast？

1. **多运行时支持** - 不仅限于 Bun，支持 Node.js、Deno 等
2. **结构清晰** - 路由配置一目了然，无需追踪链式调用
3. **无魔法** - 没有装饰器，没有隐式行为
4. **类型安全** - 完整的 TypeScript 支持和类型推断

## 下一步

1. 查看 [快速入门](/quick-start) 开始使用 Vafast
2. 阅读 [核心概念](/key-concept) 深入了解 Vafast
3. 探索 [中间件系统](/middleware) 了解如何扩展功能

如果您在迁移过程中遇到任何问题，欢迎在 [GitHub Issues](https://github.com/vafast/vafast/issues) 寻求帮助。
