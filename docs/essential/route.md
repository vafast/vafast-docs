---
title: 路由 - Vafast
---


# 路由

Web 服务器使用请求的 **路径和 HTTP 方法** 来查找正确的资源，这被称为 **"路由"**。

在 Vafast 中，我们通过定义路由配置对象来定义路由，包括 HTTP 方法、路径和处理函数。

## 基本路由

### 定义路由（对象字面量方式）

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### HTTP 方法

Vafast 支持所有标准的 HTTP 方法：

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: () => 'Get users' }),
  defineRoute({ method: 'POST', path: '/users', handler: () => 'Create user' }),
  defineRoute({ method: 'PUT', path: '/users/:id', handler: () => 'Update user' }),
  defineRoute({ method: 'DELETE', path: '/users/:id', handler: () => 'Delete user' }),
  defineRoute({ method: 'PATCH', path: '/users/:id', handler: () => 'Patch user' })
])
```

### 路径参数

路径参数允许您捕获 URL 中的动态值：

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => {
      return `User ID: ${params.id}`
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/posts/:postId/comments/:commentId',
    handler: ({ params }) => {
      return `Post: ${params.postId}, Comment: ${params.commentId}`
    }
  })
])
```

### 查询参数

查询参数通过 `query` 对象访问：

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/search',
    handler: ({ query }) => {
      const { q, page = '1', limit = '10' } = query
      return `Search: ${q}, Page: ${page}, Limit: ${limit}`
    }
  })
])
```

### 请求体

POST、PUT、PATCH 请求的请求体通过 `body` 对象访问：

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }) => {
      return `Created user: ${body.name}`
    }
  })
])
```

## 路由优先级

Vafast 使用智能路由匹配算法，静态路径优先于动态路径：

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/123',        // 静态路径 - 优先级高
    handler: () => 'Specific user'
  }),
  defineRoute({
    method: 'GET',
    path: '/users/:id',        // 动态路径 - 优先级低
    handler: ({ params }) => `User ${params.id}`
  })
])
```

## 嵌套路由

Vafast 支持嵌套路由结构，使用 `children` 属性：

```typescript
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    children: [
      defineRoute({
        path: '/v1',
        children: [
          defineRoute({
            method: 'GET',
            path: '/users',
            handler: () => 'API v1 users'
          })
        ]
      }),
      defineRoute({
        path: '/v2',
        children: [
          defineRoute({
            method: 'GET',
            path: '/users',
            handler: () => 'API v2 users'
          })
        ]
      })
    ]
  })
])
```

## 路由配置选项

每个路由可以配置以下选项：

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/protected/:id',
    middleware: [authMiddleware],  // 路由级中间件
    schema: {
      params: Type.Object({ id: Type.String() }),    // 路径参数验证
      query: Type.Object({ page: Type.Number() })     // 查询参数验证
    },
    handler: ({ params, query }) => ({ id: params.id, page: query.page })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({                            // 请求体验证
        name: Type.String(),
        email: Type.String({ format: 'email' })
      })
    },
    handler: ({ body }) => ({ user: body })
  })
])
```

> **新框架用法说明**：
> - Schema 验证现在在路由级别通过 `schema` 字段定义，而不是在 `createHandler` 中
> - `handler` 直接是函数，不再需要 `createHandler` 包装
> - 所有路由必须使用 `defineRoute` 包装

## 最佳实践

### 1. 使用描述性路径

```typescript
// ✅ 好的
path: '/users/:id/profile'
path: '/posts/:postId/comments'

// ❌ 不好的
path: '/u/:i'
path: '/p/:p/c'
```

### 2. 保持路由结构清晰

使用嵌套路由组织 API：

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  // 用户相关路由
  defineRoute({
    path: '/users',
    children: [
      defineRoute({ method: 'GET', path: '/', handler: () => 'List users' }),
      defineRoute({ method: 'POST', path: '/', handler: () => 'Create user' }),
      defineRoute({ method: 'GET', path: '/:id', handler: ({ params }) => `User ${params.id}` })
    ]
  }),
  
  // 文章相关路由
  defineRoute({
    path: '/posts',
    children: [
      defineRoute({ method: 'GET', path: '/', handler: () => 'List posts' }),
      defineRoute({ method: 'POST', path: '/', handler: () => 'Create post' })
    ]
  })
])
```

> **新框架用法说明**：
> - 嵌套路由中，所有子路由也必须使用 `defineRoute` 包装
> - 不再支持直接使用对象字面量，必须使用 `defineRoute` 函数

### 3. 使用适当的 HTTP 方法

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: () => 'Get users' }),      // 获取数据
  defineRoute({ method: 'POST', path: '/users', handler: () => 'Create user' }),   // 创建数据
  defineRoute({ method: 'PUT', path: '/users/:id', handler: () => 'Update user' }), // 完全更新
  defineRoute({ method: 'PATCH', path: '/users/:id', handler: () => 'Patch user' }), // 部分更新
  defineRoute({ method: 'DELETE', path: '/users/:id', handler: () => null })        // 删除（返回 204）
])
```

### 4. 类型安全的路由定义

`defineRoutes()` 自动保留字面量类型，支持端到端类型推断：

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: ({ params }) => ({ userId: params.id })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: Type.Object({ name: Type.String() }) },
    handler: ({ body }) => ({ name: body.name })
  })
])

// ✅ 自动推断字面量类型
type Api = InferEden<typeof routes>
```

> **新框架用法说明**：
> - Schema 验证移到路由配置的 `schema` 字段
> - Handler 函数直接定义，自动获得类型推断
> - 类型安全完全保留，支持端到端类型推断

### 5. 使用扩展字段

Vafast 支持在路由定义中添加任意扩展字段，用于 Webhook、权限、计费等场景：

```typescript
import { defineRoute, defineRoutes, getRouteRegistry, defineMiddleware } from 'vafast'

// 计费中间件
const billingMiddleware = defineMiddleware(async (req, next) => {
  const registry = getRouteRegistry()
  const route = registry.get(req.method, new URL(req.url).pathname)
  
  if (route?.billing) {
    await chargeUser(req, route.billing)
  }
  
  return next()
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/ai/generate',
    name: 'AI 生成',
    // ✨ 扩展字段：计费配置
    billing: { price: 0.01, currency: 'USD', unit: 'request' },
    // ✨ 扩展字段：Webhook 事件
    webhook: { eventKey: 'ai.generate' },
    // ✨ 扩展字段：权限要求
    permission: 'ai.generate',
    middleware: [billingMiddleware],
    handler: async ({ body }) => {
      return await generateAI(body.prompt)
    }
  })
])
```

更多详情请查看 [路由指南 - 扩展字段](/routing#扩展字段-声明式元数据)。

