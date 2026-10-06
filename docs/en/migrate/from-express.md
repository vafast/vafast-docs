---
title: 'Migrating from Express to Vafast: A TypeScript Framework Migration Guide'
description: 'A complete guide to migrating from Express to Vafast: performance comparison, routing differences, migration steps and a full example, for higher performance and end-to-end type-safe TypeScript web development.'
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

import Benchmark from '../../components/fern/benchmark-express.vue'
</script>

# From Express to Vafast

This guide is for Express users who want to see the differences between Express and Vafast, including syntax, and how to migrate an application from Express to Vafast by example.

**Express** is a popular Node.js web framework widely used to build web applications and APIs. It's known for its simplicity and flexibility.

**Vafast** is a high-performance TypeScript web framework that runs on Node.js, Bun and other runtimes, focused on type safety, a middleware system and performance. It's designed for simplicity and developer friendliness, with full TypeScript support.

## Performance
Thanks to radix tree route matching and JIT-compiled validators, Vafast is significantly faster than Express.

<Benchmark />

## Routing

Express and Vafast have similar routing syntax, but Vafast defines routes with configuration objects, providing better type safety and middleware support.

<Compare>

<template v-slot:left>

::: code-group

```ts [Express]
import express from 'express'

const app = express()

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.post('/id/:id', (req, res) => {
    res.status(201).send(req.params.id)
})

app.listen(3000)
```

:::
</template>

<template v-slot:left-content>

> Express uses `req` and `res` as the request and response objects

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
    path: '/id/:id',
    handler: ({ params }) => {
      return { id: params.id }
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

**Express** uses chained method calls:
```typescript
app.get('/users', (req, res) => { ... })
app.post('/users', (req, res) => { ... })
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

> **How the new framework works**:
> - Every route must be wrapped in `defineRoute`
> - A handler is just a function; no more `createHandler` wrapper

### 2. Request Handling

**Express** uses the `req` and `res` objects:
```typescript
app.get('/user/:id', (req, res) => {
  const id = req.params.id
  const query = req.query
  res.json({ id, query })
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

### 3. Middleware System

**Express** uses `app.use()` and route-level middleware:
```typescript
app.use(loggingMiddleware)
app.get('/admin', authMiddleware, (req, res) => {
  res.send('Admin Panel')
})
```

**Vafast** supports global and route-level middleware:
```typescript
import { defineRoute, defineRoutes, defineMiddleware } from 'vafast'

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
  }
])
```

### 4. Error Handling

**Express** uses error-handling middleware:
```typescript
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
```

**Vafast** has a built-in `errorHandler`; just `throw err.xxx()` in the handler:

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
```

> The framework injects `errorHandler` automatically, so there's **no need** to write try/catch middleware.

## Migration Steps

### Step 1: Install Vafast

```bash
npm install vafast
```

### Step 2: Refactor Route Definitions

Convert Express route definitions into Vafast's configuration object format:

```typescript
// Express style
app.get('/api/users', (req, res) => {
  const users = getUsers()
  res.json(users)
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

Convert Express middleware into the Vafast middleware format:

```typescript
// Express middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    return res.status(401).send('Unauthorized')
  }
  next()
}

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

### Step 4: Update Error Handling

```typescript
// Express error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})

// Vafast: built-in errorHandler; throw err.xxx() in the handler
import { err } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => {
    const user = getUserById(params.id)
    if (!user) throw err.notFound('User not found')
    return user
  },
})
```

## Complete Migration Example

### Express App

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())

app.get('/users', (req, res) => {
  const users = getUsers()
  res.json(users)
})

app.post('/users', (req, res) => {
  const user = createUser(req.body)
  res.status(201).json(user)
})

app.get('/users/:id', (req, res) => {
  const user = getUserById(req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

app.listen(3000)
```

### Vafast App

```typescript
import { Server, defineRoute, defineRoutes, json, err } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => getUsers()
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
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
> - A handler is just a function; no more `createHandler`
> - Global middleware uses `server.use()`

## Comparison

| Feature | Express | Vafast |
|------|---------|---------|
| Type safety | ❌ Requires extra setup | ✅ Full TypeScript support |
| Performance | ⚠️ Moderate | High performance |
| Middleware system | ✅ Mature | ✅ Flexible and extensible |
| Route definitions | ⚠️ Chained calls | ✅ Configuration objects |
| Error handling | ✅ Middleware-based | ✅ Middleware chain |
| Bun support | ❌ Requires adaptation | ✅ Native |

## Next Steps

Now that you know how to migrate from Express to Vafast, we suggest you:

1. Read the [Quick Start](/en/quick-start) to start using Vafast
2. Read [Key Concepts](/en/key-concept) to understand how Vafast works
3. Explore the [Middleware System](/en/middleware) to learn how to extend functionality
4. Follow the [Tutorial](/en/tutorial) to get familiar with writing Vafast

If you run into any issues during migration, feel free to ask for help on [GitHub Issues](https://github.com/vafast/vafast/issues).