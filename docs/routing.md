---
title: 路由指南 - Vafast
---

# 路由指南

Vafast 的路由系统是框架的核心，它提供了强大而灵活的方式来定义 API 端点。本指南将详细介绍 Vafast 的路由功能。

## 路由类型定义

### 叶子路由 vs 路由组

```typescript
// 叶子路由：有 method + handler
defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => ({ id: params.id }),
})

// 路由组：无 method，只有 path + children（可挂 middleware）
defineRoute({
  path: '/api',
  middleware: [authMiddleware],
  children: [
    defineRoute({ method: 'GET', path: '/users', handler: () => [...] }),
  ],
})
```

`defineRoutes()` 会自动扁平化嵌套路径并合并中间件。

### ProcessedRoute

`defineRoutes()` 返回扁平化后的路由对象（`Route` 别名）：

```typescript
interface ProcessedRoute {
  method: Method
  path: string
  handler: (req: Request) => Promise<Response>
  middleware?: Middleware[]
  schema?: RouteSchema
  sse?: boolean
  name?: string
  description?: string
  [key: string]: unknown  // webhook、permission 等扩展
}
```

### Handler 类型

```typescript
// handler 接收上下文对象，返回值自动转 Response
type Handler = (ctx: HandlerContext) => unknown | Promise<unknown>

interface HandlerContext {
  req: Request
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
  headers: Record<string, string>
  cookies: Record<string, string>
  // + 中间件通过 defineMiddleware / next({ ... }) 注入的字段
}
```

### Middleware 类型

```typescript
type Middleware = (
  req: Request,
  next: (ctx?: unknown) => Promise<Response>
) => Response | Promise<Response>
```

生产认证与路由类型包装见 [Auth Middleware](/middleware/auth-middleware)。

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

## 路由匹配规则

Vafast 使用 Radix Tree 实现高效路由匹配（O(k) 时间复杂度，k 为路径段数）。

### 路由类型

| 类型 | 语法 | 示例 | 说明 |
|------|------|------|------|
| 静态路由 | `/path` | `/users`, `/api/v1/health` | 完全匹配 |
| 动态参数 | `/:param` | `/users/:id` | 匹配单个路径段，`params.id` |
| 通配符 | `/*` 或 `/*name` | `/files/*`, `/static/*filepath` | 匹配剩余所有路径 |

### 优先级规则

```
静态路由 > 动态参数 > 通配符
```

**注册顺序不影响优先级**：

```typescript
const routes = defineRoutes([
  // 乱序注册
  defineRoute({ method: 'GET', path: '/api/*', handler: wildcardHandler }),
  defineRoute({ method: 'GET', path: '/api/health', handler: staticHandler }),
  defineRoute({ method: 'GET', path: '/api/:id', handler: dynamicHandler }),
])

// GET /api/health      → staticHandler   ✅ 静态优先
// GET /api/123         → dynamicHandler  ✅ 动态次之
// GET /api/users/list  → wildcardHandler ✅ 通配符最后
```

### 同一位置支持不同参数名

不同路由在同一位置可以使用不同的参数名，每个路由独立返回其定义的参数名：

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:userId',
    handler: ({ params }) => params  // { userId: '1' }
  }),
  defineRoute({
    method: 'PUT',
    path: '/users/:id',
    handler: ({ params }) => params  // { id: '2' }
  }),
  defineRoute({
    method: 'DELETE',
    path: '/users/:uid',
    handler: ({ params }) => params  // { uid: '3' }
  }),
])

// GET /users/1    → { userId: '1' }
// PUT /users/2    → { id: '2' }
// DELETE /users/3 → { uid: '3' }
```

::: tip
参数名冲突时会输出警告（建议保持一致），但不影响功能。
:::

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

### 通配符路由

通配符 `*` 匹配路径的剩余所有部分：

```typescript
const routes = defineRoutes([
  // 匿名通配符
  defineRoute({
    method: 'GET',
    path: '/files/*',
    handler: ({ params }) => ({
      path: params['*']  // 'path/to/file.txt'
    })
  }),
  
  // 命名通配符
  defineRoute({
    method: 'GET',
    path: '/static/*filepath',
    handler: ({ params }) => ({
      filepath: params.filepath  // 'assets/css/style.css'
    })
  }),
  
  // 动态参数 + 通配符混合
  defineRoute({
    method: 'GET',
    path: '/repos/:owner/*path',
    handler: ({ params }) => ({
      owner: params.owner,       // 'facebook'
      path: params.path          // 'src/components/Button.tsx'
    })
  })
])

// GET /files/path/to/file.txt             → { '*': 'path/to/file.txt' }
// GET /static/assets/css/style.css        → { filepath: 'assets/css/style.css' }
// GET /repos/facebook/src/components/...  → { owner: 'facebook', path: '...' }
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
  defineRoute({
    path: '/api',
    middleware: [logMiddleware], // 应用到所有子路由
    children: [
      defineRoute({
        method: 'GET',
        path: '/users',
        handler: () => ({ message: 'Users' })
      })
    ]
  })
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

// 定义并处理路由
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

