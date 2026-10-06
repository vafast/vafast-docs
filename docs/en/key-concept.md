---
title: 'Vafast Key Concepts: Server, Declarative Routing, Middleware and Types'
description: 'A deep dive into the core concepts of Vafast: the Server class, leaf routes and route groups, the routing system, the middleware system, the type system and SSE streaming, to help you understand the architecture of this TypeScript web framework.'
---

# Vafast Key Concepts

Vafast is a high-performance TypeScript web framework that runs on Node.js, Bun and other runtimes. Understanding these core concepts will help you build applications with Vafast more effectively.

## Architecture Overview

Vafast uses a modular architecture made up of the following core components:

- **Server**: the main server class, handling requests and responses
- **Router**: the route matching and dispatch system
- **Middleware**: the middleware system for extending functionality
- **Types**: a complete type definition system
- **Utils**: utility functions and helpers

## The Server Class

The `Server` class is the heart of Vafast. It extends `BaseServer` and provides a complete HTTP server.

### Key Features

- **Radix tree routing**: efficient path matching in O(k) time
- **Nested routes**: `defineRoute` + `children` are flattened automatically, with middleware inherited
- **Middleware support**: global `server.use()` and route-level middleware, executed in an onion model
- **Type injection**: `defineMiddleware` / `withContext` support middleware context type inference
- **SSE streaming**: declarative streaming endpoints with `sse: true` + `async function*`
- **Error handling**: built-in `errorHandler` + structured errors via `VafastError` / `err()`

### Basic Usage

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

## Route Types: Leaf vs. Route Group

`defineRoute` comes in two shapes, and backend code must keep them apart:

| Type | Required fields | Description |
|------|---------|------|
| **Leaf route** | `method` + `path` + `handler` | An actual API endpoint |
| **Route group** | `path` + `children` | Path prefix and shared middleware, **no method and no handler** |

```typescript
// Route group (no method)
defineRoute({
  path: '/api/users',
  middleware: [authMiddleware],
  children: [
    // Leaf route (has method)
    defineRoute({ method: 'GET', path: '/list', handler: () => [...] }),
  ]
})
```

Recommended: define handlers as constants first, then put them into `children`. See [Tutorial · Route Groups](/en/tutorial#step-4-organize-paths-with-route-groups) and the [Routing Guide](/en/routing).

## Routing System

Vafast's routing system is based on configuration objects and supports static paths, dynamic parameters and nested routes.

### Route Configuration

```typescript
// Define routes with defineRoute
defineRoute({
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
  path: string,
  handler: (ctx: HandlerContext) => Response | Promise<Response>,
  middleware?: Middleware[],
  schema?: {
    body?: TSchema,
    query?: TSchema,
    params?: TSchema,
    headers?: TSchema,
    cookies?: TSchema
  },
  name?: string,
  description?: string
})
```

### Path Matching

Vafast uses a smart path matching algorithm that supports:

- **Static paths**: `/users`
- **Dynamic parameters**: `/users/:id`
- **Nested routes**: parent/child route structures

### Route Priority

Routes are automatically sorted by specificity:
1. Static paths (highest priority)
2. Dynamic parameters (`:param`)
3. Wildcards (`*`)

## Middleware System

Middleware is the core mechanism for extending Vafast, supporting both global and route-level middleware.

### Middleware Type

```typescript
type Middleware = (
  req: Request,
  next: (ctx?: unknown) => Promise<Response>
) => Response | Promise<Response>
```

### Middleware Chain

Middleware runs in an onion model, and `errorHandler` is injected automatically by the framework:

1. Global middleware (`server.use()`)
2. `errorHandler` (catches exceptions from the rest of the chain)
3. Route-level middleware (including middleware inherited from nested routes)
4. Route handler

### defineMiddleware and Type Injection

```typescript
import { defineMiddleware, json } from 'vafast'

const authMiddleware = defineMiddleware<{ user: { id: string } }>((req, next) => {
  const user = getUserFromToken(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)
  return next({ user }) // inject context downstream via next
})
```

Context injected by parent middleware is automatically inferred in child route handlers. For reuse across files, use `withContext<T>()` to preset the context type.

### Middleware Examples

```typescript
import { Server, defineRoute, defineRoutes, defineMiddleware, json } from 'vafast'

// Logging middleware
const loggingMiddleware = defineMiddleware(async (req, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
})

// Auth middleware
const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return await next()
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/protected',
    handler: () => 'Protected content',
    middleware: [authMiddleware]
  })
])

const server = new Server(routes)
server.use(loggingMiddleware) // global middleware
```

## Type System

Vafast provides full TypeScript support, including type-safe handlers and validators.

### Handler Types

```typescript
type Handler = (context: HandlerContext) => Response | Promise<Response> | unknown

interface HandlerContext<TSchema extends RouteSchema = RouteSchema> {
  req: Request
  body: InferSchemaType<TSchema>['body']
  query: InferSchemaType<TSchema>['query']
  params: InferSchemaType<TSchema>['params']
  headers: InferSchemaType<TSchema>['headers']
  cookies: InferSchemaType<TSchema>['cookies']
  // + extra fields injected by middleware via defineMiddleware
}
```

Handler return values are automatically converted to a `Response` (object → JSON, string → text, null → 204).

### Schema Validation

Vafast integrates TypeBox for runtime type validation:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ pattern: '^[^@]+@[^@]+\\.[^@]+$' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => {
      // body has been validated and is type-safe
      return { success: true, user: body }
    }
  })
])
```

## Route Definition System

The `defineRoute` function defines type-safe routes and handles parameter destructuring and type inference automatically.

### Basic Usage

```typescript
import { defineRoute } from 'vafast'

