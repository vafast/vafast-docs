---
title: 'Vafast Middleware System: Definition, Execution Order and Type-Safe Context'
description: 'A detailed look at the Vafast middleware system: defining middleware with defineMiddleware, execution order, composition, global middleware and withContext type injection for cross-cutting concerns like auth, logging and error handling.'
---

# Vafast Middleware System

The middleware system is one of Vafast's core features. It lets you run custom logic during request handling. Middleware can be used for authentication, logging, error handling, data transformation and more.

## What Is Middleware?

Middleware is a function that runs before or after a request reaches the route handler. Middleware can:

- Modify the request object
- Validate request data
- Log request information
- Handle errors
- Add response headers
- Run any custom logic

## Defining Middleware

### Basic Middleware

Vafast recommends defining middleware with `defineMiddleware`, which provides better type support:

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

### Middleware Type

```typescript
// Define with defineMiddleware (recommended)
import { defineMiddleware } from 'vafast'
const middleware = defineMiddleware(async (req, next) => {
  return await next()
})

// Or use the function type directly
type Middleware = (req: Request, next: () => Promise<Response>) => Promise<Response>
```

## Middleware Execution Order

Middleware runs in array order, forming an execution chain:

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

Execution order:
1. `authMiddleware` - authentication
2. `logMiddleware` - logging
3. `rateLimitMiddleware` - rate limiting
4. Route handler - the actual business logic

## Common Middleware Examples

### 1. Logging Middleware

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

### 2. Authentication Middleware

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
    // verify the token
    const user = await validateToken(token)
    
    // pass user info via next
    return await next({ user })
  } catch (error) {
    return json({ error: 'Invalid token' }, 401)
  }
})

// Usage example
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

### 3. CORS Middleware

```typescript
import { defineMiddleware } from 'vafast'

const corsMiddleware = defineMiddleware(async (req, next) => {
  const response = await next()
  
  // add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
})
```

> 💡 **Tip**: Vafast provides an official CORS middleware, `@vafast/cors`. Prefer it over a hand-rolled implementation.

### 4. Rate Limiting Middleware

```typescript
import { defineMiddleware, json } from 'vafast'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const rateLimitMiddleware = defineMiddleware(async (req, next) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
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

> 💡 **Tip**: Vafast provides an official rate limiting middleware, `@vafast/rate-limit`. Prefer it over a hand-rolled implementation.

### 5. Error Handling

The framework **injects** `errorHandler` **automatically**, so you don't need to write an error-catching middleware. Just `throw err.xxx()` in the handler:

```typescript
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
// automatically returns { code: 404, message: 'User not found' }
```

Common helpers: `err.badRequest()` `err.unauthorized()` `err.forbidden()` `err.notFound()` `err.conflict()` `err.internal()`

### 6. Validation Middleware

::: tip Recommended
Vafast's `defineRoute` has built-in schema validation, so there's no need to write validation middleware by hand.
:::

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

// Use defineRoute's built-in validation (recommended)
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

## Composing Middleware

### Creating a Middleware Composer

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

// Usage example
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

### Conditional Middleware

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

// Usage example
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

## Global Middleware

Vafast supports two ways to apply global middleware:

### Option 1: Use server.use()

Apply global middleware to the whole application:

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

// apply global middleware
server.use(logMiddleware)
server.use(corsMiddleware)

export default { fetch: server.fetch }
```

### Option 2: Apply in Nested Routes

Apply middleware to a specific path prefix:

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [logMiddleware, corsMiddleware], // applies to all /api routes
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

## Parent Middleware Type Injection (withContext)

When middleware is defined on a parent route, child routes need `withContext` to get type inference. This is the core mechanism for building custom route definers.

### The Problem

In nested routes, the context types injected by parent middleware are lost in child routes:

```typescript
// ❌ types are lost
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [authMiddleware],  // injects userInfo
    children: [
      defineRoute({
        method: 'GET',
        path: '/profile',
        handler: ({ userInfo }) => {
          // ❌ userInfo is typed as unknown
          return { id: userInfo.id }
        }
      })
    ]
  })
])
```

### The Solution: withContext

Use `withContext` to create a custom route definer so child routes automatically get the types injected by parent middleware:

