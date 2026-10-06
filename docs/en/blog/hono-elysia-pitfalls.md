---
title: 'Six Months with Hono and Elysia: The Pitfalls I Hit'
description: 'Lessons from six months with Hono and Elysia: real-world issues with type inference, middleware and runtime compatibility, and how to avoid them when choosing a TypeScript web framework.'
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../../components/blog/Layout.vue'
</script>

<Blog
title="Six Months with Hono and Elysia: The Pitfalls I Hit"
src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80"
alt="Pitfalls of the Hono and Elysia frameworks"
author="vafast"
date="January 2025"
>

> Hono and Elysia are the two hottest TypeScript web frameworks right now: one focuses on being lightweight and cross-platform, the other on raw performance. After six months with them, here are the pitfalls I ran into in real projects.

## Introduction

Bottom line first: **Hono and Elysia are both excellent frameworks**, with great performance and strong type support. But "excellent" doesn't mean "perfect", and in real projects some design choices will trip you up.

This post isn't meant to bash either framework; it's here to help you **avoid the pitfalls up front**.

## Part 1: Hono Pitfalls

### Pitfall 1: Wildcard Route Matching Is Unintuitive

```typescript
app.get('/api/*', handler)
// ✅ matches /api/users
// ❌ doesn't match /api

// want to match both? write it twice
app.get('/api', handler)
app.get('/api/*', handler)
```

### Pitfall 2: c.set() Types Must Be Declared Up Front

```typescript
// must be declared in the generic
type Env = { Variables: { user: User } }
const app = new Hono<Env>()

// across files it gets messy...
```

### Pitfall 3: Path Params Are Always Strings

```typescript
const id = c.req.param('id')  // always a string
const numId = parseInt(id)     // convert every time
```

### Pitfall 4: Validation Needs an Extra Package and Is Verbose

```typescript
import { zValidator } from '@hono/zod-validator'

app.post('/users',
  zValidator('json', schema),
  (c) => {
    const body = c.req.valid('json')  // you need .valid()
  }
)
```

### Pitfall 5: RPC Client Type Inference Has Gaps

```typescript
const res = await client.users.$get()
const data = await res.json()  // and you still call .json() manually
// POST body type inference is inaccurate
```

### Pitfall 6: Inconsistent Error Handling

HTTPException and directly returned responses have different formats, and teams end up without a standard.

## Part 2: Elysia Pitfalls

### Pitfall 1: Chains Get Too Long

```typescript
const app = new Elysia()
  .state('version', '1.0.0')
  .decorate('logger', new Logger())
  .derive(({ headers }) => ({ auth: headers.authorization }))
  .onBeforeHandle(...)
  .onAfterHandle(...)
  .get('/users', ...)
  .post('/users', ...)
  .listen(3000)

// 50 lines of chaining; finding a route takes forever
```

### Pitfall 2: Too Many Concepts

- `state` - global state
- `decorate` - inject utilities
- `derive` - derive per request
- `resolve` - derive after validation

Newcomers need a long time to understand them.

### Pitfall 3: Nested guard Hell

```typescript
.guard({}, app => app
  .guard({}, app => app
    .guard({}, app => app
      .post('/resource', handler)
    )
  )
)
// terrifying indentation levels
```

### Pitfall 4: Plugin Types Require use() on the Chain

You can't extract plugin configuration into a separate file for reuse.

### Pitfall 5: Type Inference Breaks When You Split Files

```typescript
// routes/users.ts
export const userRoutes = new Elysia()
  .get('/users', ({ db }) => {
    // ❌ db doesn't exist, because it was decorated on the main app
  })
```

### Pitfall 6: Bun Only

- ❌ Node.js
- ❌ Cloudflare Workers
- ❌ Vercel Edge
- ❌ AWS Lambda

Choosing Elysia locks you into a runtime.

### Pitfall 7: Error Handling Requires Understanding the Lifecycle

There are 7 lifecycle hooks, and you need the docs to figure out how they behave.

## Part 3: Solutions

### Working Around Hono

1. Wildcard routes: write them twice or use a regex
2. Type declarations: define a global Env type
3. Validation: use @hono/zod-validator

### Working Around Elysia

1. Long chains: split files and compose with .use()
2. Many concepts: invest time in learning them
3. Runtime lock-in: make sure your team supports Bun

### Or Consider Another Approach

**Declarative routing**:

```typescript
const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: getUsers }),
  defineRoute({ method: 'POST', path: '/users', handler: createUser, middleware: [auth] }),
])
```

**Advantages**:
- Routes are visible at a glance
- Middleware is declared explicitly
- Types don't get lost across files
- Not tied to a runtime

## Summary

| Framework | Strengths | Pitfalls |
|------|------|-----|
| **Hono** | Lightweight, cross-platform | Wildcard rules, verbose type declarations |
| **Elysia** | Top performance | Chaining hell, Bun lock-in |

**Recommendations**:

- Small projects → Hono
- Top performance + Bun → Elysia
- Large projects + clear structure → a declarative framework
- Cross-runtime → Hono or a declarative framework

**Are you using Hono or Elysia? What pitfalls have you hit? Let's talk!**

</Blog>