// Simple route
const simpleRoute = defineRoute({
  method: 'GET',
  path: '/',
  handler: () => 'Hello'
})

// Route with path parameters
const paramRoute = defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => `ID: ${params.id}`
})

// Route with schema validation
const validatedRoute = defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: Type.Object({ name: Type.String() }) },
  handler: ({ body }) => {
    // body has been validated and is type-safe
    return { received: body }
  }
})
```

### Advanced Usage

```typescript
// Route with multiple validations
const fullRoute = defineRoute({
  method: 'POST',
  path: '/users/:id',
  schema: {
    body: userSchema,
    query: querySchema,
    params: paramsSchema
  },
  handler: ({ params, body, query, headers }) => {
    return {
      params,
      body,
      query,
      headers
    }
  }
})
```

## SSE Streaming

Declare an SSE endpoint with `sse: true`; the handler is an `async function*` that simply `yield`s data:

```typescript
import { defineRoute, sse } from 'vafast'

defineRoute({
  method: 'POST',
  path: '/chat/stream',
  sse: true,
  handler: async function* ({ body }) {
    yield { delta: 'Hello' }
    yield sse({ event: 'done' }, { finished: true })
  }
})
```

## Request Lifecycle

1. **Receive request**: an HTTP request arrives
2. **Route matching**: the radix tree matches by path and method
3. **Middleware execution**: global → errorHandler → route middleware
4. **Parsing and validation**: parse body/query/params and run TypeBox schema validation
5. **Handler execution**: run the handler and convert the return value automatically
6. **Response**: return the HTTP response (SSE endpoints return `text/event-stream`)

## Performance Optimizations

Vafast ships with several built-in performance optimizations, so you get high performance with no extra configuration:

### JIT-Compiled Validators

Schema validators are compiled and cached on first use; subsequent validations run the compiled code directly:

```typescript
import { createValidator, validateFast, precompileSchemas } from 'vafast'
import { Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String(),
  age: Type.Number()
})

// Option 1: automatic caching (recommended)
const isValid = validateFast(UserSchema, data)

// Option 2: precompiled validator (maximum performance)
const validateUser = createValidator(UserSchema)
const result = validateUser(data)

// Precompile at startup (avoids first-request overhead)
precompileSchemas([UserSchema, PostSchema])
```

**Result: 10,000 validations take only ~5ms**

### Fast Request Parsing

Optimized parsing functions, about 2x faster than the standard approach:

```typescript
import { parseQueryFast, getCookie, getHeader } from 'vafast'

// Fast query parsing (simple cases)
const query = parseQueryFast(req)

// Read a single cookie (without parsing them all)
const sessionId = getCookie(req, 'sessionId')

// Read a single request header
const token = getHeader(req, 'Authorization')
```

### Radix Tree Routing

Efficient radix-tree-based route matching in O(k) time (k = number of path segments):

- **Pre-sorted routes**: sorted by specificity at construction time (static > dynamic params > wildcard)
- **Conflict detection**: route conflicts are detected and warned about automatically
- **Nested flattening**: `defineRoutes()` merges paths and middleware automatically

## Next Steps

1. Haven't built the notes API yet? Start with the [Tutorial](/en/tutorial)
2. [Routing Guide](/en/routing) — nesting, matching and type wrappers
3. [Middleware System](/en/middleware) — `defineMiddleware` and the three attachment levels
4. [Best Practices](/en/essential/best-practice) — directory and startup conventions

For multi-tenant setups with a separate auth service, see [Auth Middleware](/en/middleware/auth-middleware).