---
title: 中间件系统 - Vafast
---

# 中间件系统

Vafast 的中间件系统是框架的核心功能之一，它允许您在请求处理过程中执行自定义逻辑。中间件可以用于身份验证、日志记录、错误处理、数据转换等。

## 什么是中间件？

中间件是一个函数，它在请求到达路由处理函数之前或之后执行。中间件可以：

- 修改请求对象
- 验证请求数据
- 记录请求信息
- 处理错误
- 添加响应头
- 执行任何自定义逻辑

## 中间件定义

### 基本中间件

Vafast 推荐使用 `defineMiddleware` 定义中间件，它提供更好的类型支持：

```typescript
import { defineMiddleware } from 'vafast'

const logMiddleware = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const response = await next()
  const duration = Date.now() - start
  
  console.log(`${req.method} ${req.url} - ${response.status} - ${duration}ms`)
  
  return response
})
```

### 中间件类型

```typescript
// 使用 defineMiddleware 定义（推荐）
import { defineMiddleware } from 'vafast'
const middleware = defineMiddleware(async (req, next) => {
  return await next()
})

// 或直接使用函数类型
type Middleware = (req: Request, next: () => Promise<Response>) => Promise<Response>
```

## 中间件执行顺序

中间件按照数组中的顺序执行，形成一个执行链：

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware, logMiddleware, rateLimitMiddleware],
    handler: () => 'Admin panel'
  })
])
```

执行顺序：
1. `authMiddleware` - 身份验证
2. `logMiddleware` - 日志记录
3. `rateLimitMiddleware` - 速率限制
4. 路由处理函数 - 实际业务逻辑

## 常用中间件示例

### 1. 日志中间件

```typescript
import { defineMiddleware } from 'vafast'

const logMiddleware = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const method = req.method
  const url = req.url
  const userAgent = req.headers.get('user-agent')
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${userAgent}`)
  
  const response = await next()
  const duration = Date.now() - start
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} - ${duration}ms`)
  
  return response
})
```

### 2. 身份验证中间件

```typescript
import { defineRoute, defineRoutes, defineMiddleware, json } from 'vafast'

type AuthContext = { user: { id: string; name: string } }

const authMiddleware = defineMiddleware<AuthContext>(async (req, next) => {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  try {
    // 验证 token
    const user = await validateToken(token)
    
    // 通过 next 传递用户信息
    return await next({ user })
  } catch (error) {
    return json({ error: 'Invalid token' }, 401)
  }
})

// 使用示例
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [authMiddleware],
    handler: ({ user }) => ({
      message: `Hello ${user.name}`
    })
  })
])
```

> **新框架用法说明**：
> - 使用 `defineMiddleware` 定义带类型的中间件
> - 通过 `next({ user })` 传递上下文
> - Handler 自动获得类型推断，无需 `createHandlerWithExtra`

### 3. CORS 中间件

```typescript
import { defineMiddleware } from 'vafast'

const corsMiddleware = defineMiddleware(async (req, next) => {
  const response = await next()
  
  // 添加 CORS 头
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
})
```

> 💡 **提示**：Vafast 提供了官方的 CORS 中间件 `@vafast/cors`，推荐使用官方中间件而不是手动实现。

### 4. 速率限制中间件

```typescript
import { defineMiddleware, json } from 'vafast'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const rateLimitMiddleware = defineMiddleware(async (req, next) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 分钟
  const maxRequests = 100
  
  const key = `${ip}:${Math.floor(now / windowMs)}`
  const current = rateLimitMap.get(key)
  
  if (current && current.resetTime > now) {
    if (current.count >= maxRequests) {
      return json({ error: 'Too many requests' }, 429)
    }
    current.count++
  } else {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
  }
  
  return next()
})
```

> 💡 **提示**：Vafast 提供了官方的速率限制中间件 `@vafast/rate-limit`，推荐使用官方中间件而不是手动实现。

### 5. 错误处理

框架**自动注入** `errorHandler`，无需手写错误捕获中间件。在 handler 中 `throw err.xxx()` 即可：

```typescript
import { err } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => {
    const user = findUser(params.id)
    if (!user) throw err.notFound('用户不存在')
    return user
  },
})
// 自动返回 { code: 404, message: '用户不存在' }
```

常用：`err.badRequest()` `err.unauthorized()` `err.forbidden()` `err.notFound()` `err.conflict()` `err.internal()`

### 6. 数据验证中间件

::: tip 推荐
Vafast 的 `defineRoute` 已内置 Schema 验证功能，无需手动编写验证中间件。
:::

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

// 使用 defineRoute 内置验证（推荐）
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 2 }),
        email: Type.String({ format: 'email' }),
        age: Type.Optional(Type.Number({ minimum: 18 }))
      })
    },
    handler: ({ body }) => ({
      data: { message: 'User created', user: body },
      status: 201
    })
  })
])
```

