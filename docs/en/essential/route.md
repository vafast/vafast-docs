---
title: Route - Vafast
description: 'Vafast routing basics: static, dynamic and wildcard paths, HTTP methods, route priority, nested route groups and declarative route arrays with defineRoutes.'
---

# Route

A web server uses the request's **path and HTTP method** to find the right resource. This is called **"routing"**.

In Vafast, routes are defined with route configuration objects that include the HTTP method, the path and the handler.

## Basic Routing

### Defining Routes (Object Literals)

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

### HTTP Methods

Vafast supports all standard HTTP methods:

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: () => 'Get users' }),
  defineRoute({ method: 'POST', path: '/users', handler: () => 'Create user' }),
  defineRoute({ method: 'PUT', path: '/users/:id', handler: () => 'Update user' }),
  defineRoute({ method: 'DELETE', path: '/users/:id', handler: () => 'Delete user' }),
  defineRoute({ method: 'PATCH', path: '/users/:id', handler: () => 'Patch user' })
])
```

### Path Parameters

Path parameters let you capture dynamic values from the URL:

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => {
      return `User ID: ${params.id}`
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/posts/:postId/comments/:commentId',
    handler: ({ params }) => {
      return `Post: ${params.postId}, Comment: ${params.commentId}`
    }
  })
])
```

### Query Parameters

Query parameters are accessed through the `query` object:

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/search',
    handler: ({ query }) => {
      const { q, page = '1', limit = '10' } = query
      return `Search: ${q}, Page: ${page}, Limit: ${limit}`
    }
  })
])
```

### Request Body

The request body of POST, PUT and PATCH requests is accessed through the `body` object:

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }) => {
      return `Created user: ${body.name}`
    }
  })
])
```

## Route Matching Rules

Vafast uses a radix tree for efficient route matching (O(k) time, where k is the number of path segments).

### Route Types

```typescript
// static routes
'/users'
'/api/v1/health'

// dynamic params (:param)
'/users/:id'
'/posts/:postId/comments/:commentId'

// wildcards (* or *name)
'/files/*'           // anonymous wildcard, params['*']
'/static/*filepath'  // named wildcard, params['filepath']
```

### Priority Rules

```
Static routes > dynamic params > wildcards
```

Registration order does not affect priority:

```typescript
const routes = defineRoutes([
  // even if the dynamic route is registered first
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => `User ${params.id}`
  }),
  // the static route still matches first
  defineRoute({
    method: 'GET',
    path: '/users/admin',
    handler: () => 'Admin user'
  })
])

// GET /users/admin → 'Admin user' ✅ static wins
// GET /users/123   → 'User 123'
```

### Different Param Names at the Same Position

Different routes can use different parameter names at the same position; each route returns the parameter names it defined:

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'PUT',
    path: '/sessions/:id',
    handler: ({ params }) => params  // { id: '123' }
  }),
  defineRoute({
    method: 'GET',
    path: '/sessions/:sessionId/messages',
    handler: ({ params }) => params  // { sessionId: '456' }
  })
])

// PUT /sessions/123           → params = { id: '123' }
// GET /sessions/456/messages  → params = { sessionId: '456' }
```

::: tip
A warning is logged when parameter names conflict (keeping them consistent is recommended), but functionality is unaffected.
:::

## Nested Routes

Vafast supports nested routes with two kinds of nodes:

### Route Group (No `method`)

Only provides a path prefix and shared middleware; **no handler**:

```typescript
import { defineMiddleware, defineRoute } from 'vafast'

const logMiddleware = defineMiddleware(async (req, next) => {
  console.log(req.method, req.url)
  return next()
})

defineRoute({
  path: '/files',
  name: 'Files',
  middleware: [logMiddleware],
  children: [ /* leaf routes */ ],
})
```

### Leaf Route (Has `method`)

Actually handles the request; use a **relative path**:

```typescript
const listHandler = defineRoute({
  method: 'GET',
  path: '/list',
  handler: () => [...],
})

