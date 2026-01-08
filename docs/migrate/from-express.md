---
title: 从 Express 迁移 - Vafast
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

import Benchmark from '../components/fern/benchmark-express.vue'
</script>

# 从 Express 到 Vafast

本指南适用于希望了解 Express 与 Vafast 之间差异的 Express 用户，包括语法，以及如何通过示例将应用程序从 Express 迁移到 Vafast。

**Express** 是一个流行的 Node.js 网络框架，广泛用于构建 Web 应用程序和 API。因其简单性和灵活性而闻名。

**Vafast** 是一个高性能的 TypeScript Web 框架，支持 Node.js、Bun 等多种运行时，专注于类型安全、中间件系统和性能优化。设计时强调简单性和开发者友好，提供完整的 TypeScript 支持。

## 性能
由于智能路由匹配算法和中间件预编译，Vafast 在性能上相比 Express 有显著提高。

<Benchmark />

## 路由

Express 和 Vafast 有类似的路由语法，但 Vafast 使用配置对象的方式定义路由，提供更好的类型安全和中间件支持。

<Compare>

<template v-slot:left>

::: code-group

```ts [Express]
import express from 'express'

const app = express()

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.post('/id/:id', (req, res) => {
    res.status(201).send(req.params.id)
})

app.listen(3000)
```

:::
</template>

<template v-slot:left-content>

> Express 使用 `req` 和 `res` 作为请求和响应对象

</template>

<template v-slot:right>

::: code-group

```ts [Vafast]
import { Server, defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello World')
  },
  {
    method: 'POST',
    path: '/id/:id',
    handler: createHandler(({ params }) => {
      return { id: params.id }
    })
  }
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

**Express** 使用链式方法调用：
```typescript
app.get('/users', (req, res) => { ... })
app.post('/users', (req, res) => { ... })
```

**Vafast** 使用配置对象数组：
```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(() => { ... })
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(() => { ... })
  }
])
```

### 2. 请求处理

**Express** 使用 `req` 和 `res` 对象：
```typescript
app.get('/user/:id', (req, res) => {
  const id = req.params.id
  const query = req.query
  res.json({ id, query })
})
```

**Vafast** 使用解构参数：
```typescript
{
  method: 'GET',
  path: '/user/:id',
  handler: createHandler(({ params, query }) => {
    return { id: params.id, query }
  })
}
```

### 3. 中间件系统

**Express** 使用 `app.use()` 和路由级中间件：
```typescript
app.use(loggingMiddleware)
app.get('/admin', authMiddleware, (req, res) => {
  res.send('Admin Panel')
})
```

**Vafast** 支持全局和路由级中间件：
```typescript
const server = new Server(routes)
server.use(loggingMiddleware)

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/admin',
    handler: createHandler(() => 'Admin Panel'),
    middleware: [authMiddleware]
  }
])
```

### 4. 错误处理

**Express** 使用错误处理中间件：
```typescript
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
```

**Vafast** 支持中间件链中的错误处理：
```typescript
import { json } from 'vafast'

const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    return json({ error: error.message }, 500)
  }
}
```

## 迁移步骤

### 步骤 1: 安装 Vafast

```bash
bun add vafast
```

### 步骤 2: 重构路由定义

将 Express 的路由定义转换为 Vafast 的配置对象格式：

```typescript
// Express 风格
app.get('/api/users', (req, res) => {
  const users = getUsers()
  res.json(users)
})

// Vafast 风格
{
  method: 'GET',
  path: '/api/users',
  handler: createHandler(() => {
    return getUsers()
  })
}
```

### 步骤 3: 更新中间件

将 Express 中间件转换为 Vafast 中间件格式：

```typescript
// Express 中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    return res.status(401).send('Unauthorized')
  }
  next()
}

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

### 步骤 4: 更新错误处理

```typescript
// Express 错误处理
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})

// Vafast 错误处理
import { json } from 'vafast'

const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
}
```

## 完整迁移示例

### Express 应用

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())

app.get('/users', (req, res) => {
  const users = getUsers()
  res.json(users)
})

app.post('/users', (req, res) => {
  const user = createUser(req.body)
  res.status(201).json(user)
})

app.get('/users/:id', (req, res) => {
  const user = getUserById(req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

app.listen(3000)
```

### Vafast 应用

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(() => getUsers())
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(({ body }) => ({
      data: createUser(body),
      status: 201
    }))
  },
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(({ params }) => {
      const user = getUserById(params.id)
      if (!user) {
        throw new VafastError('User not found', { status: 404, type: 'NOT_FOUND', expose: true })
      }
      return user
    })
  }
])

const server = new Server(routes)
server.use(cors())

export default { fetch: server.fetch }
```

## 优势对比

| 特性 | Express | Vafast |
|------|---------|---------|
| 类型安全 | ❌ 需要额外配置 | ✅ 完整的 TypeScript 支持 |
| 性能 | ⚠️ 中等 | 🚀 高性能 |
| 中间件系统 | ✅ 成熟 | ✅ 灵活可扩展 |
| 路由定义 | ⚠️ 链式调用 | ✅ 配置对象 |
| 错误处理 | ✅ 中间件方式 | ✅ 中间件链 |
| Bun 支持 | ❌ 需要适配 | ✅ 原生支持 |

## 下一步

现在您已经了解了如何从 Express 迁移到 Vafast，建议您：

1. 查看 [快速入门](/quick-start) 开始使用 Vafast
2. 阅读 [核心概念](/key-concept) 深入了解 Vafast 的工作原理
3. 探索 [中间件系统](/middleware) 了解如何扩展功能
4. 查看 [示例代码](/examples) 获取更多实践示例

如果您在迁移过程中遇到任何问题，欢迎在我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 社区寻求帮助。