// ✅ 类型推断自动工作，无需 as const！
type Api = InferEden<typeof routes>
```

### 5. 封装自定义路由定义器（withContext）

当中间件在父级定义时，可以使用 `withContext` 创建自定义的路由定义器，让子路由自动获得类型推断。

#### 基本用法

```typescript
import { defineRoute, defineRoutes, withContext, defineMiddleware } from 'vafast'

// 定义上下文类型
type AuthContext = { userInfo: { id: string; role: string } }

// 创建认证中间件
const authMiddleware = defineMiddleware<AuthContext>(async (req, next) => {
  const userInfo = await verifyToken(req)
  return next({ userInfo })
})

// 使用 withContext 创建自定义路由定义器
const defineAuthRoute = withContext<AuthContext>()

const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [authMiddleware],  // 父级中间件注入 userInfo
    children: [
      defineAuthRoute({  // ← 使用自定义路由定义器
        method: 'GET',
        path: '/profile',
        handler: ({ userInfo }) => {
          // ✅ userInfo 自动有类型！
          return { id: userInfo.id, role: userInfo.role }
        }
      })
    ]
  })
])
```

#### 生产项目：@vafast/auth-middleware

微服务场景直接使用官方认证包，无需手写 `withContext`：

```typescript
import { authWithApp, requireUser, defineAuthRouteWithApp } from '@vafast/auth-middleware'

defineRoute({
  path: '/files',
  middleware: [authWithApp],
  children: [
    defineAuthRouteWithApp({
      method: 'GET',
      path: '/list',
      middleware: [requireUser],
      handler: ({ userInfo, app }) => ({ userId: userInfo.id, appId: app.id }),
    }),
  ],
})
```

> 📖 完整 API 见 [Auth Middleware](/middleware/auth-middleware)

#### 自定义 withContext（高级）

自建认证时可手动封装：

```typescript
import { withContext } from 'vafast'

export const defineAuthRoute = withContext<{ userInfo: UserInfo }>()
export const defineAuthRouteWithApp = withContext<{ userInfo: UserInfo; app: AppInfo }>()
export const defineRouteWithApp = withContext<{ app: AppInfo }>()
```

路由定义器对照：

- **`defineAuthRoute`**：只需要 `userInfo`
- **`defineAuthRouteWithApp`**：需要 `userInfo` + `app`（最常用）
- **`defineRouteWithApp`**：只需要 `app`
- **`defineOptionalAuthRoute`**：可选 `userInfo`

#### 特性

`withContext` 具有以下特性：

1. **零运行时开销**：`withContext` 只是类型层面的包装，编译后和普通 `defineRoute` 完全相同，不会影响运行时性能
2. **类型自动合并**：如果路由同时使用多个中间件，上下文类型会自动合并
3. **支持嵌套使用**：可以在不同的路由层级使用不同的 `withContext`，类型会正确传递
4. **TypeScript 原生支持**：完全基于 TypeScript 的类型系统，无需额外的运行时类型检查

#### 为什么不能自动推断？

这是 TypeScript 的限制。TypeScript 只能在**同一个函数调用**中推断泛型类型，无法跨函数调用传递类型信息。

在嵌套路由中：
- `defineRoute({ path: '/api', middleware: [authMiddleware], children: [...] })` 是一个函数调用
- `children` 中的 `defineRoute({ ... })` 是另一个独立的函数调用
- TypeScript 无法在第二个函数调用中感知第一个函数调用中的 `middleware` 类型

`withContext` 通过预设上下文类型解决了这个问题，让子路由能够"记住"父级中间件注入的类型。

#### 优势

1. **类型安全**：子路由自动获得父级中间件注入的上下文类型
2. **代码复用**：封装一次，多处使用
3. **清晰明确**：通过命名就能知道路由需要什么上下文
4. **易于维护**：上下文类型集中管理，修改时只需更新一处
5. **零运行时开销**：纯类型层面的实现，不影响性能

> 📖 更多详情请查看 [中间件指南 - 父级中间件类型注入](/middleware#父级中间件类型注入withcontext)

## 路由类型总结

| 类型/函数 | 说明 | 用途 |
|-----------|------|------|
| 叶子路由 | `method` + `path` + `handler` | 实际 API 端点 |
| 路由组 | `path` + `children`（无 method） | 路径前缀、共享中间件 |
| `ProcessedRoute` / `Route` | 扁平化后的路由对象 | `Server` 内部使用 |
| `defineRoutes()` | 创建并扁平化路由数组 | 类型推断 + 嵌套合并 |

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

- ✅ **Radix Tree 路由** - O(k) 时间复杂度的高效路由匹配
- ✅ **优先级规则** - 静态 > 动态 > 通配符，与 Hono/Fastify 一致
- ✅ **同一位置不同参数名** - 支持 CRUD 场景下不同方法使用不同参数名
- ✅ **defineRoutes()** - 自动保留字面量类型，支持端到端类型推断
- ✅ **defineRoute()** - 推荐的处理器定义方式，提供统一上下文和类型安全
- ✅ **自动响应转换** - 直接返回数据，无需手动创建 Response
- ✅ **完整的 HTTP 方法支持** - GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- ✅ **动态路由参数** - `:id` 必选参数，`:id?` 可选参数
- ✅ **通配符路由** - `*` 或 `*name` 匹配剩余所有路径
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
