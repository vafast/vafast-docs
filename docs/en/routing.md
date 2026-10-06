---
title: 'Vafast Routing Guide: Declarative, Dynamic and Nested Routes'
description: 'Vafast routing guide: leaf routes and route groups, basic routes, matching rules, dynamic route parameters, nested routes, route middleware and response handling for building type-safe TypeScript APIs.'
---

# Vafast Routing Guide

Routing is the core of Vafast, giving you a powerful and flexible way to define API endpoints. This guide covers Vafast's routing features in detail.

## Route Type Definitions

### Leaf Routes vs. Route Groups

```typescript
// Leaf route: has method + handler
defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => ({ id: params.id }),
})

// Route group: no method, only path + children (can carry middleware)
defineRoute({
  path: '/api',
  middleware: [authMiddleware],
  children: [
    defineRoute({ method: 'GET', path: '/users', handler: () => [...] }),
  ],
})
```

`defineRoutes()` automatically flattens nested paths and merges middleware.

### ProcessedRoute

`defineRoutes()` returns flattened route objects (aliased as `Route`):

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
  [key: string]: unknown  // extensions such as webhook, permission
}
```

### Handler Type

```typescript
// handler receives a context object; its return value is converted to a Response automatically
type Handler = (ctx: HandlerContext) => unknown | Promise<unknown>

