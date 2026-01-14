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

// Handler 类型（推荐）
type Handler = (ctx: HandlerContext) => ResponseBody | Promise<ResponseBody>
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
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: ({ body }) => ({ user: body })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

> **新框架用法说明**：
> - 所有路由必须使用 `defineRoute` 包装
> - Handler 直接是函数，不再需要 `createHandler` 包装

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
  defineRoute({ method: 'GET', path: '/users', handler: () => ({ users: [] }) }),
  defineRoute({ method: 'POST', path: '/users', handler: ({ body }) => body }),
  defineRoute({ method: 'PUT', path: '/users/:id', handler: ({ params }) => params }),
  defineRoute({ method: 'DELETE', path: '/users/:id', handler: () => null }),  // 返回 204
  defineRoute({ method: 'PATCH', path: '/users/:id', handler: ({ params, body }) => ({ ...body }) })
])
```

## 动态路由

Vafast 支持动态路由参数，允许您捕获 URL 中的变量值。

### 基本参数

```typescript
defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => ({
    userId: params.id
  })
})
```

### 多个参数

```typescript
defineRoute({
  method: 'GET',
  path: '/users/:userId/posts/:postId',
  handler: ({ params }) => ({
    userId: params.userId,
    postId: params.postId
  })
})
```

### 可选参数

```typescript
defineRoute({
  method: 'GET',
  path: '/users/:id?',
  handler: ({ params }) => {
    if (params.id) {
      return { userId: params.id }
    }
    return { users: [] }
  }
})
```

## 嵌套路由

Vafast 支持嵌套路由结构，允许您组织复杂的路由层次。

### 基本嵌套

```typescript
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    children: [
      defineRoute({
        method: 'GET',
        path: '/users',
        handler: () => ({ message: 'Users API' })
      }),
      defineRoute({
        method: 'GET',
        path: '/posts',
        handler: () => ({ message: 'Posts API' })
      })
    ]
  })
])
```

### 深层嵌套

```typescript
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    children: [
      defineRoute({
        path: '/v1',
        children: [
          defineRoute({
            path: '/users',
            children: [
              defineRoute({
                method: 'GET',
                path: '/',
                handler: () => ({ message: 'Users v1' })
              }),
              defineRoute({
                method: 'POST',
                path: '/',
                handler: ({ body }) => ({ message: 'Create user v1', data: body })
              })
            ]
          })
        ]
      })
    ]
  })
])
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
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware, logMiddleware],
    handler: () => ({ message: 'Admin panel' })
  })
])
```

### 全局中间件

```typescript
const routes = defineRoutes([
  {
    path: '/api',
    middleware: [logMiddleware], // 应用到所有子路由
    children: [
      defineRoute({
        method: 'GET',
        path: '/users',
        handler: () => ({ message: 'Users' })
      })
    ]
  }
])
```

## 路由处理函数

处理函数是路由的核心，负责处理请求并返回响应。**Handler 直接是函数，不再需要 `createHandler` 包装**，框架会自动处理上下文解构和响应转换。

### 基本处理函数

```typescript
defineRoute({
  method: 'GET',
  path: '/hello',
  handler: () => 'Hello World'
})
```

### 异步处理函数

```typescript
defineRoute({
  method: 'POST',
  path: '/users',
  handler: async ({ body }) => {
    // body 已自动解析
    const user = await createUser(body)
    return user
  }
})
```

### 访问请求上下文

Handler 自动提供完整的请求上下文：

```typescript
defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ req, params, query, headers, cookies }) => ({
    userId: params.id,
    search: query.q,
    userAgent: headers['user-agent']
  })
})
```

## 响应处理

Vafast 会**自动转换返回值**为 Response，你可以直接返回数据：

### 自动响应转换

```typescript
// 字符串 → text/plain
handler: () => 'Hello World'

// 对象/数组 → application/json
handler: () => ({ message: 'Success' })

// 数字/布尔 → text/plain
handler: () => 42

// null/undefined → 204 No Content
handler: () => null
```

### 自定义状态码和头部

使用 `{ data, status, headers }` 格式可以控制响应细节：

```typescript
handler: () => ({
  data: { user: { id: 1, name: 'John' } },
  status: 201,
  headers: { 'X-Custom-Header': 'value' }
})
```

### 重定向

```typescript
import { redirect } from 'vafast'