```typescript
import { defineRoute, defineRoutes, withContext, defineMiddleware } from 'vafast'

// Define the context type
type AuthContext = { userInfo: { id: string; role: string } }

// Create the auth middleware
const authMiddleware = defineMiddleware<AuthContext>(async (req, next) => {
  const userInfo = await verifyToken(req)
  return next({ userInfo })
})

// Create a custom route definer with withContext
const defineAuthRoute = withContext<AuthContext>()

const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [authMiddleware],  // parent middleware injects userInfo
    children: [
      defineAuthRoute({  // ← use the custom route definer
        method: 'GET',
        path: '/profile',
        handler: ({ userInfo }) => {
          // ✅ userInfo is typed automatically!
          return { id: userInfo.id, role: userInfo.role }
        }
      })
    ]
  })
])
```

### Production Auth (Optional)

When integrating with a separate auth service, use the built-in `defineAuthRouteWithApp`, `authWithApp`, `requireUser` and friends from [@vafast/auth-middleware](/en/middleware/auth-middleware) instead of writing `withContext` by hand. On this page, focus on `defineMiddleware` + `next({ ... })` first.

### Custom withContext (Advanced)

If you need your own auth logic (without a separate auth service), you can wrap it manually:

`withContext` has the following characteristics:

1. **Zero runtime overhead**: `withContext` is a type-level wrapper only; after compilation it is identical to a plain `defineRoute` and doesn't affect runtime performance
2. **Automatic type merging**: when a route uses several middleware, their context types are merged automatically
3. **Nesting support**: you can use different `withContext` definers at different route levels, and types flow through correctly
4. **Native TypeScript**: built entirely on TypeScript's type system, with no extra runtime type checks

### Why Can't It Be Inferred Automatically?

This is a TypeScript limitation. TypeScript can only infer generic types within **a single function call**; it can't carry type information across function calls.

In nested routes:
- `defineRoute({ path: '/api', middleware: [authMiddleware], children: [...] })` is one function call
- each `defineRoute({ ... })` inside `children` is a separate, independent function call
- TypeScript can't see the `middleware` type of the first call while checking the second

`withContext` solves this by presetting the context type, so child routes "remember" the types injected by parent middleware.

### Benefits

1. **Type safety**: child routes automatically get the context types injected by parent middleware
2. **Code reuse**: wrap once, use everywhere
3. **Clarity**: the name tells you what context a route needs
4. **Maintainability**: context types are managed in one place, so changes only need one update
5. **Zero runtime overhead**: a purely type-level implementation that doesn't affect performance

> 📖 For more details, see [Routing Guide - Custom Route Definers](/en/routing#5-custom-route-definers-withcontext)

## Middleware Best Practices

### 1. Keep Middleware Simple

```typescript
import { defineMiddleware, json } from 'vafast'

// Good: each middleware does one thing
const logRequest = defineMiddleware(async (req, next) => {
  console.log(`${req.method} ${req.url}`)
  return next()
})

const logResponse = defineMiddleware(async (req, next) => {
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
})

// Bad: one middleware doing too much
const logEverything = defineMiddleware(async (req, next) => {
  // log the request
  console.log(`${req.method} ${req.url}`)
  
  // verify the token
  const token = req.headers.get('authorization')
  if (!token) return json({ error: 'Unauthorized' }, 401)
  
  // log the response
  const response = await next()
  console.log(`Response: ${response.status}`)
  
  return response
})
```

### 2. Error Handling

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

// use the safe middleware
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    middleware: [safeMiddleware(authMiddleware)],
    handler: () => ({ message: 'Users' })
  })
])
```

### 3. Middleware Order

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    middleware: [
      logMiddleware,        // 1. logging
      corsMiddleware,       // 2. CORS
      rateLimitMiddleware,  // 3. rate limiting
      authMiddleware,       // 4. authentication
      // errorHandler is injected by the framework; no need to register it
    ],
    handler: () => ({ message: 'Users' })
  })
])
```

### 4. Testing Middleware

```typescript
// test the middleware
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

// test example
const testReq = new Request('http://localhost:3000/test')
const testResult = await testMiddleware(logMiddleware, testReq)
console.log('Test result:', testResult)
```

## Summary

Vafast's middleware system provides:

- ✅ Flexible middleware definitions
- ✅ Predictable execution order
- ✅ Powerful error handling
- ✅ Middleware composition and reuse
- ✅ Global and local application
- ✅ A type-safe implementation

### Next Steps

- Read the [Routing Guide](/en/routing) to learn about the routing system
- Learn [Component Routing](/en/component-routing) for declarative routing
- Explore [Best Practices](/en/essential/best-practice) for more development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).
