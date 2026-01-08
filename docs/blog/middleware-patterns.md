---
title: Vafast 中间件设计模式与最佳实践
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../components/blog/Layout.vue'
</script>

<Blog
title="Vafast 中间件设计模式与最佳实践"
src="/blog/middleware-patterns/cover.webp"
alt="中间件设计模式"
author="vafast"
date="2024 年 1 月 8 日"
>

中间件是 Web 框架中最强大的概念之一。它允许我们在请求处理的前后插入自定义逻辑，实现认证、日志、错误处理等横切关注点。

Vafast 的中间件设计简洁而强大，本文将介绍几种常用的中间件设计模式。

## 中间件基础

在 Vafast 中，中间件是一个接收 `Request` 和 `next` 函数的异步函数：

```ts
type Middleware = (
  req: Request,
  next: () => Promise<Response>
) => Promise<Response>
```

最简单的中间件：

```ts
const logger: Middleware = async (req, next) => {
  console.log(`${req.method} ${req.url}`)
  return await next()
}
```

## 模式一：认证中间件

认证是最常见的中间件场景。让我们实现一个 JWT 认证中间件：

```ts
import { json } from 'vafast'

interface AuthConfig {
  secret: string
  excludePaths?: string[]
}

const createAuthMiddleware = (config: AuthConfig) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const url = new URL(req.url)
    
    // 跳过排除的路径
    if (config.excludePaths?.includes(url.pathname)) {
      return await next()
    }
    
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return json({ error: '未提供认证令牌' }, 401)
    }
    
    try {
      // 验证 JWT（这里简化处理）
      const payload = verifyJWT(token, config.secret)
      
      // 将用户信息附加到请求头，供后续处理器使用
      const headers = new Headers(req.headers)
      headers.set('X-User-Id', payload.userId)
      headers.set('X-User-Role', payload.role)
      
      const newReq = new Request(req.url, {
        method: req.method,
        headers,
        body: req.body
      })
      
      return await next()
    } catch {
      return json({ error: '令牌无效或已过期' }, 401)
    }
  }
}

// 使用
const authMiddleware = createAuthMiddleware({
  secret: process.env.JWT_SECRET!,
  excludePaths: ['/login', '/register', '/health']
})
```

## 模式二：角色权限中间件

基于认证中间件，我们可以实现角色权限控制：

```ts
type Role = 'admin' | 'user' | 'guest'

const requireRole = (...roles: Role[]) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const userRole = req.headers.get('X-User-Role') as Role
    
    if (!userRole || !roles.includes(userRole)) {
      return json({ error: '权限不足' }, 403)
    }
    
    return await next()
  }
}

// 使用示例
const routes = defineRoutes([
  {
    method: 'DELETE',
    path: '/users/:id',
    middleware: [authMiddleware, requireRole('admin')],
    handler: createHandler(
      { params: Type.Object({ id: Type.String() }) },
      async ({ params }) => {
        // 只有管理员可以删除用户
        await deleteUser(params.id)
        return { success: true }
      }
    )
  }
])
```

## 模式三：请求限流中间件

防止 API 被滥用，实现简单的速率限制：

```ts
interface RateLimitConfig {
  windowMs: number      // 时间窗口（毫秒）
  maxRequests: number   // 最大请求数
}

const createRateLimiter = (config: RateLimitConfig) => {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return async (req: Request, next: () => Promise<Response>) => {
    const clientIP = req.headers.get('X-Forwarded-For') || 'unknown'
    const now = Date.now()
    
    let record = requests.get(clientIP)
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + config.windowMs }
      requests.set(clientIP, record)
    }
    
    record.count++
    
    if (record.count > config.maxRequests) {
      return json(
        { error: '请求过于频繁，请稍后再试' },
        429,
        {
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0'
        }
      )
    }
    
    const response = await next()
    
    // 添加限流信息到响应头
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(config.maxRequests - record.count))
    
    return response
  }
}

// 使用
const rateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 分钟
  maxRequests: 100       // 最多 100 次请求
})
```

## 模式四：请求日志中间件

记录请求信息和响应时间：