## 中间件组合

### 创建中间件组合器

```typescript
import { defineMiddleware } from 'vafast'

const combineMiddleware = (...middlewares: any[]) => {
  return defineMiddleware(async (req, next) => {
    let index = 0
    
    const executeNext = async (): Promise<Response> => {
      if (index >= middlewares.length) {
        return next()
      }
      
      const middleware = middlewares[index++]
      return middleware(req, executeNext)
    }
    
    return executeNext()
  })
}

// 使用示例
const combinedMiddleware = combineMiddleware(
  logMiddleware,
  corsMiddleware,
  rateLimitMiddleware
)

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    middleware: [combinedMiddleware],
    handler: () => ({ message: 'Users' })
  })
])
```

### 条件中间件

```typescript
import { defineMiddleware } from 'vafast'

const conditionalMiddleware = (condition: (req: Request) => boolean, middleware: any) => {
  return defineMiddleware(async (req, next) => {
    if (condition(req)) {
      return middleware(req, next)
    }
    return next()
  })
}

// 使用示例
const adminOnly = conditionalMiddleware(
  (req) => req.url.includes('/admin'),
  authMiddleware
)

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin/users',
    middleware: [adminOnly],
    handler: () => ({ users: [] })
  })
])
```

## 全局中间件

Vafast 支持两种方式应用全局中间件：

### 方式一：使用 server.use()

为整个应用应用全局中间件：

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => ({ message: 'Users' })
  }),
  defineRoute({
    method: 'GET',
    path: '/posts',
    handler: () => ({ message: 'Posts' })
  })
])

const server = new Server(routes)

// 应用全局中间件
server.use(logMiddleware)
server.use(corsMiddleware)

export default { fetch: server.fetch }
```

### 方式二：在嵌套路由中应用

为特定路径前缀应用中间件：

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [logMiddleware, corsMiddleware], // 应用到所有 /api 路由
    children: [
      defineRoute({
        method: 'GET',
        path: '/users',
        handler: () => ({ message: 'Users' })
      }),
      defineRoute({
        method: 'GET',
        path: '/posts',
        handler: () => ({ message: 'Posts' })
      })
    ]
  })
])
```

## 父级中间件类型注入（withContext）

当中间件在父级路由定义时，子路由需要使用 `withContext` 来获得类型推断。这是封装自定义路由定义器的核心机制。

### 问题场景

在嵌套路由中，父级中间件注入的上下文类型在子路由中会丢失：

```typescript
// ❌ 类型丢失
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [authMiddleware],  // 注入 userInfo
    children: [
      defineRoute({
        method: 'GET',
        path: '/profile',
        handler: ({ userInfo }) => {
          // ❌ userInfo 类型是 unknown
          return { id: userInfo.id }
        }
      })
    ]
  })
])
```

### 解决方案：使用 withContext

使用 `withContext` 创建自定义路由定义器，让子路由自动获得父级中间件注入的类型：

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

### 生产项目：使用 @vafast/auth-middleware

Captions 体系微服务（`ones-server`、`ai-server` 等）不手写 `withContext`，而是直接使用 `@vafast/auth-middleware` 内置的路由定义器：

| 定义器 | 上下文 |
|--------|--------|
| `defineAuthRoute` | `{ userInfo }` |
| `defineAuthRouteWithApp` | `{ userInfo, app }`（最常用） |
| `defineRouteWithApp` | `{ app }` |

配合 `authWithApp`、`requireUser` 等中间件使用：

```typescript
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'

export const filesRoutes = defineRoutes([
  defineRoute({
    path: '/files',
    middleware: [authWithApp],
    children: [
      defineAuthRouteWithApp({
        method: 'POST',
        path: '/create',
        middleware: [requireUser],
        webhook: true,
        handler: ({ userInfo, app, body }) => ({ ... }),
      }),
    ],
  }),
])
```