// put it in a route group
defineRoute({
  path: '/files',
  middleware: [logMiddleware],
  children: [listHandler],
})
// actual path: /files/list
```

### Multi-Level Nesting

```typescript
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    children: [
      defineRoute({
        path: '/v1',
        children: [
          defineRoute({
            method: 'GET',
            path: '/users',
            handler: () => 'API v1 users'
          })
        ]
      }),
      defineRoute({
        path: '/v2',
        children: [
          defineRoute({
            method: 'GET',
            path: '/users',
            handler: () => 'API v2 users'
          })
        ]
      })
    ]
  })
])
```

> For route groups + type wrappers in auth scenarios, see [Auth Middleware](/en/middleware/auth-middleware).

## Route Options

Each route can be configured with the following options:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/protected/:id',
    middleware: [authMiddleware],  // route-level middleware
    schema: {
      params: Type.Object({ id: Type.String() }),    // path param validation
      query: Type.Object({ page: Type.Number() })     // query param validation
    },
    handler: ({ params, query }) => ({ id: params.id, page: query.page })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({                            // request body validation
        name: Type.String(),
        email: Type.String({ format: 'email' })
      })
    },
    handler: ({ body }) => ({ user: body })
  })
])
```

## Best Practices

### 1. Use Descriptive Paths

```typescript
// ✅ Good
path: '/users/:id/profile'
path: '/posts/:postId/comments'

// ❌ Bad
path: '/u/:i'
path: '/p/:p/c'
```

### 2. Keep the Route Structure Clear

Organize your API with nested routes:

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  // user routes
  defineRoute({
    path: '/users',
    children: [
      defineRoute({ method: 'GET', path: '/', handler: () => 'List users' }),
      defineRoute({ method: 'POST', path: '/', handler: () => 'Create user' }),
      defineRoute({ method: 'GET', path: '/:id', handler: ({ params }) => `User ${params.id}` })
    ]
  }),
  
  // post routes
  defineRoute({
    path: '/posts',
    children: [
      defineRoute({ method: 'GET', path: '/', handler: () => 'List posts' }),
      defineRoute({ method: 'POST', path: '/', handler: () => 'Create post' })
    ]
  })
])
```

### 3. Use the Right HTTP Methods

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: () => 'Get users' }),      // read data
  defineRoute({ method: 'POST', path: '/users', handler: () => 'Create user' }),   // create data
  defineRoute({ method: 'PUT', path: '/users/:id', handler: () => 'Update user' }), // full update
  defineRoute({ method: 'PATCH', path: '/users/:id', handler: () => 'Patch user' }), // partial update
  defineRoute({ method: 'DELETE', path: '/users/:id', handler: () => null })        // delete (returns 204)
])
```

### 4. Type-Safe Route Definitions

`defineRoutes()` preserves literal types automatically for end-to-end type inference:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

// Define and handle routes
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: ({ params }) => ({ userId: params.id })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: Type.Object({ name: Type.String() }) },
    handler: ({ body }) => ({ name: body.name })
  })
])

// ✅ Type inference just works, no `as const` needed!
type Api = InferEden<typeof routes>
```

### 5. Use Extension Fields

Vafast lets you add arbitrary extension fields to route definitions for webhooks, permissions, billing and more:

```typescript
import { defineRoute, defineRoutes, getRouteRegistry, defineMiddleware } from 'vafast'

// billing middleware
const billingMiddleware = defineMiddleware(async (req, next) => {
  const registry = getRouteRegistry()
  const route = registry.get(req.method, new URL(req.url).pathname)
  
  if (route?.billing) {
    await chargeUser(req, route.billing)
  }
  
  return next()
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/ai/generate',
    name: 'AI generation',
    // ✨ Extension field: billing config
    billing: { price: 0.01, currency: 'USD', unit: 'request' },
    // ✨ Extension field: webhook event
    webhook: { eventKey: 'ai.generate' },
    // ✨ Extension field: required permission
    permission: 'ai.generate',
    middleware: [billingMiddleware],
    handler: async ({ body }) => {
      return await generateAI(body.prompt)
    }
  })
])
```

For more details, see [Routing Guide - Extension Fields](/en/routing#extension-fields-—-declarative-metadata).

