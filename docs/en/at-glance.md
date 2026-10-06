---
title: 'Introduction to Vafast: A High-Performance, Type-Safe TypeScript Web Framework'
description: 'Learn about the design philosophy, core features, performance and architecture of Vafast: a high-performance, end-to-end type-safe TypeScript web framework for Node.js and Bun.'
---

<script setup>
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'
import Playground from '../components/nearl/playground.vue'
</script>

# Introduction to Vafast

Vafast is more than a framework. It is a development philosophy built on **structure, clarity and control**.

## The Vafast Philosophy

<div class="philosophy-grid">

### Structure is Truth <span class="tag">Structure is Truth</span>
Your API is defined by code, not by behavior. No decorators, no magic.

```typescript
// What you see is what you get
const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users/:id', handler: getUser })
])
```

### Errors are Data <span class="tag">Errors are Data</span>
Errors carry a status, a type and visibility. Not chaos, but a contract.

```typescript
throw err.notFound('Resource not found')  // 404 + semantic type
```

### Composition Matters <span class="tag">Composition Matters</span>
Middleware is composed explicitly, with a clear, controllable execution order and no global pollution.

```typescript
defineRoute({
  path: '/admin',
  middleware: [auth, log],
  children: [
    defineRoute({ method: 'GET', path: '/dashboard', handler: dashboard })
  ]
})
```

### Multi-Runtime <span class="tag">Multi-Runtime</span>
Runs on Node.js, Bun, Deno, Workers and other runtimes.

```typescript
export default { port: 3000, fetch: server.fetch }
```

### No Boilerplate <span class="tag">No Boilerplate</span>
A single file is enough to run. Optional CLI scaffold: `npx create-vafast-app`

</div>

<style>
.philosophy-grid h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.philosophy-grid .tag {
  font-size: 0.75rem;
  font-weight: normal;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
</style>

## Core Features

- ✅ **Structure-first routing** — define your entire API with declarative objects; what you see is what you get
- ✅ **Composable middleware** — explicit composition, no decorators, no global pollution
- ✅ **Structured responses** — a unified `{ data, status }` format; errors are data too
- ✅ **Built-in response helpers** — `json()`, `html()`, `text()` and more, simple and consistent
- ✅ **SSE streaming** — declare with `sse: true`, ideal for AI chat, progress updates and similar cases
- ✅ **Middleware type injection** — `defineMiddleware` + `withContext` support context type inference
- ✅ **Structured errors** — `err()` / `VafastError` with an automatic `errorHandler`
- ✅ **Multi-runtime** — supports Node.js, Bun, Deno, Workers and more
- ✅ **No boilerplate** — one file is enough to run; optionally start fast with `npx create-vafast-app`
- ✅ **Type safety** — routes, handlers and responses are all inferred by TypeScript

## Technical Highlights

- **Very high performance**: about **1.8x** faster than Express/Hono, reaching ~101K reqs/s
- **JIT-compiled validators**: schema validators are compiled and cached; 10,000 validations take only ~5ms
- **Radix tree routing**: efficient route matching in O(k) time
- **Fast request parsing**: optimized query/cookie parsing, 2x faster than the standard approach
- **Type safety**: full TypeScript support and automatic type inference
- **Flexible middleware**: composable middleware architecture, global and per-route
- **Zero config**: works out of the box, no complex configuration

Here is a simple hello world example in Vafast.

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast'
  }),
  defineRoute({
    method: 'GET',
    path: '/user/:id',
    handler: ({ params }) => ({
      userId: params.id
    })
  }),
  defineRoute({
    method: 'POST',
    path: '/form',
    handler: ({ body }) => ({
      success: true,
      data: body
    })
  })
])

const server = new Server(routes)

// Start on Node.js
serve({ fetch: server.fetch, port: 3000 })

// Or export it for Bun/Workers
// export default { fetch: server.fetch }
```

Open [localhost:3000](http://localhost:3000/) and you should see 'Hello Vafast'.

::: tip
This simple example shows the basics of Vafast. In a real project you can add more routes and middleware as needed.
:::

## Performance

Thanks to a number of core optimizations, Vafast delivers excellent performance:

| Framework | RPS | Relative performance |
|------|-----|----------|
| **Vafast** | **~101K** | **100%** |
| Fastify | ~66K | 65% |
| Hono | ~56K | 55% |
| Express | ~56K | 55% |

> Test environment: Bun 1.2.20, macOS, wrk benchmark (4 threads, 100 connections, 30s)

### Performance Techniques

- **JIT-compiled validators**: TypeBox schemas are compiled once and cached, avoiding repeated compilation
- **Fast request parsing**: optimized functions such as `parseQueryFast` and `getCookie`, 2x faster than the standard approach
- **Radix tree routing**: efficient route matching in O(k) time
- **Lightweight middleware**: flexible middleware architecture, global and per-route

## TypeScript

Vafast is designed to help you write less TypeScript.

With complete type definitions and type inference, Vafast lets you:

- Get full type safety
- Write fewer type annotations
- Enjoy a better developer experience
- Avoid runtime type errors

## Architecture

Vafast uses a modern architecture:

### Route-Driven
- Clear route configuration
- Nested route support
- Flexible parameter handling
- Automatic route conflict detection

### Middleware System
- Composable middleware
- Async support
- Error handling
- Global and per-route middleware

### Type Safety
- Full TypeScript support
- Automatic type inference
- Compile-time error checking
- Schema validation support

### High-Performance Routing
- Smart path matching algorithm
- Route specificity ordering
- Flattened nested routes
- Optimized middleware chain

## Next Steps

1. [Quick Start](/en/quick-start) — Hello + Schema + request types + middleware
2. [Tutorial](/en/tutorial) — build a notes API step by step
3. [Key Concepts](/en/key-concept) — understand how a request flows through the framework

If you have questions, feel free to ask on [GitHub Issues](https://github.com/vafast/vafast/issues).
