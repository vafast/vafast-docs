---
title: 'Migrating from Elysia to Vafast: An Elysia Alternative Migration Guide'
description: 'A complete guide to migrating from Elysia to Vafast: performance comparison, routing and key differences, migration steps and a full example, and the advantages of Vafast as an Elysia alternative that runs on both Node.js and Bun.'
prev:
  text: 'Quick Start'
  link: '/quick-start'
next:
  text: 'Tutorial'
  link: '/tutorial'
---

<script setup>
import Compare from '../../components/fern/compare.vue'
import Card from '../../components/nearl/card.vue'
import Deck from '../../components/nearl/card-deck.vue'
</script>

# From Elysia to Vafast

This guide is for Elysia users who want to see the differences between Elysia and Vafast, including syntax, and how to migrate an application from Elysia to Vafast by example.

**Elysia** is a high-performance TypeScript web framework optimized for Bun, known for its excellent performance and type safety.

**Vafast** is also a high-performance TypeScript web framework. It runs on Node.js, Bun and other runtimes, focusing on structured routing, type safety and performance.

## Performance Comparison

Elysia and Vafast are both high-performance frameworks. Elysia is slightly faster on Bun, while Vafast offers better multi-runtime support.

| Framework | RPS | Notes |
|------|-----|------|
| Elysia | ~118K | Bun-specific optimizations |
| **Vafast** | **~101K** | Multi-runtime support |

## Routing

Elysia and Vafast differ significantly in how routes are defined.

<Compare>

<template v-slot:left>

::: code-group

```ts [Elysia]
import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/', () => 'Hello World')
  .post('/user/:id', ({ params, body }) => ({
    id: params.id,
    name: body.name
  }))

export default app
```

:::
</template>

<template v-slot:left-content>

> Elysia uses chained method calls, with the method and path in the same call

</template>

<template v-slot:right>

::: code-group

```ts [Vafast]
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  }),
  defineRoute({
    method: 'POST',
    path: '/user/:id',
    handler: ({ params, body }) => ({
      id: params.id,
      name: body.name
    })
  })
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

:::
</template>

<template v-slot:right-content>

> Vafast defines routes with configuration objects, so the structure is clearly visible

</template>

</Compare>

## Key Differences

### 1. Route Definitions

**Elysia** uses chained method calls:
```typescript
const app = new Elysia()
  .get('/users', () => getUsers())
  .post('/users', ({ body }) => createUser(body))
  .get('/users/:id', ({ params }) => getUserById(params.id))
```

**Vafast** uses an array of configuration objects:
```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => getUsers()
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: ({ body }) => createUser(body)
  }),
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => getUserById(params.id)
  })
])
```

### 2. Request Parameters

**Elysia** destructures directly:
```typescript
app.get('/user/:id', ({ params, query, body, headers }) => {
  return { id: params.id, query, body }
})
```

**Vafast** also uses destructuring:
```typescript
defineRoute({
  method: 'GET',
  path: '/user/:id',
  handler: ({ params, query, body, req }) => {
    return { id: params.id, query, body }
  }
})
```

### 3. Schema Validation

**Elysia** uses the built-in t (a TypeBox wrapper):
```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .post('/users', ({ body }) => createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: 'email' })
    })
  })
```

**Vafast** uses TypeBox (import Type from vafast):
```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: UserSchema },
    handler: ({ body }) => createUser(body)
  })
])
```

> **How the new framework works**:
> - Schema validation is defined in the route's `schema` field
> - The handler receives validated data directly, with automatic type inference

### 4. Middleware/Plugins

**Elysia** uses `.use()` and decorators:
```typescript
const app = new Elysia()
  .use(cors())
  .derive(({ headers }) => ({
    user: verifyToken(headers.authorization)
  }))
  .get('/profile', ({ user }) => user)
```

**Vafast** uses middleware functions:
```typescript
import { defineRoute, defineRoutes, defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  const user = await verifyToken(token)
  // pass user info via next
  return await next({ user })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [authMiddleware],
    handler: ({ user }) => user  // user is typed automatically
  })
])
```

> **How the new framework works**:
> - Middleware is defined with `defineMiddleware`, supporting type injection
> - Pass context via `next({ user })` and the handler gets the types automatically

### 5. Response Handling

**Elysia** converts return values automatically:
```typescript
app.get('/json', () => ({ message: 'Hello' }))  // automatic JSON
app.get('/text', () => 'Hello')                  // automatic text
```

**Vafast** converts them automatically too:
```typescript
defineRoute({
  method: 'GET',
  path: '/json',
  handler: () => ({ message: 'Hello' })  // automatic JSON
}),
defineRoute({
  method: 'GET',
  path: '/text',
  handler: () => 'Hello'  // automatic text
})
```

### 6. Error Handling

**Elysia** uses `.onError()`:
```typescript
const app = new Elysia()
  .onError(({ error }) => {
    return { error: error.message }
  })
