---
title: 'Vafast: The TypeScript Web Framework That Made Me Drop Express and Hono'
description: 'Why Vafast: a TypeScript web framework with declarative routing, end-to-end type safety and better performance than Express, compared with real-world experience using Express, Koa, Fastify, Hono and Elysia.'
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../../components/blog/Layout.vue'
</script>

<Blog
title="Vafast: The TypeScript Web Framework That Made Me Drop Express and Hono"
src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
alt="Introducing the Vafast framework"
author="vafast"
date="January 2025"
>

> Declarative routing + end-to-end type safety + 1.8x faster than Express: the Node.js framework I always wanted

## Introduction

As a developer who has written Node.js backends for years, I've used Express, Koa, Fastify, Hono, Elysia... Each framework has its strengths, but each also has things that bother me:

- **Express**: a rich ecosystem, but poor performance and weak type support
- **Hono**: lightweight and fast, but once the chained API grows long you can't see which routes exist
- **Elysia**: great performance and types, but Bun-only, and chaining loses types across files

Then I found **Vafast**, a declarative web framework designed for TypeScript.

## Why Vafast?

### 1. See All Routes at a Glance, No Digging Through Code

First, here's how routes look in traditional frameworks:

```typescript
// Hono / Express style
app.get('/users', getUsers)
app.post('/users', createUser)
app.get('/users/:id', getUser)
app.put('/users/:id', updateUser)
app.delete('/users/:id', deleteUser)
app.get('/posts', getPosts)
// ... 100 lines later, can you still find a given route?
```

Now look at Vafast:

```typescript
// Vafast style
const routes = defineRoutes([
  defineRoute({ method: 'GET',    path: '/users',     handler: getUsers }),
  defineRoute({ method: 'POST',   path: '/users',     handler: createUser }),
  defineRoute({ method: 'GET',    path: '/users/:id', handler: getUser }),
  defineRoute({ method: 'PUT',    path: '/users/:id', handler: updateUser }),
  defineRoute({ method: 'DELETE', path: '/users/:id', handler: deleteUser }),
  defineRoute({ method: 'GET',    path: '/posts',     handler: getPosts }),
])
```

**Routes are just an array, so every API endpoint is visible at a glance.** This is especially useful for teamwork and code review.

### 2. Type Safety from Request to Response

Vafast implements schema validation with TypeBox: define it once and types are inferred automatically:

```typescript
import { defineRoute, Type } from 'vafast'

const createUser = defineRoute({
  method: 'POST',
  path: '/users',
  schema: {
    body: Type.Object({ 
      name: Type.String(), 
      email: Type.String({ format: 'email' }),
      age: Type.Number({ minimum: 0 })
    })
  },
  handler: ({ body }) => {
    // body.name is string ✅
    // body.email is string ✅
    // body.age is number ✅
    return { success: true, user: body }
  }
})
```

> **Notes on the new framework API**:
> - Schema validation is defined in the route config's `schema` field
> - The handler receives validated data directly, with type inference

**Runtime validation + compile-time type inference: two wins in one.**

### 3. Frontend and Backend Types Sync Automatically

This is my favorite feature. Define routes on the server and the client automatically gets full type hints:

```typescript
// server
import { defineRoute, defineRoutes, Type } from 'vafast'

// define routes (using as const to preserve literal types)
export const routeDefinitions = [
  defineRoute({
    method: 'POST',
    path: '/login',
    schema: {
      body: Type.Object({ email: Type.String(), password: Type.String() })
    },
    handler: ({ body }) => ({ token: 'xxx', user: { id: '1', email: body.email } })
  })
] as const

// create the server
export const routes = defineRoutes(routeDefinitions)
export type AppRoutes = typeof routeDefinitions
```

```typescript
// client
import { eden, InferEden } from '@vafast/api-client'
import type { AppRoutes } from './server'

// types inferred automatically
type Api = InferEden<AppRoutes>
const api = eden<Api>('http://localhost:3000')

// full type hints ✅
const { data } = await api.login.post({ 
  email: 'test@example.com',  // required, with hints
  password: '123456'          // required, with hints
})
console.log(data?.token)  // typed as string ✅
```

**No API docs to write, no manual type syncing, no code generation.**

### 4. Performance: 1.8x Faster than Express

| Framework | RPS | Relative performance |
|------|-----|----------|
| Elysia | ~118K | 100% |
| **Vafast** | **~101K** | **86%** |
| Hono | ~56K | 47% |
| Express | ~56K | 48% |

> Test environment: Bun 1.2.20, macOS, wrk (4 threads, 100 connections, 30s)

Vafast achieves high performance through these optimizations:
- **JIT-compiled validators**: schema validators are compiled once and cached for later calls
- **Radix tree routing**: route matching in O(k) time
- **Optimized request parsing**: query/cookie parsing 2x faster than standard methods

### 5. Write Once, Run Anywhere

Vafast is built on the standard Web Fetch API, so the same code runs on:

```typescript
// Bun
export default { port: 3000, fetch: server.fetch }

// Cloudflare Workers
export default { fetch: server.fetch }

// Node.js
import { serve } from 'vafast'
serve({ fetch: server.fetch, port: 3000 })
```

## Getting Started

### Installation

```bash
npm install vafast
```

### Minimal Example

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => ({ message: 'Hello Vafast!' })
  })
])

const server = new Server(routes)
export default { port: 3000, fetch: server.fetch }
```

## Built-in Format Validation

Vafast ships 30+ common format validators, ready to use:

```typescript
const UserSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  phone: Type.String({ format: 'phone' }),      // Chinese mobile number
  website: Type.String({ format: 'url' }),
  avatar: Type.String({ format: 'uuid' }),
  birthday: Type.String({ format: 'date' }),
})
```

## Error Handling

Vafast provides a semantic error API:

```typescript
import { err } from 'vafast'

throw err.badRequest('Invalid parameters')   // 400
throw err.unauthorized('Please log in first')   // 401
throw err.forbidden('Forbidden')        // 403
throw err.notFound('Resource not found')     // 404
throw err.conflict('Data conflict')       // 409
throw err.internal('Server error')     // 500
```

## Summary

Vafast isn't trying to replace every framework; it offers a **structured, clear and controllable** way to develop.

If you:
- are tired of hunting for routes in chained calls
- have had enough of types getting lost across files
- want a better team collaboration experience

then Vafast is worth a try.

```bash
npx create-vafast-app my-app
cd my-app
npm run dev
```

</Blog>
