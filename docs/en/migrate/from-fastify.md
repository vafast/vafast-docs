---
title: 'Migrating from Fastify to Vafast: A TypeScript Framework Migration Guide'
description: 'A complete guide to migrating from Fastify to Vafast: performance comparison, differences in routes and schemas, migration steps and a full example. Simplify TypeScript API development with declarative routing and automatic type inference.'
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

import Benchmark from '../../components/fern/benchmark-fastify.vue'
</script>

# From Fastify to Vafast

This guide is for Fastify users who want to see the differences between Fastify and Vafast, including syntax, and how to migrate an application from Fastify to Vafast by example.

**Fastify** is a Node.js web framework focused on maximum efficiency and speed, with a low memory footprint and excellent performance.

**Vafast** is a high-performance TypeScript web framework that runs on Node.js, Bun and other runtimes, focused on type safety, a middleware system and performance. It's designed for simplicity and developer friendliness, with full TypeScript support.

## Performance
Thanks to radix tree route matching and JIT-compiled validators, Vafast is significantly faster than Fastify.

<Benchmark />

## Routing

Both Fastify and Vafast define routes with configuration objects, but Vafast offers a more concise API and better type safety.

<Compare>

<template v-slot:left>

::: code-group

```ts [Fastify]
import Fastify from 'fastify'

const fastify = Fastify()

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.post('/user/:id', async (request, reply) => {
  const { id } = request.params
  const { name } = request.body
  return { id, name }
})

await fastify.listen({ port: 3000 })
```

:::
</template>

<template v-slot:left-content>

> Fastify uses `request` and `reply` as the request and response objects

</template>

<template v-slot:right>

::: code-group

```ts [Vafast]
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return { hello: 'world' }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/user/:id',
    handler: ({ params, body }) => {
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

**Fastify** uses chained method calls:
```typescript
fastify.get('/users', async (request, reply) => { ... })
fastify.post('/users', async (request, reply) => { ... })
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

**Fastify** uses the `request` and `reply` objects:
```typescript
fastify.get('/user/:id', async (request, reply) => {
  const id = request.params.id
  const query = request.query
  return { id, query }
})
```

**Vafast** uses destructured parameters:
```typescript
defineRoute({
  method: 'GET',
  path: '/user/:id',
  handler: ({ params, query }) => {
    return { id: params.id, query }
  }
})
```

### 3. Schema Validation

**Fastify** uses built-in JSON Schema validation:
```typescript
const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  required: ['name']
}

fastify.post('/users', {
  schema: {
    body: userSchema
  }
}, async (request, reply) => {
  return createUser(request.body)
})
```

**Vafast** uses TypeBox for validation:
```typescript
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String(),
  age: Type.Optional(Type.Number())
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

### 4. Middleware System

**Fastify** uses hooks and a plugin system:
```typescript
fastify.addHook('preHandler', async (request, reply) => {
  console.log(`${request.method} ${request.url}`)
})

fastify.register(async function (fastify) {
  fastify.get('/admin', async (request, reply) => {
    return 'Admin Panel'
  })
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

### 5. Error Handling

**Fastify** uses an error handler:
```typescript
fastify.setErrorHandler((error, request, reply) => {
  reply.status(500).send({ error: error.message })
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

Convert Fastify route definitions into Vafast's configuration object format:

```typescript
// Fastify style
fastify.get('/api/users', async (request, reply) => {
  const users = getUsers()
  return users
})

// Vafast style
defineRoute({
  method: 'GET',
  path: '/api/users',
  handler: () => {
    return getUsers()
  }
})
}
```

### Step 3: Update Schema Validation

Convert Fastify's JSON Schema to TypeBox:

```typescript
// Fastify Schema
const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'email']
}

// Vafast Schema
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})
```

### Step 4: Update Middleware and Hooks

```typescript
// Fastify hook
fastify.addHook('preHandler', async (request, reply) => {
  const token = request.headers.authorization
  if (!token) {
    reply.status(401).send('Unauthorized')
  }
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

### Step 5: Update Error Handling

```typescript
// Fastify error handling
fastify.setErrorHandler((error, request, reply) => {
  reply.status(500).send({ error: error.message })
})

// Vafast: built-in errorHandler; throw err.xxx() in the handler
import { err } from 'vafast'

handler: ({ params }) => {
  if (!found) throw err.notFound('Not found')
  return data
}
```

## Complete Migration Example

### Fastify App

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

const fastify = Fastify()

await fastify.register(cors)
await fastify.register(helmet)

fastify.get('/users', async (request, reply) => {
  const users = getUsers()
  return users
})

fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      },
      required: ['name', 'email']
    }
  }
}, async (request, reply) => {
  const user = createUser(request.body)
  reply.status(201)
  return user
})

fastify.get('/users/:id', async (request, reply) => {
  const user = getUserById(request.params.id)
  if (!user) {
    reply.status(404)
    return { error: 'User not found' }
  }
  return user
})

await fastify.listen({ port: 3000 })
```

### Vafast App

```typescript
import { Server, defineRoute, defineRoutes, Type, json, err } from 'vafast'
import { cors } from '@vafast/cors'

const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String()
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

> **How the new framework works**:
> - Every route is wrapped in `defineRoute`
> - Schema validation is defined in the `schema` field
> - Global middleware uses `server.use()`

## Comparison

| Feature | Fastify | Vafast |
|------|---------|---------|
| Type safety | ⚠️ Requires extra setup | ✅ Full TypeScript support |
| Performance | ✅ High performance | Very high performance |
| Schema validation | ✅ JSON Schema | ✅ TypeBox |
| Middleware system | ✅ Hook system | ✅ Flexible and extensible |
| Route definitions | ⚠️ Chained calls | ✅ Configuration objects |
| Error handling | ✅ Error handler | ✅ Middleware chain |
| Bun support | ❌ Requires adaptation | ✅ Native |

## Next Steps

Now that you know how to migrate from Fastify to Vafast, we suggest you:

1. Read the [Quick Start](/en/quick-start) to start using Vafast
2. Read [Key Concepts](/en/key-concept) to understand how Vafast works
3. Explore the [Middleware System](/en/middleware) to learn how to extend functionality
4. Follow the [Tutorial](/en/tutorial) to get familiar with writing Vafast

If you run into any issues during migration, feel free to ask for help on [GitHub Issues](https://github.com/vafast/vafast/issues).