```

**Vafast** has a built-in `errorHandler`; just `throw err.xxx()` in the handler:

```typescript
import { err } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => {
    const user = getUser(params.id)
    if (!user) throw err.notFound('User not found')
    return user
  },
})
```

> The framework injects `errorHandler` automatically; **don't** call `server.use(errorHandler)`.

## Migration Steps

### Step 1: Install Vafast

```bash
npm install vafast
# or
npm install vafast
```

### Step 2: Refactor Route Definitions

```typescript
// Elysia
const app = new Elysia()
  .get('/api/users', () => getUsers())
  .post('/api/users', ({ body }) => createUser(body))

// Vafast
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    handler: () => getUsers()
  }),
  defineRoute({
    method: 'POST',
    path: '/api/users',
    handler: ({ body }) => createUser(body)
  })
])
```

### Step 3: Update Validation

```typescript
// Elysia
import { Elysia, t } from 'elysia'

app.post('/users', ({ body }) => createUser(body), {
  body: t.Object({
    name: t.String(),
    email: t.String({ format: 'email' })
  })
})

// Vafast
import { Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' })
})

defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: UserSchema },
  handler: ({ body }) => createUser(body)
})
```

### Step 4: Update Middleware

```typescript
// Elysia
app.derive(({ headers }) => ({
  user: verifyToken(headers.authorization)
}))

// Vafast
import { defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  const user = await verifyToken(token)
  return await next({ user })  // pass context via next
})
```

## Complete Migration Example

### Elysia App

```typescript
import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(cors())
  .derive(({ headers }) => ({
    user: verifyToken(headers.authorization)
  }))
  .get('/users', () => getUsers())
  .post('/users', ({ body }) => createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: 'email' })
    })
  })
  .get('/users/:id', ({ params }) => {
    const user = getUserById(params.id)
    if (!user) throw new Error('User not found')
    return user
  })
  .onError(({ error }) => ({
    error: error.message
  }))

export default app
```

### Vafast App

```typescript
import { Server, defineRoute, defineRoutes, defineMiddleware, serve, Type, json, err } from 'vafast'
import { cors } from '@vafast/cors'

const UserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  const user = await verifyToken(token)
  return await next({ user })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => getUsers()
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: UserSchema },
    handler: ({ body }) => json(createUser(body), 201)
  }),
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => {
      const user = getUserById(params.id)
      if (!user) {
        throw err.notFound('User not found')
      }
      return user
    }
  })
])

const server = new Server(routes)
server.use(cors())

serve({ fetch: server.fetch, port: 3000 })
```

> **How the new framework works**:
> - Every route is wrapped in `defineRoute`
> - Schema validation is defined in the `schema` field
> - Middleware is defined with `defineMiddleware`
> - Global middleware uses `server.use()`

## Comparison

| Feature | Elysia | Vafast |
|------|--------|--------|
| Performance | Extremely high (Bun) | Very high (multi-runtime) |
| Type safety | ✅ Complete | ✅ Complete |
| Route visibility | ⚠️ Chained calls | ✅ Configuration array |
| Runtime support | ⚠️ Mainly Bun | ✅ Node.js/Bun/Deno |
| Validation | ✅ TypeBox (t) | ✅ TypeBox (Type) |
| Plugin ecosystem | ✅ Rich |  Growing |
| Learning curve | ⚠️ Decorator syntax | ✅ Simple and direct |

## Why Choose Vafast?

1. **Multi-runtime support** - not limited to Bun; runs on Node.js, Deno and more
2. **Clear structure** - route configuration is visible at a glance, no chained calls to trace
3. **No magic** - no decorators, no implicit behavior
4. **Type safety** - full TypeScript support and type inference

## Next Steps

1. Read the [Quick Start](/en/quick-start) to start using Vafast
2. Read [Key Concepts](/en/key-concept) to dig deeper into Vafast
3. Explore the [Middleware System](/en/middleware) to learn how to extend functionality

If you run into any issues during migration, feel free to ask for help on [GitHub Issues](https://github.com/vafast/vafast/issues).
