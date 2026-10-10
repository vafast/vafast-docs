---
title: 'Okayok Vafast — Type-Safe TypeScript Web Framework for Node.js & Bun'
description: 'Vafast is a fast, type-safe TypeScript web framework for Node.js, Bun and Workers, with declarative routing and schema validation: a Hono/Elysia alternative.'
titleTemplate: false
layout: page
sidebar: false

---

<script setup>
    import Fern from '../components/fern/fern.vue'
</script>

<Fern>

<template v-slot:type-1>

```typescript twoslash
import { defineRoute, Type } from 'vafast'

// Create a type-safe route with defineRoute
const getUser = defineRoute({
  method: 'GET',
  path: '/users/:id',
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: ({ params }) => {
    const id = params.id
    return `User ID: ${id}`
  }
})
```

</template>

<template v-slot:type-2>

```typescript twoslash
import { defineRoute, Type } from 'vafast'

// Schema validation + type inference
const createProfile = defineRoute({
  method: 'POST',
  path: '/profile',
  schema: { body: Type.Object({ name: Type.String(), age: Type.Number() }) },
  handler: ({ body }) => {
    const name = body.name
    return { success: true, data: body }
  }
})
```

</template>

<template v-slot:type-3>

```typescript twoslash
import { defineRoute, err } from 'vafast'

// Automatic response mapping: object -> JSON, string -> text/plain
const getProfile = defineRoute({
  method: 'GET',
  path: '/profile',
  handler: ({ req }) => {
    if(Math.random() > .5) {
      throw err.unauthorized('Unauthorized')
    }
    return { message: 'OK' }
  }
})
```

</template>

<template v-slot:type-4>

```typescript twoslash
import { defineRoute, defineMiddleware, Type } from 'vafast'

// Extra context injected by middleware
type AuthContext = { user: { id: string; role: string } }

const authMiddleware = defineMiddleware<AuthContext>(async (req, next) => {
  const user = { id: '123', role: 'admin' } // In practice, read from the token
  return next({ user })
})

const adminHandler = defineRoute({
  method: 'POST',
  path: '/admin/action',
  schema: { body: Type.Object({ action: Type.String() }) },
  middleware: [authMiddleware],
  handler: ({ body, user }) => {
    const role = user.role
    return { success: true, userId: user.id }
  }
})
```

</template>

<template v-slot:easy>

```typescript twoslash
import { Server, defineRoute, defineRoutes } from 'vafast'

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
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:doc>

```typescript twoslash
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast'
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:e2e-type-safety>

```typescript twoslash
import { Server, defineRoute, defineRoutes, Type, err } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/profile',
    schema: { body: Type.Object({ age: Type.Number() }) },
    handler: ({ body }) => {
      // body.age is automatically inferred as number
      if(body.age < 18) {
        throw err.badRequest('Too young')
      }
      return { success: true, data: body }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:e2e-server>

```typescript twoslash
import { Server, defineRoute, defineRoutes, Type, err } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'PATCH',
    path: '/profile',
    schema: { body: Type.Object({ age: Type.Number() }) },
    handler: ({ body }) => {
      if (body.age < 18)
        throw err.badRequest('Too young')
      return { success: true, data: body }
    }
  })
])

const server = new Server(routes)
// Export the type for the client
export type AppRoutes = typeof routes
```

</template>

<template v-slot:e2e-client>

```typescript twoslash
import { eden, createClient, type InferEden } from '@vafast/api-client'
import { defineRoute, defineRoutes, Type } from 'vafast'

// Define and handle routes
const routes = defineRoutes([
  defineRoute({
    method: 'PATCH',
    path: '/profile',
    schema: { body: Type.Object({ age: Type.Number() }) },
    handler: ({ body }) => ({ success: true, data: body })
  })
])

// ✅ Type inference just works, no `as const` needed!
type Api = InferEden<typeof routes>
const api = eden<Api>(createClient('https://api.example.com'))

// Full type hints + autocompletion
const { data } = await api.profile.patch({
  age: 21
})
```

</template>

<template v-slot:test-code>

```typescript twoslash
// @errors: 2345
import { eden, createClient, type InferEden } from '@vafast/api-client'
import { defineRoute, defineRoutes, Type } from 'vafast'

// Define and handle routes
const routes = defineRoutes([
  defineRoute({
    method: 'PUT',
    path: '/user',
    schema: { body: Type.Object({ username: Type.String(), password: Type.String() }) },
    handler: ({ body }) => ({ success: true, message: 'User created' })
  })
])

// ✅ Type inference just works
type Api = InferEden<typeof routes>
const api = eden<Api>(createClient('http://localhost:3000'))

// ❌ Missing password field → compile-time error
const { data } = await api.user.put({
  username: 'mika'
})
```

</template>

<template v-slot:test-script>

```bash
$ npm test
```

</template>

</Fern>
