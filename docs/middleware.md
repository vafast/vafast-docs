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

```typescript
const logMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const start = Date.now()
  const response = await next()
  const duration = Date.now() - start
  
  console.log(`${req.method} ${req.url} - ${response.status} - ${duration}ms`)
  
  return response
}
```

### 中间件类型

```typescript
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
const logMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const start = Date.now()
  const method = req.method
  const url = req.url
  const userAgent = req.headers.get('user-agent')
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${userAgent}`)
  
  const response = await next()
  const duration = Date.now() - start
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} - ${duration}ms`)
  
  return response
}
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
const corsMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const response = await next()
  
  // 添加 CORS 头
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}
```

### 4. 速率限制中间件

```typescript
import { json } from 'vafast'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const rateLimitMiddleware = async (req: Request, next: () => Promise<Response>) => {
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
}
```

### 5. 错误处理中间件

```typescript
import { json } from 'vafast'

const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    console.error('Error in route:', error)
    
    if (error instanceof Error) {
      return json({ error: error.message }, 500)
    }
    
    return json({ error: 'Internal Server Error' }, 500)
  }
}
```

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
const combineMiddleware = (...middlewares: any[]) => {
  return async (req: Request, next: () => Promise<Response>) => {
    let index = 0
    
    const executeNext = async (): Promise<Response> => {
      if (index >= middlewares.length) {
        return next()
      }
      
      const middleware = middlewares[index++]
      return middleware(req, executeNext)
    }
    
    return executeNext()
  }
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
const conditionalMiddleware = (condition: (req: Request) => boolean, middleware: any) => {
  return async (req: Request, next: () => Promise<Response>) => {
    if (condition(req)) {
      return middleware(req, next)
    }
    return next()
  }
}

// 使用示例
const adminOnly = conditionalMiddleware(
  (req) => req.url.includes('/admin'),
  authMiddleware
)

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/admin/users',
    middleware: [adminOnly],
    handler: createHandler(() => ({ users: [] }))
  }
])
```

## 全局中间件

您可以为整个应用或特定路径前缀应用中间件：

```typescript
const routes = defineRoutes([
  {
    path: '/api',
    middleware: [logMiddleware, corsMiddleware], // 应用到所有 /api 路由
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: createHandler(() => ({ message: 'Users' }))
      },
      {
        method: 'GET',
        path: '/posts',
        handler: createHandler(() => ({ message: 'Posts' }))
      }
    ]
  }
])
```

## 中间件最佳实践

### 1. 保持中间件简单

```typescript
import { json } from 'vafast'

// 好的做法：每个中间件只做一件事
const logRequest = async (req: Request, next: () => Promise<Response>) => {
  console.log(`${req.method} ${req.url}`)
  return next()
}

const logResponse = async (req: Request, next: () => Promise<Response>) => {
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
}

// 不好的做法：一个中间件做太多事
const logEverything = async (req: Request, next: () => Promise<Response>) => {
  // 记录请求
  console.log(`${req.method} ${req.url}`)
  
  // 验证 token
  const token = req.headers.get('authorization')
  if (!token) return json({ error: 'Unauthorized' }, 401)
  
  // 记录响应
  const response = await next()
  console.log(`Response: ${response.status}`)
  
  return response
}
```

### 2. 错误处理

```typescript
import { json } from 'vafast'

const safeMiddleware = (middleware: any) => {
  return async (req: Request, next: () => Promise<Response>) => {
    try {
      return await middleware(req, next)
    } catch (error) {
      console.error('Middleware error:', error)
      return json({ error: 'Middleware error' }, 500)
    }
  }
}

// 使用安全中间件
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/users',
    middleware: [safeMiddleware(authMiddleware)],
    handler: createHandler(() => ({ message: 'Users' }))
  }
])
```

### 3. 中间件顺序

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/users',
    middleware: [
      logMiddleware,        // 1. 日志记录
      corsMiddleware,       // 2. CORS 处理
      rateLimitMiddleware,  // 3. 速率限制
      authMiddleware,       // 4. 身份验证
      errorHandler          // 5. 错误处理
    ],
    handler: createHandler(() => ({ message: 'Users' }))
  }
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
