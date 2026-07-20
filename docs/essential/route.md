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

## 路由匹配规则

Vafast 使用 Radix Tree 实现高效路由匹配（O(k) 时间复杂度，k 为路径段数）。

### 路由类型

```typescript
// 静态路由
'/users'
'/api/v1/health'

// 动态参数 (:param)
'/users/:id'
'/posts/:postId/comments/:commentId'

// 通配符 (* 或 *name)
'/files/*'           // 匿名通配符，params['*']
'/static/*filepath'  // 命名通配符，params['filepath']
```

### 优先级规则

```
静态路由 > 动态参数 > 通配符
```

注册顺序不影响优先级：

```typescript
const routes = defineRoutes([
  // 即使先注册动态路由
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => `User ${params.id}`
  }),
  // 静态路由仍然优先匹配
  defineRoute({
    method: 'GET',
    path: '/users/admin',
    handler: () => 'Admin user'
  })
])

// GET /users/admin → 'Admin user' ✅ 静态优先
// GET /users/123   → 'User 123'
```

### 同一位置支持不同参数名

不同路由在同一位置可以使用不同的参数名，每个路由独立返回其定义的参数名：

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'PUT',
    path: '/sessions/:id',
    handler: ({ params }) => params  // { id: '123' }
  }),
  defineRoute({
    method: 'GET',
    path: '/sessions/:sessionId/messages',
    handler: ({ params }) => params  // { sessionId: '456' }
  })
])

// PUT /sessions/123           → params = { id: '123' }
// GET /sessions/456/messages  → params = { sessionId: '456' }
```

::: tip
参数名冲突时会输出警告（建议保持一致），但不影响功能。
:::

## 嵌套路由

Vafast 支持嵌套路由，分两种节点：

### 路由组（无 `method`）

只做路径前缀和中间件共享，**不写 handler**：

```typescript
import { defineMiddleware, defineRoute } from 'vafast'

const logMiddleware = defineMiddleware(async (req, next) => {
  console.log(req.method, req.url)
  return next()
})

defineRoute({
  path: '/files',
  name: '文件',
  middleware: [logMiddleware],
  children: [ /* 叶子路由 */ ],
})
```

### 叶子路由（有 `method`）

实际处理请求，path 写**相对路径**：

```typescript
const listHandler = defineRoute({
  method: 'GET',
  path: '/list',
  handler: () => [...],
})

// 放入路由组
defineRoute({
  path: '/files',
  middleware: [logMiddleware],
  children: [listHandler],
})
// 实际路径：/files/list
```

### 多层嵌套

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

> 认证场景的路由组 + 类型包装见 [Auth Middleware](/middleware/auth-middleware)。

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

// 定义并处理路由
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

// ✅ 类型推断自动工作，无需 as const！
type Api = InferEden<typeof routes>
```

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

