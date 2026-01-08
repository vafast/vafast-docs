---
title: 路由指南 - Vafast
---

# 路由指南

Vafast 的路由系统是框架的核心，它提供了强大而灵活的方式来定义 API 端点。本指南将详细介绍 Vafast 的路由功能。

## 路由类型定义

### Route 接口

```typescript
import type { Route, NestedRoute, Method, Handler, Middleware } from 'vafast'

// HTTP 方法类型
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

// 基本路由接口
interface Route {
  method: Method
  path: string
  handler: Handler
  middleware?: Middleware[]
  name?: string         // 路由名称（用于文档、事件等）
  description?: string  // 路由描述
  [key: string]: unknown // 允许任意扩展（支持 Webhook、权限等插件）
}

// 嵌套路由配置
interface NestedRoute {
  path: string
  middleware?: Middleware[]
  children?: (NestedRoute | Route)[]
  name?: string         // 路由组名称
  description?: string  // 路由组描述
  [key: string]: unknown
}
```

### Handler 类型

```typescript
// Handler 支持两种风格
type Handler = LegacyHandler | FactoryHandler

// 传统 Handler（不推荐）
type LegacyHandler = (
  req: Request,
  params?: Record<string, string>,
  user?: Record<string, any>
) => ResponseBody | Promise<ResponseBody>

// createHandler 返回的类型（推荐）
type FactoryHandler = (req: Request) => Promise<Response>
```

### Middleware 类型

```typescript
type Middleware = (
  req: Request,
  next: () => Promise<Response>
) => Response | Promise<Response>
```

## 基本路由

路由是 Vafast 应用的基础构建块。每个路由都定义了 HTTP 方法、路径和处理函数。

### 定义路由

使用 `defineRoutes()` 定义路由数组，支持完整的类型推断：

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello Vafast!')
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(({ body }) => ({ user: body }))
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

::: tip 类型推断
`defineRoutes()` 使用 `const T` 泛型，自动保留 `'GET'`、`'/users'` 等字面量类型，支持端到端类型推断。
:::

### 支持的 HTTP 方法

| 方法 | 说明 |
|------|------|
| `GET` | 获取资源 |
| `POST` | 创建资源 |
| `PUT` | 完整更新资源 |
| `DELETE` | 删除资源 |
| `PATCH` | 部分更新资源 |
| `OPTIONS` | CORS 预检请求 |
| `HEAD` | 获取头部信息 |

```typescript
const routes = defineRoutes([
  { method: 'GET', path: '/users', handler: createHandler(() => ({ users: [] })) },
  { method: 'POST', path: '/users', handler: createHandler(({ body }) => body) },
  { method: 'PUT', path: '/users/:id', handler: createHandler(({ params }) => params) },
  { method: 'DELETE', path: '/users/:id', handler: createHandler(() => null) },  // 返回 204
  { method: 'PATCH', path: '/users/:id', handler: createHandler(({ params, body }) => ({ ...body })) }
])
```

## 动态路由

Vafast 支持动态路由参数，允许您捕获 URL 中的变量值。

### 基本参数

```typescript
{
  method: 'GET',
  path: '/users/:id',
  handler: createHandler(({ params }) => ({
    userId: params.id
  }))
}
```

### 多个参数

```typescript
{
  method: 'GET',
  path: '/users/:userId/posts/:postId',
  handler: createHandler(({ params }) => ({
    userId: params.userId,
    postId: params.postId
  }))
}
```

### 可选参数

```typescript
{
  method: 'GET',
  path: '/users/:id?',
  handler: createHandler(({ params }) => {
    if (params.id) {
      return { userId: params.id }
    }
    return { users: [] }
  })
}
```

## 嵌套路由

Vafast 支持嵌套路由结构，允许您组织复杂的路由层次。

### 基本嵌套

```typescript
const routes = [
  {
    path: '/api',
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: createHandler(() => ({ message: 'Users API' }))
      },
      {
        method: 'GET',
        path: '/posts',
        handler: createHandler(() => ({ message: 'Posts API' }))
      }
    ]
  }
]
```

### 深层嵌套

```typescript
const routes = [
  {
    path: '/api',
    children: [
      {
        path: '/v1',
        children: [
          {
            path: '/users',
            children: [
              {
                method: 'GET',
                path: '/',
                handler: createHandler(() => ({ message: 'Users v1' }))
              },
              {
                method: 'POST',
                path: '/',
                handler: createHandler(({ body }) => ({ message: 'Create user v1', data: body }))
              }
            ]
          }
        ]
      }
    ]
  }
]
```

## 中间件

中间件是 Vafast 路由系统的强大功能，允许您在请求处理前后执行自定义逻辑。

### 中间件定义

```typescript
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const auth = req.headers.get('authorization')
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }
  return next()
}

const logMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const start = Date.now()
  const response = await next()
  const duration = Date.now() - start
  console.log(`${req.method} ${req.url} - ${duration}ms`)
  return response
}
```

### 应用中间件

```typescript
const routes = [
  {
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware, logMiddleware],
    handler: createHandler(() => ({ message: 'Admin panel' }))
  }
]
```

### 全局中间件

```typescript
const routes = [
  {
    path: '/api',
    middleware: [logMiddleware], // 应用到所有子路由
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: createHandler(() => ({ message: 'Users' }))
      }
    ]
  }
]
```

## 路由处理函数

处理函数是路由的核心，负责处理请求并返回响应。**推荐使用 `createHandler` 包装处理函数**，它提供统一的上下文解构和自动响应转换。

### 基本处理函数

