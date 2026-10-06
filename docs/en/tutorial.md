---
title: Tutorial - Vafast
description: 'Step-by-step Vafast tutorial: build a notes API in TypeScript with routes, schema validation, route groups, middleware and the type-safe API client.'
prev:
  text: 'Quick Start'
  link: '/quick-start'
next:
  text: 'Key Concepts'
  link: '/key-concept'
---

<script setup>
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'
</script>

# Tutorial

Let's build an **in-memory notes API**. No database and no production auth: the goal is to walk through the core of Vafast in about 15–20 minutes.

If you've already finished the [Quick Start](/en/quick-start), skip "Setup" and start from "Step 1".

### Coming from another framework?

<Deck>
    <Card title="From Express" href="/en/migrate/from-express">Express → Vafast</Card>
    <Card title="From Fastify" href="/en/migrate/from-fastify">Fastify → Vafast</Card>
    <Card title="From Hono" href="/en/migrate/from-hono">Hono → Vafast</Card>
    <Card title="From Elysia" href="/en/migrate/from-elysia">Elysia → Vafast</Card>
</Deck>

---

## Setup

```bash
npx create-vafast-app
cd hi-vafast
npm install
npm run dev
```

Make sure [http://localhost:3000](http://localhost:3000) opens before you continue.

---

## Step 1: Read Endpoints

Start by writing the logic in `src/index.ts`. Only implement reads for now; add writes once it runs.

```typescript
import { Server, defineRoute, defineRoutes, serve, err } from 'vafast'

interface Note {
  id: string
  title: string
  content: string
}

const notes: Note[] = [
  { id: '1', title: 'Welcome', content: 'This is the first note' },
]

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/notes',
    handler: () => notes,
  }),
  defineRoute({
    method: 'GET',
    path: '/notes/:id',
    handler: ({ params }) => {
      const note = notes.find((n) => n.id === params.id)
      if (!note) throw err.notFound('Note not found')
      return note
    },
  }),
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('http://localhost:3000')
})
```

```bash
curl http://localhost:3000/notes
curl http://localhost:3000/notes/1
curl http://localhost:3000/notes/missing   # should return a 404 JSON
```

::: tip Two things to remember
1. **Leaf route** = `method` + `path` + `handler`
2. Throw business errors with `throw err.notFound(...)`; the framework turns them into JSON responses
:::

---

## Step 2: Schema + Create Endpoint

Declare the request body with `Type`. Validation failures return 422 automatically, and `body` is correctly typed inside the handler:

```typescript
import { Server, defineRoute, defineRoutes, serve, Type, err } from 'vafast'

const NoteBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

// ... same notes array as above; you can clear the seed data

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/notes',
    handler: () => notes,
  }),
  defineRoute({
    method: 'GET',
    path: '/notes/:id',
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
    handler: ({ params }) => {
      const note = notes.find((n) => n.id === params.id)
      if (!note) throw err.notFound('Note not found')
      return note
    },
  }),
  defineRoute({
    method: 'POST',
    path: '/notes',
    schema: { body: NoteBody },
    handler: ({ body }) => {
      const note: Note = {
        id: String(Date.now()),
        title: body.title,
        content: body.content,
      }
      notes.push(note)
      return note
    },
  }),
])
```

```bash
curl -X POST http://localhost:3000/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"First post","content":"Hello"}'
```

See [Validation](/en/essential/validation) for more patterns.

---

## Step 3: Split into Route Files

A single file grows quickly. Convention: **the entry file only starts the server; routes are split into files by domain**.

```
src/
  index.ts
  routes/
    notes.ts
```

```typescript
// src/routes/notes.ts
import { defineRoute, defineRoutes, Type, err } from 'vafast'

interface Note {
  id: string
  title: string
  content: string
}

const notes: Note[] = []

const NoteBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

export const notesRoutes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/notes',
    handler: () => notes,
  }),
  defineRoute({
    method: 'GET',
    path: '/notes/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: ({ params }) => {
      const note = notes.find((n) => n.id === params.id)
      if (!note) throw err.notFound('Note not found')
      return note
    },
  }),
  defineRoute({
    method: 'POST',
    path: '/notes',
    schema: { body: NoteBody },
    handler: ({ body }) => {
      const note: Note = {
        id: String(Date.now()),
        title: body.title,
        content: body.content,
      }
      notes.push(note)
      return note
    },
  }),
])
```

```typescript
// src/index.ts
import { Server, serve } from 'vafast'
import { notesRoutes } from './routes/notes'

const server = new Server(notesRoutes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('http://localhost:3000')
})
```

Behavior is the same as Step 2, just better structured.

---

## Step 4: Organize Paths with Route Groups

As `/notes`, `/notes/:id` and `/notes` (POST) multiply, use a **route group** to share a prefix:

| Type | Characteristics | Purpose |
|------|------|------|
| Leaf | Has `method` + `handler` | An actual endpoint |
| Route group | **No** `method`, has `children` | Path prefix + shared middleware |

Extract the leaves into constants, then attach them to the group:

```typescript
// src/routes/notes.ts
import { defineRoute, defineRoutes, Type, err } from 'vafast'

// ... Note, notes, NoteBody same as above

const listHandler = defineRoute({
  method: 'GET',
  path: '/',
  handler: () => notes,
})

const getOneHandler = defineRoute({
  method: 'GET',
  path: '/:id',
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: ({ params }) => {
    const note = notes.find((n) => n.id === params.id)
    if (!note) throw err.notFound('Note not found')
    return note
  },
})

const createHandler = defineRoute({
  method: 'POST',
  path: '/',
  schema: { body: NoteBody },
  handler: ({ body }) => {
    const note: Note = {
      id: String(Date.now()),
      title: body.title,
      content: body.content,
    }
    notes.push(note)
    return note
  },
})

export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes', // no method → route group
    children: [listHandler, getOneHandler, createHandler],
  }),
])
```

The actual paths are still `GET /notes`, `GET /notes/:id` and `POST /notes`. Child routes just use relative paths.

---

## Step 5: Add a Middleware Layer

Middleware can be attached at three levels:

| Level | How | Scope |
|------|------|------|
| Global | `server.use(mw)` | All routes (CORS, request ID) |
| Route group | `defineRoute({ path, middleware, children })` | The group's child routes (most common) |
| Leaf | `defineRoute({ method, middleware, handler })` | A single endpoint |

### Group-Level Logging (Simplest)

```typescript
import { defineMiddleware } from 'vafast'

const logMiddleware = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const res = await next()
  console.log(`${req.method} ${req.url} → ${res.status} (${Date.now() - start}ms)`)
  return res
})

export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    middleware: [logMiddleware], // inherited by all children
    children: [listHandler, getOneHandler, createHandler],
  }),
])
```

### Injecting Context: `next({ ... })` → handler

Middleware isn't just for side logic; it can also pass data to the handler:

```typescript
import { defineMiddleware, defineRoute, defineRoutes, err } from 'vafast'

const fakeAuth = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('Please log in first')
  // Injected fields appear in the handler params of the same route, fully typed
  return next({ userId: 'demo-user' })
})

const createHandler = defineRoute({
  method: 'POST',
  path: '/',
  middleware: [fakeAuth], // attached to the leaf: types are inferred automatically
  schema: { body: NoteBody },
  handler: ({ body, userId }) => {
    // userId: string ← from fakeAuth
    return { id: String(Date.now()), userId, ...body }
  },
})
```

### Across `children`: Use `withContext`

When the parent group carries the middleware and child routes are extracted into constants, TypeScript can't infer the fields injected by the parent. Use `withContext` as a **pure type wrapper** (zero runtime cost):

```typescript
import { withContext, defineRoute, defineRoutes } from 'vafast'

const defineAuthedRoute = withContext<{ userId: string }>()

const createHandler = defineAuthedRoute({
  method: 'POST',
  path: '/',
  schema: { body: NoteBody },
  handler: ({ body, userId }) => ({ id: '1', userId, ...body }),
})

export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    middleware: [fakeAuth], // injects userId at runtime
    children: [createHandler], // types are wired up by withContext
  }),
])
```

::: tip Types for group-level middleware
When leaves are moved into `children`, or several files share the same context, wrap your route definer with [`withContext`](/en/essential/best-practice#9-use-withcontext-to-wrap-type-safe-routes). For nested routes and middleware layering see [§2](/en/essential/best-practice#2-nested-routes) and [§3](/en/essential/best-practice#3-where-to-attach-middleware); for declarative parameters see [§8](/en/essential/best-practice#8-routes-can-carry-parameters-declarative-metadata). To roll your own JWT, see [@vafast/jwt](/en/middleware/jwt).
:::

---

## What You Can Do Now

```typescript
// Leaf + Schema
const createHandler = defineRoute({
  method: 'POST',
  path: '/',
  schema: { body: NoteBody },
  handler: ({ body }) => { /* ... */ },
})

// Group + middleware
export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    middleware: [logMiddleware],
    children: [listHandler, createHandler],
  }),
])

// Entry + global middleware
const server = new Server(notesRoutes)
server.use(/* cors, etc. */)
serve({ fetch: server.fetch, port: 3000 })
```

Checklist:

- [x] Leaf routes and route groups
- [x] `Type` + `schema` validation
- [x] `throw err.*`
- [x] Routes split by file
- [x] Group-level / leaf middleware
- [x] Injecting context with `next({ ... })`
- [x] Bridging types across children with `withContext`

---

## Next Steps

1. [Best Practices](/en/essential/best-practice) — directory conventions, `withContext`, startup config  
2. [Key Concepts](/en/key-concept) — how a request flows through the framework  
3. [Routing Guide](/en/routing) — fuller nesting and matching rules  
4. [Middleware](/en/middleware) — `defineMiddleware` in detail  
5. For streaming output see [SSE](/en/essential/sse); for going live see [Deployment](/en/patterns/deploy)
