---
title: Vafast 中文文档
titleTemplate: ':title - 高性能 TypeScript Web 框架'
layout: page
sidebar: false

---

<script setup>
    import Fern from './components/fern/fern.vue'
</script>

<Fern>

<template v-slot:type-1>

```typescript
import { Server, defineRoutes } from 'vafast'
import { Type } from '@sinclair/typebox'

interface TypedRequest extends Request {
  params: { id: string }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/id/:id',
    handler: (req) => {
      const { id } = (req as TypedRequest).params
      // params.id 类型安全
      return `ID: ${id}`
    }
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:type-2>

```typescript
import { Server, defineRoutes } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/profile',
    handler: async (req) => {
      const body = await req.json()
      // body 类型安全
      return { success: true, data: body }
    }
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:type-3>

```typescript
import { Server, defineRoutes } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/profile',
    handler: () => {
      if(Math.random() > .5) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      return { message: 'OK' }
    }
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:type-4>

```typescript
import { Server, defineRoutes, type Middleware } from 'vafast'

// 自定义中间件
const authMiddleware: Middleware = async (request, next) => {
  const auth = request.headers.get('authorization')
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }
  return next()
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/admin/check',
    middleware: [authMiddleware],
    handler: () => ({ message: 'Admin OK' })
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:easy>

```typescript
import { Server, defineRoutes } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  },
  {
    method: 'GET',
    path: '/json',
    handler: () => ({ message: 'Hello World' })
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:doc>

```typescript
import { Server, defineRoutes } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast'
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:e2e-type-safety>

```typescript
import { Server, defineRoutes } from 'vafast'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/profile',
    handler: async (req) => {
      const body = await req.json() as { age: number }
      if(body.age < 18) {
        return new Response(JSON.stringify({ error: '年龄不足' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      return { success: true, data: body }
    }
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:test-code>

```typescript
import { Server, defineRoutes } from 'vafast'

interface UserBody {
  username: string
  password: string
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/user',
    handler: async (req) => {
      const body = await req.json() as UserBody
      if(body.username === 'mika') {
        return new Response(JSON.stringify({ 
          success: false,
          message: '用户名已被占用'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }

      return {
        success: true,
        message: '用户创建成功'
      }
    }
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:test-script>

```bash
$ bun test
```

</template>

</Fern>
