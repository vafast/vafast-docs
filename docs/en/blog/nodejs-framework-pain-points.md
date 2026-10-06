---
title: 10 Pain Points of Node.js Frameworks, and More Elegant Solutions
description: 'A roundup of 10 common pain points in Node.js frameworks such as Express, Koa, Fastify, Hono and Elysia, and how Vafast solves them elegantly with declarative routing and type safety.'
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../../components/blog/Layout.vue'
</script>

<Blog
title="10 Pain Points of Node.js Frameworks, and More Elegant Solutions"
src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80"
alt="Analysis of Node.js framework pain points"
author="vafast"
date="January 2025"
>

> Express, Koa, Fastify, Hono, Elysia... after using so many frameworks, some things still hurt. This post collects 10 common pain points in Node.js framework development, and how a declarative approach solves them elegantly.

## Pain Point 1: Scattered Routes Make Finding an Endpoint a Needle-in-a-Haystack Hunt

### The Express / Koa / Hono Way

```typescript
// Express
app.get('/users', getUsers)
app.post('/users', createUser)
app.get('/users/:id', getUser)
// 50 lines later...
app.get('/posts', getPosts)
// 100 lines later...
app.get('/comments', getComments)
// want to know which endpoints the project has? keep scrolling...
```

### The Vafast Way

```typescript
const routes = defineRoutes([
  defineRoute({ method: 'GET',    path: '/users',     handler: getUsers }),
  defineRoute({ method: 'POST',   path: '/users',     handler: createUser }),
  defineRoute({ method: 'GET',    path: '/users/:id', handler: getUser }),
  defineRoute({ method: 'GET',    path: '/posts',     handler: getPosts }),
  defineRoute({ method: 'GET',    path: '/comments',  handler: getComments }),
])
```

**Routes are just an array, so every endpoint is visible at a glance.**

## Pain Point 2: Confusing Middleware Scope

### The Express Way

```typescript
app.use(cors())  // global?
app.use('/api', authMiddleware)  // applies to all of /api/*
app.get('/api/users', getUsers)  // has auth
app.get('/api/public', getPublic)  // also has auth? didn't want that!
```

### The Vafast Way

```typescript
const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/public', handler: publicHandler }),
  defineRoute({ method: 'GET', path: '/api/users', middleware: [authMiddleware], handler: getUsers }),
])
```

**Middleware is declared right on the route, so you can see it at a glance.**

## Pain Point 3: Type Inference Is Lost Across Files

### Hono's Type Problem

```typescript
// app.ts
type Env = { Variables: { user: { id: string } } }
const app = new Hono<Env>()

// routes.ts - types lost
export function setupRoutes(app: Hono) {
  app.get('/profile', (c) => {
    const user = c.get('user')  // ❌ type is unknown
  })
}
```

### The Vafast Way

```typescript
// handlers/profile.ts
import { defineRoute, defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware<AuthContext>(async (req, next) => {
  const user = await verifyToken(req.headers.get('Authorization'))
  return await next({ user })
})

export const getProfileRoute = defineRoute({
  method: 'GET',
  path: '/profile',
  middleware: [authMiddleware],
  handler: ({ user }) => {
    // ✅ user is fully typed
    return { profile: user }
  }
})
```

> **Notes on the new framework API**:
> - Define typed middleware with `defineMiddleware`
> - Pass context via `next({ user })`
> - Handlers get type inference automatically

**Types follow the handler, not the app instance.**

## Pain Point 4: Everyone Handles Errors Differently

### The Problem

Every team member returns errors in a different format: `{ message }` / `{ error }` / `{ code, msg }`

### The Vafast Way

```typescript
throw err.notFound('User not found')
// unified response: { "error": "NOT_FOUND", "message": "User not found" }
```

**A semantic error API with a unified response format.**

## Pain Point 5: Validation and Types Are Two Separate Sets of Logic

### Express + Zod

```typescript
const schema = z.object({ name: z.string() })
app.post('/users', (req, res) => {
  const result = schema.safeParse(req.body)  // manual validation
  if (!result.success) return res.status(400).json(...)
})
```

### The Vafast Way

```typescript
import { defineRoute, Type } from 'vafast'

const createUserRoute = defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: Type.Object({ name: Type.String() }) },
  handler: ({ body }) => {
    // automatic validation + automatic type inference
    return { id: crypto.randomUUID(), ...body }
  }
)
```

**Define the schema once; validation and type inference happen automatically.**

## Pain Point 6: Tedious Response Handling

### Express

```typescript
res.json(users)  // must be called manually
res.status(201).json(user)  // status codes set manually
```

### Vafast

```typescript
return users  // converted to JSON automatically
return json(user, 201)  // custom status code
```

**Just return; the framework handles the rest.**

## Pain Point 7: Switching Runtimes Means Changing Code

Express only runs on Node.js, and Elysia only runs on Bun.

### Vafast

```typescript
// the same code
export default { fetch: server.fetch }  // Bun / Workers
serve({ fetch: server.fetch })  // Node.js
```

**Built on web standards: write once, run anywhere.**

## Pain Point 8: Nested Routes Are Verbose

### Express

```typescript
const userRouter = express.Router()
const postRouter = express.Router()
userRouter.use('/:id/posts', postRouter)
app.use('/api/users', userRouter)
```

### Vafast

```typescript
const routes = defineRoutes([
  defineRoute({
    path: '/api/users',
    children: [
      defineRoute({ method: 'GET', path: '/', handler: getUsers }),
      defineRoute({ path: '/:id/posts', children: [...] }),
    ],
  }),
])
```

**Declarative nesting with a clear hierarchy.**

## Pain Point 9: You Have to Write Format Validation Yourself

### Zod

```typescript
const phone = z.string().regex(/^1[3-9]\d{9}$/)  // written every time
```

### Vafast

```typescript
Type.String({ format: 'phone' })  // 30+ built-in formats
```

## Pain Point 10: No Type Hints When the Frontend Calls the API

### The Traditional Way

Frontend and backend each maintain their own types, which easily drift apart.

### Vafast + @vafast/api-client

```typescript
type Api = InferEden<typeof routes>
const api = eden<Api>('http://localhost:3000')
const { data } = await api.login.post({ email, password })
// full type hints, synced automatically
```

## Full Comparison Table

| Pain point | Express | Hono | Elysia | Vafast |
|------|---------|------|--------|--------|
| Route readability | ❌ | ❌ | ❌ | ✅ |
| Middleware control | ❌ | ❌ | ⚠️ | ✅ |
| Cross-file types | ❌ | ❌ | ⚠️ | ✅ |
| Error format | ❌ | ❌ | ⚠️ | ✅ |
| Cross-runtime | ❌ | ✅ | ❌ | ✅ |
| Built-in formats | ❌ | ❌ | ⚠️ | ✅ |
| Frontend/backend type sync | ❌ | ❌ | ⚠️ | ✅ |

## Try It Now

```bash
npx create-vafast-app my-app
cd my-app
npm run dev
```

**If these pain points have bothered you too, give Vafast a try.**

</Blog>
