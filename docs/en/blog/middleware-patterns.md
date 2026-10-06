---
title: Vafast Middleware Design Patterns and Best Practices
description: 'Vafast middleware design patterns and best practices: use defineMiddleware and next to pass context, and implement common patterns such as auth, logging and error handling.'
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../../components/blog/Layout.vue'
</script>

<Blog
title="Vafast Middleware Design Patterns and Best Practices"
src="/blog/middleware-patterns/cover.webp"
alt="Middleware design patterns"
author="vafast"
date="January 8, 2024"
>

Middleware is one of the most powerful concepts in a web framework. It lets us insert custom logic before and after request handling to implement cross-cutting concerns such as auth, logging and error handling.

Vafast's middleware design is simple yet powerful. This post introduces several common middleware design patterns.

## Middleware Basics

In Vafast, define middleware with `defineMiddleware` and pass context downstream via `next({ ... })`:

```ts
import { defineMiddleware } from 'vafast'

const logger = defineMiddleware(async (req, next) => {
  console.log(`${req.method} ${req.url}`)
  return await next()
})
```

## Pattern 1: Auth Middleware

::: tip Production
To connect to a separate auth service, use [@vafast/auth-middleware](/en/middleware/auth-middleware) directly. Below is a factory pattern for a hand-written JWT middleware.
:::

```ts
import { defineMiddleware, json } from 'vafast'

interface AuthConfig {
  secret: string
  excludePaths?: string[]
}

const createAuthMiddleware = (config: AuthConfig) => {
  return defineMiddleware(async (req, next) => {
    const url = new URL(req.url)
    
    if (config.excludePaths?.includes(url.pathname)) {
      return await next()
    }
    
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return json({ error: 'No auth token provided' }, 401)
    }
    
    try {
      const payload = verifyJWT(token, config.secret)
      return await next({ userId: payload.userId, role: payload.role })
    } catch {
      return json({ error: 'Token is invalid or expired' }, 401)
    }
  })
}

// usage
const authMiddleware = createAuthMiddleware({
  secret: process.env.JWT_SECRET!,
  excludePaths: ['/login', '/register', '/health']
})
```

## Pattern 2: Role-Based Permission Middleware

Building on the auth middleware, we can implement role-based access control:

Building on the auth middleware, implement a role guard (checked after upstream injects it via `next({ role })`):

```ts
import { defineMiddleware, json } from 'vafast'

type Role = 'admin' | 'user' | 'guest'

const requireRole = (...roles: Role[]) => {
  return defineMiddleware<{ role: Role }>(async (req, next) => {
    const locals = (req as Request & { __locals?: { role?: Role } }).__locals
    const userRole = locals?.role
    if (!userRole || !roles.includes(userRole)) {
      return json({ error: 'Insufficient permissions' }, 403)
    }
    return next()
  })
}

// usage example
const routes = defineRoutes([
  defineRoute({
    method: 'DELETE',
    path: '/users/:id',
    middleware: [authMiddleware, requireRole('admin')],
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async ({ params, role }) => {
      await deleteUser(params.id)
      return { success: true, deletedBy: role }
    }
  })
])
```

In production, the `requireUser` and other guards from [@vafast/auth-middleware](/en/middleware/auth-middleware) are recommended, so you don't have to hand-write role checks.

## Pattern 3: Rate Limiting Middleware

Prevent API abuse with simple rate limiting:

```ts
import { defineMiddleware, json } from 'vafast'

interface RateLimitConfig {
  windowMs: number      // time window (ms)
  maxRequests: number   // max requests
}

const createRateLimiter = (config: RateLimitConfig) => {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return defineMiddleware(async (req, next) => {
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
        { error: 'Too many requests, please try again later' },
        429,
        {
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0'
        }
      )
    }
    
    const response = await next()
    
    // add rate limit info to the response headers
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(config.maxRequests - record.count))
    
    return response
  }
}

// usage
const rateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100       // at most 100 requests
})
```

## Pattern 4: Request Logging Middleware

Log request info and response times:

