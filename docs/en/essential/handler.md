---
title: Handler - Vafast
description: 'Vafast handlers: write route handlers with defineRoute, access params, query, body, headers and cookies, return values that become responses, and throw semantic errors.'
---

<script setup>
import Tab from '../../components/fern/tab.vue'
</script>

# Handler

A handler is the function that responds to each route's requests.

It receives the request information and returns a response to the client.

In other frameworks, handlers are also called **controllers**.

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'hello world'
  })
])
```

## Basic Usage

### Simple Responses

The simplest handler returns data directly:

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  }),
  defineRoute({
    method: 'GET',
    path: '/json',
    handler: () => ({ message: 'Hello World' })
  }),
  defineRoute({
    method: 'GET',
    path: '/html',
    handler: () => '<h1>Hello World</h1>'
  })
])
```

### Accessing Request Information

Handlers can access all kinds of request information:

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/info',
    handler: ({ req, headers, query }) => {
      return {
        url: req.url,
        method: req.method,
        userAgent: headers['user-agent'],
        query: query.search || 'default'
      }
    }
  })
])
```

### Async Handlers

Handlers support async operations:

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }) => {
      // simulate a database operation
      const user = await createUser(body)
      return user
    }
  })
])
```

## Parameter Destructuring

Vafast uses parameter destructuring to provide type-safe access:

### Basic Parameters

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/user/:id',
    handler: ({ params, query, headers }) => {
      const userId = params.id
      const page = query.page || '1'
      const auth = headers.authorization
      
      return `User ${userId}, Page ${page}, Auth: ${auth}`
    }
  })
])
```

### Request Body

::: tip Recommended
Use schema validation instead of manual validation for better type safety and error messages.
:::

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.String({ format: 'email' }),
        age: Type.Optional(Type.Number())
      })
    },
    handler: ({ body }) => ({
      name: body.name,
      email: body.email,
      age: body.age || 18
    })
  })
])
```

### Query Parameters

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/search',
    handler: ({ query }) => {
      const { q, page = '1', limit = '10', sort = 'name' } = query
      
      return {
        query: q,
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        results: []
      }
    }
  })
])
```

## Response Handling

### Automatic Response Types

Vafast handles different return value types automatically:

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/string',
    handler: () => 'Plain text' // returns text/plain
  }),
  defineRoute({
    method: 'GET',
    path: '/json',
    handler: () => ({ data: 'JSON' }) // returns application/json
  }),
  defineRoute({
    method: 'GET',
    path: '/html',
    handler: () => '<h1>HTML</h1>' // returns text/html
  }),
  defineRoute({
    method: 'GET',
    path: '/number',
    handler: () => 42 // returns text/plain
  })
])
```

### Custom Status Codes and Headers

Use the `{ data, status, headers }` format to control response details:

```typescript
import { defineRoute, defineRoutes, redirect } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/custom',
    handler: () => ({
      data: 'Custom response',
      status: 200,
      headers: { 'X-Custom-Header': 'value' }
    })
  }),
  defineRoute({
    method: 'GET',
    path: '/redirect',
    handler: () => redirect('/new-page')
  })
])
```

### Error Responses

Use the `err()` helpers to throw semantic errors:

```typescript
import { defineRoute, defineRoutes, err } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/user/:id',
    handler: ({ params }) => {
      const userId = params.id
      
      if (!userId || isNaN(Number(userId))) {
        throw err.badRequest('Invalid user ID')
      }
      
      if (userId === '999') {
        throw err.notFound('User not found')
      }
      
      return { id: userId, name: 'John Doe' }
    }
  })
])

// error response format: { "code": 404, "message": "User not found" }
```

**Predefined errors:**

| Method | Status | When to use |
|------|--------|----------|
| `err.badRequest()` | 400 | Invalid parameters |
| `err.unauthorized()` | 401 | Not logged in |
| `err.forbidden()` | 403 | No permission |
| `err.notFound()` | 404 | Resource not found |
| `err.conflict()` | 409 | Resource conflict |
| `err.internal()` | 500 | Server error |

## Middleware Integration

Handlers work together with middleware:

```typescript
import { defineRoute, defineRoutes, defineMiddleware, err } from 'vafast'

const authMiddleware = defineMiddleware<{ userId: string }>(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('Not logged in')
  return next({ userId: 'user-123' })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/protected',
    handler: () => 'Protected content',
    middleware: [authMiddleware]
  })
])
```

## Schema Validation

Handlers integrate with TypeBox validation, declared in the route's `schema` field:

```typescript
import { defineRoute, defineRoutes, Type, err } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => {
      // body has been validated and is type-safe
      const { name, email, age } = body
      return { name, email, age: age || 18 }
    }
  })
])
```

## Best Practices

### 1. Keep Handlers Lean

```typescript
// ✅ Good
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }) => {
      const user = await createUser(body)
      return user
    }
  })
])

// ❌ Avoid
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }) => {
      // don't put too much business logic here
      const { name, email, age, address, phone, preferences, ... } = body
      // complex validation logic
      // database operations
      // sending email
      // logging
      // and so on...
    }
  })
])
```

### 2. Use Appropriate Error Handling

```typescript
import { defineRoute, defineRoutes, err } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/user/:id',
    handler: async ({ params }) => {
      const user = await getUserById(params.id)
      if (!user) {
        throw err.notFound('User not found')
      }
      return user
      // note: uncaught errors are turned into a 500 by the framework's built-in error handling
    }
  })
])
```

### 3. Leverage Type Safety

```typescript
interface User {
  id: string
  name: string
  email: string
}

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }): Promise<User> => {
      const user = await createUser(body)
      return user
    }
  })
])
```

## Summary

Vafast's handler system provides:

- ✅ Type-safe parameter access
- ✅ Automatic response type inference
- ✅ Middleware integration
- ✅ Validation integration
- ✅ Async support
- ✅ Flexible response control

### Next Steps

- Read [Routing](/en/routing) to learn how to organize routes
- Learn the [Middleware System](/en/middleware) to extend your handlers
- Explore [Validation](/en/essential/validation) to learn how to validate request data
- See [Best Practices](/en/essential/best-practice) for more development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).