```ts
interface LogEntry {
  method: string
  path: string
  status: number
  duration: number
  timestamp: string
}

const requestLogger = async (req: Request, next: () => Promise<Response>) => {
  const start = performance.now()
  const url = new URL(req.url)
  
  const response = await next()
  
  const duration = Math.round(performance.now() - start)
  
  const logEntry: LogEntry = {
    method: req.method,
    path: url.pathname,
    status: response.status,
    duration,
    timestamp: new Date().toISOString()
  }
  
  // 根据状态码使用不同的日志级别
  if (response.status >= 500) {
    console.error('[ERROR]', JSON.stringify(logEntry))
  } else if (response.status >= 400) {
    console.warn('[WARN]', JSON.stringify(logEntry))
  } else {
    console.log('[INFO]', JSON.stringify(logEntry))
  }
  
  // 添加响应时间头
  response.headers.set('X-Response-Time', `${duration}ms`)
  
  return response
}
```

## 模式五：错误处理中间件

统一处理所有未捕获的错误：

```ts
interface AppError extends Error {
  status?: number
  code?: string
}

const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    const appError = error as AppError
    
    // 开发环境输出详细错误
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled error:', error)
    }
    
    // 根据错误类型返回适当的响应
    const status = appError.status || 500
    const message = status === 500 
      ? '服务器内部错误' 
      : appError.message
    
    return json({
      error: message,
      code: appError.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: appError.stack
      })
    }, status)
  }
}
```

## 模式六：CORS 中间件

处理跨域请求：

```ts
interface CorsConfig {
  origins: string[]
  methods?: string[]
  headers?: string[]
  credentials?: boolean
}

const createCors = (config: CorsConfig) => {
  const {
    origins,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = false
  } = config
  
  return async (req: Request, next: () => Promise<Response>) => {
    const origin = req.headers.get('Origin')
    
    // 检查是否允许的来源
    const allowedOrigin = origins.includes('*') 
      ? '*' 
      : origins.find(o => o === origin)
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin || '',
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
          'Access-Control-Allow-Credentials': String(credentials),
          'Access-Control-Max-Age': '86400'
        }
      })
    }
    
    const response = await next()
    
    // 添加 CORS 头
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
      if (credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      }
    }
    
    return response
  }
}

// 使用
const cors = createCors({
  origins: ['http://localhost:3000', 'https://example.com'],
  credentials: true
})
```

## 模式七：请求缓存中间件

对 GET 请求进行简单缓存：

```ts
interface CacheConfig {
  ttl: number  // 缓存时间（秒）
  keyFn?: (req: Request) => string
}

const createCache = (config: CacheConfig) => {
  const cache = new Map<string, { response: Response; expiry: number }>()
  
  const defaultKeyFn = (req: Request) => {
    const url = new URL(req.url)
    return `${req.method}:${url.pathname}${url.search}`
  }
  
  const keyFn = config.keyFn || defaultKeyFn
  
  return async (req: Request, next: () => Promise<Response>) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return await next()
    }
    
    const key = keyFn(req)
    const now = Date.now()
    
    // 检查缓存
    const cached = cache.get(key)
    if (cached && cached.expiry > now) {
      const response = cached.response.clone()
      response.headers.set('X-Cache', 'HIT')
      return response
    }
    
    const response = await next()
    
    // 只缓存成功的响应
    if (response.status === 200) {
      cache.set(key, {
        response: response.clone(),
        expiry: now + config.ttl * 1000
      })
    }
    
    response.headers.set('X-Cache', 'MISS')
    return response
  }
}

// 使用
const cacheMiddleware = createCache({ ttl: 60 })  // 缓存 60 秒
```

## 组合中间件

Vafast 支持在路由级别和全局级别组合中间件：

```ts
const server = new Server(routes, {
  // 全局中间件
  middleware: [cors, errorHandler, requestLogger]
})

// 路由级别中间件
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/public/data',
    middleware: [cacheMiddleware],  // 只有这个路由使用缓存
    handler: createHandler(() => getData())
  },
  {
    method: 'POST',
    path: '/admin/action',
    middleware: [authMiddleware, requireRole('admin'), rateLimiter],
    handler: createHandler(({ body }) => doAction(body))
  }
])
```

## 最佳实践总结

1. **单一职责**：每个中间件只做一件事
2. **可配置**：使用工厂函数创建可配置的中间件
3. **顺序重要**：注意中间件的执行顺序（错误处理应该在最外层）
4. **性能考虑**：避免在中间件中进行昂贵的操作
5. **类型安全**：利用 TypeScript 确保中间件的类型正确

Vafast 的中间件系统简洁而强大，合理使用中间件可以让你的代码更加模块化、可维护。

查看更多：
- [Vafast 中间件文档](/essential/middleware)
- [Vafast GitHub](https://github.com/vafast/vafast)

</Blog>