interface HandlerContext {
  req: Request
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
  headers: Record<string, string>
  cookies: Record<string, string>
  // + fields injected by middleware via defineMiddleware / next({ ... })
}
```

### Middleware Type

```typescript
type Middleware = (
  req: Request,
  next: (ctx?: unknown) => Promise<Response>
) => Response | Promise<Response>
```

See below for the middleware signature; for custom auth, use `defineMiddleware` + `next({ ... })`. For multi-tenant setups with a separate auth service, see [Auth Middleware](/en/middleware/auth-middleware).

## Basic Routes

Routes are the basic building blocks of a Vafast application. Each route defines an HTTP method, a path and a handler.

### Defining Routes

Use `defineRoutes()` to define an array of routes with full type inference:

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

::: tip Type inference
`defineRoutes()` uses a `const T` generic to preserve literal types such as `'GET'` and `'/users'`, enabling end-to-end type inference.
:::

### Supported HTTP Methods

| Method | Description |
|------|------|
| `GET` | Retrieve a resource |
| `POST` | Create a resource |
| `PUT` | Fully update a resource |
| `DELETE` | Delete a resource |
| `PATCH` | Partially update a resource |
| `OPTIONS` | CORS preflight request |
| `HEAD` | Retrieve headers only |

```typescript
const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: () => ({ users: [] }) }),
  defineRoute({ method: 'POST', path: '/users', handler: ({ body }) => body }),
  defineRoute({ method: 'PUT', path: '/users/:id', handler: ({ params }) => params }),
  defineRoute({ method: 'DELETE', path: '/users/:id', handler: () => null }),  // returns 204
  defineRoute({ method: 'PATCH', path: '/users/:id', handler: ({ params, body }) => ({ ...body }) })
])
```

## Route Matching Rules

Vafast uses a radix tree for efficient route matching (O(k) time, where k is the number of path segments).

### Route Types

| Type | Syntax | Example | Description |
|------|------|------|------|
| Static route | `/path` | `/users`, `/api/v1/health` | Exact match |
| Dynamic param | `/:param` | `/users/:id` | Matches a single path segment, `params.id` |
| Wildcard | `/*` or `/*name` | `/files/*`, `/static/*filepath` | Matches the rest of the path |

### Priority Rules

```
Static routes > dynamic params > wildcards
```

**Registration order does not affect priority**:

```typescript
const routes = defineRoutes([
  // registered out of order
  defineRoute({ method: 'GET', path: '/api/*', handler: wildcardHandler }),
  defineRoute({ method: 'GET', path: '/api/health', handler: staticHandler }),
  defineRoute({ method: 'GET', path: '/api/:id', handler: dynamicHandler }),
])

// GET /api/health      → staticHandler   ✅ static first
// GET /api/123         → dynamicHandler  ✅ dynamic second
// GET /api/users/list  → wildcardHandler ✅ wildcard last
```

### Different Param Names at the Same Position

Different routes can use different parameter names at the same position; each route returns the parameter names it defined:

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
A warning is logged when parameter names conflict (keeping them consistent is recommended), but functionality is unaffected.
:::

## Dynamic Routes

Vafast supports dynamic route parameters, letting you capture variable values from the URL.

### Basic Parameters

```typescript
defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => ({
    userId: params.id
  })
})
```

### Multiple Parameters

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

### Wildcard Routes

The wildcard `*` matches the rest of the path:

```typescript
const routes = defineRoutes([
  // anonymous wildcard
  defineRoute({
    method: 'GET',
    path: '/files/*',
    handler: ({ params }) => ({
      path: params['*']  // 'path/to/file.txt'
    })
  }),
  
  // named wildcard
  defineRoute({
    method: 'GET',
    path: '/static/*filepath',
    handler: ({ params }) => ({
      filepath: params.filepath  // 'assets/css/style.css'
    })
  }),
  
  // dynamic param + wildcard combined
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

### Optional Parameters

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

## Nested Routes

Vafast supports nested route structures, letting you organize complex route hierarchies.

### Basic Nesting

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

### Deep Nesting

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

## Middleware

Middleware is a powerful feature of Vafast routing that lets you run custom logic before and after request handling.

### Defining Middleware

```typescript
import { defineMiddleware, json } from 'vafast'

const authMiddleware = defineMiddleware(async (req, next) => {
  const auth = req.headers.get('authorization')
  if (!auth) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return next()
})

const logMiddleware = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const response = await next()
  const duration = Date.now() - start
  console.log(`${req.method} ${req.url} - ${duration}ms`)
  return response
})
```

### Applying Middleware

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

### Global Middleware

```typescript
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [logMiddleware], // applied to all child routes
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

## Route Handlers

The handler is the heart of a route: it processes the request and returns a response. A handler is just a function; the framework takes care of context destructuring and response conversion.

### Basic Handler

```typescript
defineRoute({
  method: 'GET',
  path: '/hello',
  handler: () => 'Hello World'
})
```

### Async Handler

```typescript
defineRoute({
  method: 'POST',
  path: '/users',
  handler: async ({ body }) => {
    // body has already been parsed
    const user = await createUser(body)
    return user
  }
})
```

### Accessing the Request Context

Handlers get the full request context automatically:

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

## Response Handling

Vafast **automatically converts return values** into a Response, so you can return data directly:

### Automatic Response Conversion

```typescript
// string → text/plain
handler: () => 'Hello World'

// object/array → application/json
handler: () => ({ message: 'Success' })

// number/boolean → text/plain
handler: () => 42

// null/undefined → 204 No Content
handler: () => null
```

### Custom Status Codes and Headers

Use the `{ data, status, headers }` format to control response details:

```typescript
handler: () => ({
  data: { user: { id: 1, name: 'John' } },
  status: 201,
  headers: { 'X-Custom-Header': 'value' }
})
```

### Redirects

```typescript
import { redirect } from 'vafast'

handler: () => redirect('/new-page')
```

### Manual Response (Not Recommended)

If you need full control, you can still return a Response object:

```typescript
handler: () => new Response('Custom', {
  status: 200,
  headers: { 'Content-Type': 'text/custom' }
})
```

## Error Handling

Vafast has built-in automatic error handling: errors thrown in handlers are caught and turned into formatted responses.

### Throwing Errors

```typescript
handler: () => {
  throw new Error('Something went wrong')
}
// automatically returns a 500 error response
```

### Returning Error Statuses with VafastError

```typescript
import { err } from 'vafast'

handler: () => {
  throw err.notFound('Resource not found')
}
```

## Best Practices

### 1. Route Organization

```typescript
// Organize routes by feature
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

### 2. Middleware Reuse

```typescript
const commonMiddleware = [logMiddleware, corsMiddleware]

const routes = [
  {
    path: '/api',
    middleware: commonMiddleware,
    children: [
      // commonMiddleware applies to all child routes
    ]
  }
]
```

### 3. Type Safety (Using Schema)

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
      // params are inferred automatically
      postId: params.id,
      category: params.category ?? 'default'
    })
  })
])
```

### 4. End-to-End Type Inference (for the API Client)

`defineRoutes()` preserves literal types automatically; combined with `vafast-api-client` it gives you end-to-end type safety:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

// Define and handle routes
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

// ✅ Type inference just works, no `as const` needed!
type Api = InferEden<typeof routes>
```

### 5. Custom Route Definers (withContext)

When middleware is defined on the parent, you can use `withContext` to create a custom route definer so that child routes get type inference automatically.

#### Basic Usage

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

#### Production Auth (Optional)

For multi-tenant services backed by a separate auth service, you can use wrappers such as `defineAuthRouteWithApp` from [@vafast/auth-middleware](/en/middleware/auth-middleware) instead of writing `withContext` by hand. While learning, mastering `defineMiddleware` above is enough.

#### Custom withContext (Advanced)

When building your own auth, you can wrap it manually:

```typescript
import { withContext } from 'vafast'

export const defineAuthRoute = withContext<{ userInfo: UserInfo }>()
export const defineAuthRouteWithApp = withContext<{ userInfo: UserInfo; app: AppInfo }>()
export const defineRouteWithApp = withContext<{ app: AppInfo }>()
```

Route definers at a glance:

- **`defineAuthRoute`**: needs `userInfo` only
- **`defineAuthRouteWithApp`**: needs `userInfo` + `app` (most common)
- **`defineRouteWithApp`**: needs `app` only
- **`defineOptionalAuthRoute`**: optional `userInfo`

#### Characteristics

`withContext` has the following characteristics:

1. **Zero runtime overhead**: `withContext` is a type-level wrapper only; after compilation it is identical to a plain `defineRoute` and doesn't affect runtime performance
2. **Automatic type merging**: when a route uses several middleware, their context types are merged automatically
3. **Nesting support**: you can use different `withContext` definers at different route levels, and types flow through correctly
4. **Native TypeScript**: built entirely on TypeScript's type system, with no extra runtime type checks

#### Why Can't It Be Inferred Automatically?

This is a TypeScript limitation. TypeScript can only infer generic types within **a single function call**; it can't carry type information across function calls.

In nested routes:
- `defineRoute({ path: '/api', middleware: [authMiddleware], children: [...] })` is one function call
- each `defineRoute({ ... })` inside `children` is a separate, independent function call
- TypeScript can't see the `middleware` type of the first call while checking the second

`withContext` solves this by presetting the context type, so child routes "remember" the types injected by parent middleware.

#### Benefits

1. **Type safety**: child routes automatically get the context types injected by parent middleware
2. **Code reuse**: wrap once, use everywhere
3. **Clarity**: the name tells you what context a route needs
4. **Maintainability**: context types are managed in one place, so changes only need one update
5. **Zero runtime overhead**: a purely type-level implementation that doesn't affect performance

> 📖 For more details, see [Middleware Guide - Parent Middleware Type Injection](/en/middleware#parent-middleware-type-injection-withcontext)

## Route Types Summary

| Type/Function | Description | Use |
|-----------|------|------|
| Leaf route | `method` + `path` + `handler` | An actual API endpoint |
| Route group | `path` + `children` (no method) | Path prefix, shared middleware |
| `ProcessedRoute` / `Route` | Flattened route object | Used internally by `Server` |
| `defineRoutes()` | Creates and flattens the route array | Type inference + nested merging |

## Extension Fields — Declarative Metadata

Vafast's declarative routes support **arbitrary extension fields**, making the route definition the single source of truth for business logic. You can add custom fields directly to a route definition for webhooks, permissions, billing, auditing and more.

### Basic Usage

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/auth/signIn',
    name: 'User login',
    description: 'User logs in with email and password',
    handler: signInHandler,
    // ✨ Extension field: webhook event
    webhook: { eventKey: 'auth.signIn', enabled: true },
    // ✨ Extension field: required permission
    permission: 'auth.signIn',
    // ✨ Extension field: billing config
    billing: { price: 0, currency: 'USD' }, // free
  }),
  defineRoute({
    method: 'POST',
    path: '/ai/generate',
    name: 'AI generation',
    description: 'Generate AI content',
    handler: generateAIHandler,
    // ✨ Extension field: per-request billing
    billing: { price: 0.01, currency: 'USD', unit: 'request' },
    permission: 'ai.generate',
  }),
  defineRoute({
    method: 'POST',
    path: '/ai/chat',
    name: 'AI chat',
    handler: chatAIHandler,
    // ✨ Extension field: per-token billing
    billing: { price: 0.0001, currency: 'USD', unit: 'token' },
    permission: 'ai.chat',
  }),
])
```

### Using Extension Fields in Middleware

Middleware can read route metadata through `RouteRegistry`:

```typescript
import { defineMiddleware, getRouteRegistry } from 'vafast'

// Billing middleware: bills automatically based on route metadata
const billingMiddleware = defineMiddleware(async (req, next) => {
  const registry = getRouteRegistry()
  const url = new URL(req.url)
  const route = registry.get(req.method, url.pathname)
  
  if (route?.billing) {
    const { price, currency, unit } = route.billing
    const userId = getUserId(req)
    
    // run billing logic
    await chargeUser(userId, {
      api: `${req.method} ${url.pathname}`,
      price,
      currency,
      unit,
    })
  }
  
  return next()
})

// Permission middleware: checks permissions based on route metadata
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

## Route Registry (RouteRegistry)

`RouteRegistry` collects and queries route metadata, which is useful for API doc generation, webhook event registration, permission checks, per-API billing and more.

### Basic Usage

```typescript
import { Server, defineRoute, defineRoutes, getRouteRegistry } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/auth/signIn',
    name: 'User login',
    description: 'User logs in with email and password',
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

// The global registry is set up automatically when the Server is created; just use it
const registry = getRouteRegistry()

// Query route metadata
const route = registry.get('POST', '/auth/signIn')
console.log(route?.name)        // 'User login'
console.log(route?.webhook)     // { eventKey: 'auth.signIn' }
console.log(route?.permission)  // 'auth.signIn'
```

### Filtering Routes

```typescript
// Filter routes that have a specific field
const webhookRoutes = registry.filter('webhook')      // all webhook events
const paidRoutes = registry.filter('billing')         // all paid APIs
const aiRoutes = registry.filterBy(r => r.permission?.startsWith('ai.')) // AI-related APIs

// Get by category
const authRoutes = registry.getByCategory('auth')
const aiCategoryRoutes = registry.getByCategory('ai')

// Get all categories
const categories = registry.getCategories()  // ['auth', 'users']
```

### Helper Functions

```typescript
import {
  getRouteRegistry,  // get the global registry instance
  getRoute,          // quickly look up a single route
  getAllRoutes,      // get all routes
  filterRoutes,      // filter by field
  getRoutesByMethod, // get routes by HTTP method
} from 'vafast'

// Option 1: use the global registry instance
const registry = getRouteRegistry()
const route = registry.get('POST', '/users')

// Option 2: use helper functions (recommended, more concise)
const route = getRoute('POST', '/users')
const allRoutes = getAllRoutes()
const webhookRoutes = filterRoutes('webhook')
const getRoutes = getRoutesByMethod('GET')
const postRoutes = getRoutesByMethod('POST')
```

### Benefits of Extension Fields

1. **Single source of truth**: the route definition holds all metadata, no extra config files
2. **Type safety**: extension fields are fully typed in TypeScript
3. **Runtime queries**: query and filter dynamically via the `RouteRegistry` API
4. **Business integration**: middleware can read route metadata directly for billing, permissions, auditing and more
5. **API-gateway friendly**: declarative configuration fits gateway scenarios perfectly

## Feature Summary

Vafast's routing system provides:

- ✅ **Radix tree routing** - efficient route matching in O(k) time
- ✅ **Priority rules** - static > dynamic > wildcard, consistent with Hono/Fastify
- ✅ **Different param names at the same position** - different methods can use different param names in CRUD scenarios
- ✅ **defineRoutes()** - preserves literal types automatically for end-to-end type inference
- ✅ **defineRoute()** - the recommended way to define handlers, with a unified context and type safety
- ✅ **Automatic response conversion** - return data directly, no need to build a Response by hand
- ✅ **Full HTTP method support** - GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- ✅ **Dynamic route params** - `:id` required, `:id?` optional
- ✅ **Wildcard routes** - `*` or `*name` matches the rest of the path
- ✅ **Nested route structure** - children can be nested to any depth
- ✅ **Flexible middleware system** - route-level and group-level middleware
- ✅ **Schema validation and type inference** - runtime validation with TypeBox
- ✅ **End-to-end type safety** - API type inference with vafast-api-client
- ✅ **Extension fields** - arbitrary custom fields for webhooks, permissions, billing and more
- ✅ **RouteRegistry** - API for querying and filtering route metadata

### Next Steps

- Read [Middleware System](/en/middleware) for more advanced middleware usage
- Learn [Component Routing](/en/component-routing) for declarative routing
- Explore [Best Practices](/en/essential/best-practice) for more development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).
