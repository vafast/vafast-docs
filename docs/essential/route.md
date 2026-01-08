---
title: 路由 - Vafast
---


# 路由

Web 服务器使用请求的 **路径和 HTTP 方法** 来查找正确的资源，这被称为 **"路由"**。

在 Vafast 中，我们通过定义路由配置对象来定义路由，包括 HTTP 方法、路径和处理函数。

## 基本路由

### 定义路由（对象字面量方式）

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello World')
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### HTTP 方法

Vafast 支持所有标准的 HTTP 方法：

```typescript
import { defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  { method: 'GET', path: '/users', handler: createHandler(() => 'Get users') },
  { method: 'POST', path: '/users', handler: createHandler(() => 'Create user') },
  { method: 'PUT', path: '/users/:id', handler: createHandler(() => 'Update user') },
  { method: 'DELETE', path: '/users/:id', handler: createHandler(() => 'Delete user') },
  { method: 'PATCH', path: '/users/:id', handler: createHandler(() => 'Patch user') }
])
```

### 路径参数

路径参数允许您捕获 URL 中的动态值：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(({ params }) => {
      return `User ID: ${params.id}`
    })
  },
  {
    method: 'GET',
    path: '/posts/:postId/comments/:commentId',
    handler: createHandler(({ params }) => {
      return `Post: ${params.postId}, Comment: ${params.commentId}`
    })
  }
])
```

### 查询参数

查询参数通过 `query` 对象访问：

```typescript
import { defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  get('/search', createHandler(({ query }) => {
    const { q, page = '1', limit = '10' } = query
    return `Search: ${q}, Page: ${page}, Limit: ${limit}`
  }))
])
```

### 请求体

POST、PUT、PATCH 请求的请求体通过 `body` 对象访问：

```typescript
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(async ({ body }) => {
      return `Created user: ${body.name}`
    })
  }
])
```

## 路由优先级

Vafast 使用智能路由匹配算法，静态路径优先于动态路径：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/123',        // 静态路径 - 优先级高
    handler: createHandler(() => 'Specific user')
  },
  {
    method: 'GET',
    path: '/users/:id',        // 动态路径 - 优先级低
    handler: createHandler(({ params }) => `User ${params.id}`)
  }
])
```

## 嵌套路由

Vafast 支持嵌套路由结构，使用 `children` 属性：

```typescript
const routes = defineRoutes([
  {
    path: '/api',
    children: [
      {
        path: '/v1',
        children: [
          {
            method: 'GET',
            path: '/users',
            handler: createHandler(() => 'API v1 users')
          }
        ]
      },
      {
        path: '/v2',
        children: [
          {
            method: 'GET',
            path: '/users',
            handler: createHandler(() => 'API v2 users')
          }
        ]
      }
    ]
  }
])
```

## 路由配置选项

每个路由可以配置以下选项：

```typescript
import { defineRoutes, createHandler, Type } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/protected/:id',
    middleware: [authMiddleware],  // 路由级中间件
    handler: createHandler(
      {
        params: Type.Object({ id: Type.String() }),    // 路径参数验证
        query: Type.Object({ page: Type.Number() })    // 查询参数验证
      },
      ({ params, query }) => ({ id: params.id, page: query.page })
    )
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      {
        body: Type.Object({                            // 请求体验证
          name: Type.String(),
          email: Type.String({ format: 'email' })
        })
      },
      ({ body }) => ({ user: body })
    )
  }
])
```

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
import { defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  // 用户相关路由
  {
    path: '/users',
    children: [
      { method: 'GET', path: '/', handler: createHandler(() => 'List users') },
      { method: 'POST', path: '/', handler: createHandler(() => 'Create user') },
      { method: 'GET', path: '/:id', handler: createHandler(({ params }) => `User ${params.id}`) }
    ]
  },
  
  // 文章相关路由
  {
    path: '/posts',
    children: [
      { method: 'GET', path: '/', handler: createHandler(() => 'List posts') },
      { method: 'POST', path: '/', handler: createHandler(() => 'Create post') }
    ]
  }
])
```

### 3. 使用适当的 HTTP 方法

```typescript
import { defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  { method: 'GET', path: '/users', handler: createHandler(() => 'Get users') },      // 获取数据
  { method: 'POST', path: '/users', handler: createHandler(() => 'Create user') },   // 创建数据
  { method: 'PUT', path: '/users/:id', handler: createHandler(() => 'Update user') }, // 完全更新
  { method: 'PATCH', path: '/users/:id', handler: createHandler(() => 'Patch user') }, // 部分更新
  { method: 'DELETE', path: '/users/:id', handler: createHandler(() => null) }        // 删除（返回 204）
])
```

### 4. 类型安全的路由定义

`defineRoutes()` 自动保留字面量类型，支持端到端类型推断：

```typescript
import { defineRoutes, createHandler, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(
      { params: Type.Object({ id: Type.String() }) },
      ({ params }) => ({ userId: params.id })
    )
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      { body: Type.Object({ name: Type.String() }) },
      ({ body }) => ({ name: body.name })
    )
  }
])

// ✅ 自动推断字面量类型
type Api = InferEden<typeof routes>
```