> 📖 完整 API 与生产模式见 [Auth Middleware](/middleware/auth-middleware)

### 自定义 withContext（高级）

若需自建认证逻辑（不依赖 auth-server），可手动封装：

`withContext` 具有以下特性：

1. **零运行时开销**：`withContext` 只是类型层面的包装，编译后和普通 `defineRoute` 完全相同，不会影响运行时性能
2. **类型自动合并**：如果路由同时使用多个中间件，上下文类型会自动合并
3. **支持嵌套使用**：可以在不同的路由层级使用不同的 `withContext`，类型会正确传递
4. **TypeScript 原生支持**：完全基于 TypeScript 的类型系统，无需额外的运行时类型检查

### 为什么不能自动推断？

这是 TypeScript 的限制。TypeScript 只能在**同一个函数调用**中推断泛型类型，无法跨函数调用传递类型信息。

在嵌套路由中：
- `defineRoute({ path: '/api', middleware: [authMiddleware], children: [...] })` 是一个函数调用
- `children` 中的 `defineRoute({ ... })` 是另一个独立的函数调用
- TypeScript 无法在第二个函数调用中感知第一个函数调用中的 `middleware` 类型

`withContext` 通过预设上下文类型解决了这个问题，让子路由能够"记住"父级中间件注入的类型。

### 优势

1. **类型安全**：子路由自动获得父级中间件注入的上下文类型
2. **代码复用**：封装一次，多处使用
3. **清晰明确**：通过命名就能知道路由需要什么上下文
4. **易于维护**：上下文类型集中管理，修改时只需更新一处
5. **零运行时开销**：纯类型层面的实现，不影响性能

> 📖 更多详情请查看 [路由指南 - 封装自定义路由定义器](/routing#5-封装自定义路由定义器withcontext)

## 中间件最佳实践

### 1. 保持中间件简单

```typescript
import { defineMiddleware, json } from 'vafast'

// 好的做法：每个中间件只做一件事
const logRequest = defineMiddleware(async (req, next) => {
  console.log(`${req.method} ${req.url}`)
  return next()
})

const logResponse = defineMiddleware(async (req, next) => {
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
})

// 不好的做法：一个中间件做太多事
const logEverything = defineMiddleware(async (req, next) => {
  // 记录请求
  console.log(`${req.method} ${req.url}`)
  
  // 验证 token
  const token = req.headers.get('authorization')
  if (!token) return json({ error: 'Unauthorized' }, 401)
  
  // 记录响应
  const response = await next()
  console.log(`Response: ${response.status}`)
  
  return response
})
```

### 2. 错误处理

```typescript
import { defineMiddleware, json } from 'vafast'

const safeMiddleware = (middleware: any) => {
  return defineMiddleware(async (req, next) => {
    try {
      return await middleware(req, next)
    } catch (error) {
      console.error('Middleware error:', error)
      return json({ error: 'Middleware error' }, 500)
    }
  })
}

// 使用安全中间件
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    middleware: [safeMiddleware(authMiddleware)],
    handler: () => ({ message: 'Users' })
  })
])
```

### 3. 中间件顺序

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    middleware: [
      logMiddleware,        // 1. 日志记录
      corsMiddleware,       // 2. CORS 处理
      rateLimitMiddleware,  // 3. 速率限制
      authMiddleware,       // 4. 身份验证
      // errorHandler 由框架自动注入，无需手动注册
    ],
    handler: () => ({ message: 'Users' })
  })
])
```

### 4. 中间件测试

```typescript
// 测试中间件
const testMiddleware = async (middleware: any, req: Request) => {
  let executed = false
  
  const next = async () => {
    executed = true
    return new Response('Test response')
  }
  
  const result = await middleware(req, next)
  
  return {
    executed,
    result,
    status: result.status
  }
}

// 测试示例
const testReq = new Request('http://localhost:3000/test')
const testResult = await testMiddleware(logMiddleware, testReq)
console.log('Test result:', testResult)
```

## 总结

Vafast 的中间件系统提供了：

- ✅ 灵活的中间件定义
- ✅ 可预测的执行顺序
- ✅ 强大的错误处理
- ✅ 中间件组合和复用
- ✅ 全局和局部应用
- ✅ 类型安全的实现

### 下一步

- 查看 [路由指南](/routing) 了解路由系统
- 学习 [组件路由](/component-routing) 了解声明式路由
- 探索 [最佳实践](/best-practices) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