```typescript
{
  method: 'GET',
  path: '/hello',
  handler: createHandler(() => 'Hello World')
}
```

### 异步处理函数

```typescript
{
  method: 'POST',
  path: '/users',
  handler: createHandler(async ({ body }) => {
    // body 已自动解析
    const user = await createUser(body)
    return user
  })
}
```

### 访问请求上下文

`createHandler` 提供了完整的请求上下文：

```typescript
{
  method: 'GET',
  path: '/users/:id',
  handler: createHandler(({ req, params, query, headers, cookies }) => ({
    userId: params.id,
    search: query.q,
    userAgent: headers['user-agent']
  }))
}
```

## 响应处理

Vafast 会**自动转换返回值**为 Response，你可以直接返回数据：

### 自动响应转换

```typescript
// 字符串 → text/plain
handler: createHandler(() => 'Hello World')

// 对象/数组 → application/json
handler: createHandler(() => ({ message: 'Success' }))

// 数字/布尔 → text/plain
handler: createHandler(() => 42)

// null/undefined → 204 No Content
handler: createHandler(() => null)
```

### 自定义状态码和头部

使用 `{ data, status, headers }` 格式可以控制响应细节：

```typescript
handler: createHandler(() => ({
  data: { user: { id: 1, name: 'John' } },
  status: 201,
  headers: { 'X-Custom-Header': 'value' }
}))
```

### 重定向

```typescript
import { redirect } from 'vafast'

handler: createHandler(() => redirect('/new-page'))
```

### 手动 Response（不推荐）

如需完全控制，仍可返回 Response 对象：

```typescript
handler: createHandler(() => new Response('Custom', {
  status: 200,
  headers: { 'Content-Type': 'text/custom' }
}))
```

## 错误处理

Vafast 内置了自动错误处理，`createHandler` 会捕获错误并返回格式化响应。

### 抛出错误

```typescript
handler: createHandler(() => {
  throw new Error('Something went wrong')
})
// 自动返回 500 错误响应
```

### 使用 VafastError 返回错误状态

```typescript
import { err } from 'vafast'

handler: createHandler(() => {
  throw err.notFound('资源不存在')
})
```

## 最佳实践

### 1. 路由组织

```typescript
// 按功能组织路由
const userRoutes = [
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(() => ({ users: [] }))
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(({ body }) => ({ user: body }))
  }
]

const postRoutes = [
  {
    method: 'GET',
    path: '/posts',
    handler: createHandler(() => ({ posts: [] }))
  }
]

const routes = [
  {
    path: '/api',
    children: [...userRoutes, ...postRoutes]
  }
]
```

### 2. 中间件复用

```typescript
const commonMiddleware = [logMiddleware, corsMiddleware]

const routes = [
  {
    path: '/api',
    middleware: commonMiddleware,
    children: [
      // 所有子路由都会应用 commonMiddleware
    ]
  }
]
```

### 3. 类型安全（使用 Schema）

```typescript
import { defineRoutes, createHandler, Type } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/posts/:id/:category?',
    handler: createHandler(
      {
        params: Type.Object({
          id: Type.String(),
          category: Type.Optional(Type.String())
        })
      },
      ({ params }) => ({
        // params 自动获得类型推导
        postId: params.id,
        category: params.category ?? 'default'
      })
    )
  }
])
```

### 4. 端到端类型推断（用于 API 客户端）

`defineRoutes()` 自动保留字面量类型，配合 `vafast-api-client` 实现端到端类型安全：

```typescript
import { defineRoutes, createHandler, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(
      { query: Type.Object({ page: Type.Number() }) },
      async ({ query }) => ({ users: [], total: 0 })
    )
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      { body: Type.Object({ name: Type.String() }) },
      async ({ body }) => ({ id: '1', name: body.name })
    )
  },
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(
      { params: Type.Object({ id: Type.String() }) },
      async ({ params }) => ({ id: params.id, name: 'User' })
    )
  }
])

// ✅ 自动推断字面量类型，无需 as const！
type Api = InferEden<typeof routes>
```

## 路由类型总结

| 类型/函数 | 说明 | 用途 |
|-----------|------|------|
| `Route` | 基本路由接口 | 定义单个路由 |
| `NestedRoute` | 嵌套路由接口 | 定义路由组 |
| `Method` | HTTP 方法联合类型 | 类型约束 |
| `Handler` | 处理函数类型 | 类型约束 |
| `Middleware` | 中间件类型 | 类型约束 |
| `defineRoutes()` | 创建路由数组 | 自动保留字面量类型，支持端到端类型推断 |

## 功能总结

Vafast 的路由系统提供了：

- ✅ **defineRoutes()** - 自动保留字面量类型，支持端到端类型推断
- ✅ **createHandler** - 推荐的处理器工厂，提供统一上下文
- ✅ **自动响应转换** - 直接返回数据，无需手动创建 Response
- ✅ **完整的 HTTP 方法支持** - GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- ✅ **动态路由参数** - `:id` 必选参数，`:id?` 可选参数
- ✅ **嵌套路由结构** - children 支持无限嵌套
- ✅ **灵活的中间件系统** - 路由级和组级中间件
- ✅ **Schema 验证与类型推导** - 配合 TypeBox 实现运行时验证
- ✅ **端到端类型安全** - 配合 vafast-api-client 实现 API 类型推断

### 下一步

- 查看 [中间件系统](/middleware) 了解更高级的中间件用法
- 学习 [组件路由](/component-routing) 了解声明式路由
- 探索 [最佳实践](/best-practices) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