handler: () => redirect('/new-page')
```

### 手动 Response（不推荐）

如需完全控制，仍可返回 Response 对象：

```typescript
handler: () => new Response('Custom', {
  status: 200,
  headers: { 'Content-Type': 'text/custom' }
})
```

## 错误处理

Vafast 内置了自动错误处理，Handler 会自动捕获错误并返回格式化响应。

### 抛出错误

```typescript
handler: () => {
  throw new Error('Something went wrong')
}
// 自动返回 500 错误响应
```

### 使用 VafastError 返回错误状态

```typescript
import { err } from 'vafast'

handler: () => {
  throw err.notFound('资源不存在')
}
```

## 最佳实践

### 1. 路由组织

```typescript
// 按功能组织路由
const userRoutes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => ({ users: [] })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: ({ body }) => ({ user: body })
  })
])

const postRoutes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/posts',
    handler: () => ({ posts: [] })
  })
])

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
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/posts/:id/:category?',
    schema: {
      params: Type.Object({
        id: Type.String(),
        category: Type.Optional(Type.String())
      })
    },
    handler: ({ params }) => ({
      // params 自动获得类型推导
      postId: params.id,
      category: params.category ?? 'default'
    })
  })
])
```

### 4. 端到端类型推断（用于 API 客户端）

`defineRoutes()` 自动保留字面量类型，配合 `vafast-api-client` 实现端到端类型安全：

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    schema: { query: Type.Object({ page: Type.Number() }) },
    handler: async ({ query }) => ({ users: [], total: 0 })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: Type.Object({ name: Type.String() }) },
    handler: async ({ body }) => ({ id: '1', name: body.name })
  }),
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async ({ params }) => ({ id: params.id, name: 'User' })
  })
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

## 扩展字段 — 声明式元数据

Vafast 的声明式路由支持**任意扩展字段**，让路由定义成为业务逻辑的单一数据源。你可以直接在路由定义中添加自定义字段，用于 Webhook、权限、计费、审计等场景。

### 基本用法

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/auth/signIn',
    name: '用户登录',
    description: '用户通过邮箱密码登录',
    handler: signInHandler,
    // ✨ 扩展字段：Webhook 事件
    webhook: { eventKey: 'auth.signIn', enabled: true },
    // ✨ 扩展字段：权限要求
    permission: 'auth.signIn',
    // ✨ 扩展字段：计费配置
    billing: { price: 0, currency: 'USD' }, // 免费
  }),
  defineRoute({
    method: 'POST',
    path: '/ai/generate',
    name: 'AI 生成',
    description: '生成 AI 内容',
    handler: generateAIHandler,
    // ✨ 扩展字段：按请求计费
    billing: { price: 0.01, currency: 'USD', unit: 'request' },
    permission: 'ai.generate',
  }),
  defineRoute({
    method: 'POST',
    path: '/ai/chat',
    name: 'AI 对话',
    handler: chatAIHandler,
    // ✨ 扩展字段：按 token 计费
    billing: { price: 0.0001, currency: 'USD', unit: 'token' },
    permission: 'ai.chat',
  }),
])
```

### 在中间件中使用扩展字段

中间件可以通过 `RouteRegistry` 读取路由元数据：

```typescript
import { defineMiddleware, getRouteRegistry } from 'vafast'

// 计费中间件：基于路由元数据自动计费
const billingMiddleware = defineMiddleware(async (req, next) => {
  const registry = getRouteRegistry()
  const url = new URL(req.url)
  const route = registry.get(req.method, url.pathname)
  
  if (route?.billing) {
    const { price, currency, unit } = route.billing
    const userId = getUserId(req)
    
    // 执行计费逻辑
    await chargeUser(userId, {
      api: `${req.method} ${url.pathname}`,
      price,
      currency,
      unit,
    })
  }
  
  return next()
})

// 权限中间件：基于路由元数据检查权限
const permissionMiddleware = defineMiddleware(async (req, next) => {
  const registry = getRouteRegistry()
  const url = new URL(req.url)
  const route = registry.get(req.method, url.pathname)
  
  if (route?.permission) {
    const user = await getUser(req)
    if (!hasPermission(user, route.permission)) {
      return new Response('Forbidden', { status: 403 })
    }
  }
  
  return next()
})
```

