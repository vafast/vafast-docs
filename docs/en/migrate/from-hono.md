---
title: 'Migrating from Hono to Vafast: A Hono Alternative Migration Guide'
description: 'A complete guide to migrating from Hono to Vafast: performance comparison, differences in routing and middleware, migration steps and a full example, and the advantages of Vafast as a Hono alternative.'
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

import Benchmark from '../../components/fern/benchmark-hono.vue'
</script>

# From Hono to Vafast

This guide is for Hono users who want to see the differences between Hono and Vafast, including syntax, and how to migrate an application from Hono to Vafast by example.

**Hono** is a lightweight, ultra-fast web framework designed for edge runtimes, supporting many platforms.

**Vafast** is a high-performance TypeScript web framework that runs on Node.js, Bun and other runtimes, focused on type safety, a middleware system and performance. It's designed for simplicity and developer friendliness, with full TypeScript support.

## Performance
Thanks to radix tree route matching and JIT-compiled validators, Vafast is significantly faster than Hono.

<Benchmark />

## Routing

Both Hono and Vafast define routes with configuration objects, but Vafast offers a more structured API and better type safety.

<Compare>

<template v-slot:left>

::: code-group

```ts [Hono]
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello World')
})

app.post('/user/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json({ id, name: body.name })
})

export default app
```

:::
</template>

<template v-slot:left-content>

> Hono uses `c` (context) as the request and response object

</template>

<template v-slot:right>

::: code-group

```ts [Vafast]
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  }),
  defineRoute({
    method: 'POST',
    path: '/user/:id',
    handler: async ({ params, req }) => {
      const body = await req.json()
      return { id: params.id, name: body.name }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

:::
</template>

<template v-slot:right-content>

> Vafast defines routes with configuration objects, with type safety and middleware support

</template>

</Compare>

## Key Differences

### 1. Route Definitions

**Hono** uses chained method calls:
```typescript
app.get('/users', (c) => { ... })
app.post('/users', (c) => { ... })
```

**Vafast** uses an array of configuration objects:
```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => { ... }
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: () => { ... }
  })
])
```

### 2. Request Handling

**Hono** uses the `c` (context) object:
```typescript
app.get('/user/:id', (c) => {
  const id = c.req.param('id')
  const query = c.req.query()
  return c.json({ id, query })
})
```

**Vafast** uses destructured parameters:
```typescript
defineRoute({
  method: 'GET',
  path: '/user/:id',
  handler: ({ params, query }) => {
    return { id: params.id, query }
  })
}
```

### 3. Middleware System

**Hono** uses `app.use()` and route-level middleware:
```typescript
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`)
  await next()
})

app.get('/admin', authMiddleware, (c) => {
  return c.text('Admin Panel')
})
```

**Vafast** supports global and route-level middleware:
```typescript
import { defineMiddleware } from 'vafast'

const loggingMiddleware = defineMiddleware(async (req, next) => {
  console.log(`${req.method} ${req.url}`)
  return await next()
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin',
    handler: () => 'Admin Panel',
    middleware: [authMiddleware]
  })
])

const server = new Server(routes)
server.use(loggingMiddleware)
```

### 4. Validation

**Hono** uses Zod for validation:
```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

app.post('/users', zValidator('json', userSchema), (c) => {
  const body = c.req.valid('json')
  return c.json(createUser(body))
})
```

**Vafast** uses TypeBox for validation:
```typescript
import { defineRoute, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: userSchema },
  handler: ({ body }) => {
    return createUser(body)
  }
})
```

> **How the new framework works**:
> - Schema validation is defined in the route's `schema` field
> - The handler receives validated data directly, with automatic type inference

### 5. Error Handling

**Hono** uses an error handler:
```typescript
app.onError((err, c) => {
  console.error(`${err}`)
  return c.text('Custom Error Message', 500)
})
```

**Vafast** has a built-in `errorHandler`; just `throw err.xxx()` in the handler:

```typescript
import { err } from 'vafast'

handler: ({ params }) => {
  if (!found) throw err.notFound('Not found')
  return data
}
```

> The framework injects `errorHandler` automatically, so there's no need to write try/catch middleware.

## Migration Steps

### Step 1: Install Vafast

```bash
npm install vafast
```

### Step 2: Refactor Route Definitions

Convert Hono route definitions into Vafast's configuration object format:

```typescript
// Hono style
app.get('/api/users', (c) => {
  const users = getUsers()
  return c.json(users)
})

// Vafast style
defineRoute({
  method: 'GET',
  path: '/api/users',
  handler: () => {
    return getUsers()
  }
})
```

### Step 3: Update Middleware

Convert Hono middleware into the Vafast middleware format:

```typescript
// Hono middleware
app.use('*', async (c, next) => {
  const token = c.req.header('authorization')
  if (!token) {
    return c.text('Unauthorized', 401)
  }
  await next()
})

// Vafast middleware
import { defineMiddleware, json } from 'vafast'

const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return await next()
})
```

### Step 4: Update Validation

```typescript
// Hono validation
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

app.post('/users', zValidator('json', userSchema), (c) => {
  const body = c.req.valid('json')
  return c.json(createUser(body))
})

// Vafast validation
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

defineRoute({
  method: 'POST',
  path: '/users',
  schema: {
    body: userSchema
  },
  handler: ({ body }) => {
    return createUser(body)
  }
})
```

### Step 5: Update Error Handling

```typescript
// Hono error handling
app.onError((err, c) => {
  return c.text('Something went wrong', 500)
})

// Vafast: built-in errorHandler; throw err.xxx() in the handler
import { err } from 'vafast'

handler: ({ params }) => {
  if (!found) throw err.notFound('Not found')
  return data
}
```

## Complete Migration Example

### Hono App

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

app.get('/users', (c) => {
  const users = getUsers()
  return c.json(users)
})

app.post('/users', zValidator('json', userSchema), (c) => {
  const body = c.req.valid('json')
  const user = createUser(body)
  c.status(201)
  return c.json(user)
})

app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  const user = getUserById(id)
  if (!user) {
    c.status(404)
    return c.json({ error: 'User not found' })
  }
  return c.json(user)
})

export default app
```

### Vafast App

```typescript
import { Server, defineRoute, defineRoutes, Type, json, err } from 'vafast'
import { cors } from '@vafast/cors'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
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
    schema: { body: userSchema },
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

export default { fetch: server.fetch }
```

## Comparison

| Feature | Hono | Vafast |
|------|------|---------|
| Type safety | ⚠️ Requires extra setup | ✅ Full TypeScript support |
| Performance | ✅ High performance | Very high performance |
| Validation | ✅ Zod support | ✅ TypeBox support |
| Middleware system | ✅ Flexible | ✅ Flexible and extensible |
| Route definitions | ⚠️ Chained calls | ✅ Configuration objects |
| Error handling | ✅ Error handler | ✅ Middleware chain |
| Bun support | ⚠️ Requires adaptation | ✅ Native |

## Next Steps

Now that you know how to migrate from Hono to Vafast, we suggest you:

1. Read the [Quick Start](/en/quick-start) to start using Vafast
2. Read [Key Concepts](/en/key-concept) to understand how Vafast works
3. Explore the [Middleware System](/en/middleware) to learn how to extend functionality
4. Follow the [Tutorial](/en/tutorial) to get familiar with writing Vafast

If you run into any issues during migration, feel free to ask for help on [GitHub Issues](https://github.com/vafast/vafast/issues).