```ts
interface LogEntry {
  method: string
  path: string
  status: number
  duration: number
  timestamp: string
}

import { defineMiddleware } from 'vafast'

const requestLogger = defineMiddleware(async (req, next) => {
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
  
  // use different log levels based on the status code
  if (response.status >= 500) {
    console.error('[ERROR]', JSON.stringify(logEntry))
  } else if (response.status >= 400) {
    console.warn('[WARN]', JSON.stringify(logEntry))
  } else {
    console.log('[INFO]', JSON.stringify(logEntry))
  }
  
  // add a response time header
  response.headers.set('X-Response-Time', `${duration}ms`)
  
  return response
}
```

## Pattern 5: Error Handling

The framework **injects** `errorHandler` **automatically**. Throw `err.xxx()` for business errors in handlers; no hand-written try/catch middleware needed:

```ts
import { err } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => {
    const user = findUser(params.id)
    if (!user) throw err.notFound('User not found')
    return user
  },
})
// → { code: 404, message: 'User not found' }
```

::: tip Advanced scenarios
Only when you need to handle exceptions from third-party libraries that are **not VafastErrors** should you wrap a custom middleware around `server.use()` and `throw error` back to the framework.
:::

## Pattern 6: CORS Middleware

Handle cross-origin requests:

```ts
import { defineMiddleware } from 'vafast'

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
  
  return defineMiddleware(async (req, next) => {
    const origin = req.headers.get('Origin')
    
    // check whether the origin is allowed
    const allowedOrigin = origins.includes('*') 
      ? '*' 
      : origins.find(o => o === origin)
    
    // handle preflight requests
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
    
    // add CORS headers
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
      if (credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      }
    }
    
    return response
  }
}

// usage
const cors = createCors({
  origins: ['http://localhost:3000', 'https://example.com'],
  credentials: true
})
```

## Pattern 7: Response Caching Middleware

Simple caching for GET requests:

```ts
import { defineMiddleware } from 'vafast'

interface CacheConfig {
  ttl: number  // cache duration (seconds)
  keyFn?: (req: Request) => string
}

const createCache = (config: CacheConfig) => {
  const cache = new Map<string, { response: Response; expiry: number }>()
  
  const defaultKeyFn = (req: Request) => {
    const url = new URL(req.url)
    return `${req.method}:${url.pathname}${url.search}`
  }
  
  const keyFn = config.keyFn || defaultKeyFn
  
  return defineMiddleware(async (req, next) => {
    // only cache GET requests
    if (req.method !== 'GET') {
      return await next()
    }
    
    const key = keyFn(req)
    const now = Date.now()
    
    // check the cache
    const cached = cache.get(key)
    if (cached && cached.expiry > now) {
      const response = cached.response.clone()
      response.headers.set('X-Cache', 'HIT')
      return response
    }
    
    const response = await next()
    
    // only cache successful responses
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

// usage
const cacheMiddleware = createCache({ ttl: 60 })  // cache for 60 seconds
```

## Composing Middleware

Vafast supports composing middleware at both the route and global level:

```ts
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/public/data',
    middleware: [cacheMiddleware],  // only this route uses the cache
    handler: () => getData()
  }),
  defineRoute({
    method: 'POST',
    path: '/admin/action',
    middleware: [authMiddleware, requireRole('admin'), rateLimiter],
    handler: ({ body }) => doAction(body)
  })
])

const server = new Server(routes)

// global middleware (errorHandler is injected by the framework)
server.use(cors)
server.use(requestLogger)
```

## Best Practices Summary

1. **Single responsibility**: each middleware does one thing
2. **Configurable**: use factory functions + `defineMiddleware` to create configurable middleware
3. **Order matters**: auth/rate limiting go before the handler; `errorHandler` is injected by the framework
4. **Performance**: avoid expensive operations in middleware
5. **Type safety**: pass context with `defineMiddleware<TContext>` + `next({ ... })`

Vafast's middleware system is simple yet powerful; used well, middleware makes your code more modular and maintainable.

See more:
- [Vafast middleware docs](/en/middleware)
- [Vafast GitHub](https://github.com/vafast/vafast)

</Blog>