## 路由注册表 (RouteRegistry)

`RouteRegistry` 提供路由元信息的收集和查询能力，适用于 API 文档生成、Webhook 事件注册、权限检查、按 API 计费等场景。

### 基本用法

```typescript
import { Server, defineRoute, defineRoutes, getRouteRegistry } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/auth/signIn',
    name: '用户登录',
    description: '用户通过邮箱密码登录',
    handler: signInHandler,
    webhook: { eventKey: 'auth.signIn' },
    permission: 'auth.signIn',
  }),
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: getUsersHandler,
    permission: 'users.read',
  }),
])

const server = new Server(routes)

// Server 创建时自动设置全局注册表，直接使用即可
const registry = getRouteRegistry()

// 查询路由元信息
const route = registry.get('POST', '/auth/signIn')
console.log(route?.name)        // '用户登录'
console.log(route?.webhook)     // { eventKey: 'auth.signIn' }
console.log(route?.permission)  // 'auth.signIn'
```

### 筛选路由

```typescript
// 筛选有特定字段的路由
const webhookRoutes = registry.filter('webhook')      // 所有 Webhook 事件
const paidRoutes = registry.filter('billing')         // 所有付费 API
const aiRoutes = registry.filterBy(r => r.permission?.startsWith('ai.')) // AI 相关 API

// 按分类获取
const authRoutes = registry.getByCategory('auth')
const aiCategoryRoutes = registry.getByCategory('ai')

// 获取所有分类
const categories = registry.getCategories()  // ['auth', 'users']
```

### 便捷函数

```typescript
import {
  getRouteRegistry,  // 获取全局注册表实例
  getRoute,          // 快速查询单个路由
  getAllRoutes,      // 获取所有路由
  filterRoutes,      // 按字段筛选
  getRoutesByMethod, // 按 HTTP 方法获取
} from 'vafast'

// 方式一：使用全局注册表实例
const registry = getRouteRegistry()
const route = registry.get('POST', '/users')

// 方式二：使用便捷函数（推荐，更简洁）
const route = getRoute('POST', '/users')
const allRoutes = getAllRoutes()
const webhookRoutes = filterRoutes('webhook')
const getRoutes = getRoutesByMethod('GET')
const postRoutes = getRoutesByMethod('POST')
```

### 扩展字段的优势

1. **单一数据源**：路由定义包含所有元数据，无需额外配置文件
2. **类型安全**：扩展字段在 TypeScript 中完全类型化
3. **运行时查询**：通过 `RouteRegistry` API 动态查询和筛选
4. **业务集成**：中间件可直接读取路由元数据，实现计费、权限、审计等功能
5. **API 网关友好**：声明式配置完美适配网关场景

## 功能总结

Vafast 的路由系统提供了：

- ✅ **defineRoutes()** - 自动保留字面量类型，支持端到端类型推断
- ✅ **defineRoute()** - 推荐的处理器定义方式，提供统一上下文和类型安全
- ✅ **自动响应转换** - 直接返回数据，无需手动创建 Response
- ✅ **完整的 HTTP 方法支持** - GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- ✅ **动态路由参数** - `:id` 必选参数，`:id?` 可选参数
- ✅ **嵌套路由结构** - children 支持无限嵌套
- ✅ **灵活的中间件系统** - 路由级和组级中间件
- ✅ **Schema 验证与类型推导** - 配合 TypeBox 实现运行时验证
- ✅ **端到端类型安全** - 配合 vafast-api-client 实现 API 类型推断
- ✅ **扩展字段** - 支持任意自定义字段，用于 Webhook、权限、计费等场景
- ✅ **RouteRegistry** - 路由元信息查询和筛选 API

### 下一步

- 查看 [中间件系统](/middleware) 了解更高级的中间件用法
- 学习 [组件路由](/component-routing) 了解声明式路由
- 探索 [最佳实践](/best-practices) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
