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

```typescript twoslash
// @noErrors
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(({ params }) => {
      // params.id 类型安全
      return `ID: ${params.id}`
    }),
    params: Type.Object({
      id: Type.String()
    })
  }
])

export default { routes }
```

</template>

<template v-slot:type-2>

```typescript twoslash
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/profile',
    handler: createRouteHandler(async ({ body }) => {
      // body 类型安全
      return { success: true, data: body }
    }),
    body: Type.Object({
      name: Type.String(),
      age: Type.Number({ minimum: 0 })
    })
  }
])

export default { routes }
```

</template>

<template v-slot:type-3>

```typescript twoslash
// @noErrors
import { defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/profile',
    handler: createRouteHandler(() => {
      if(Math.random() > .5) {
        return { error: 'Unauthorized' }, { status: 401 }
      }
      return { message: 'OK' }
    }),
    responses: {
      200: { description: '成功' },
      401: { description: '未授权' }
    }
  }
])

export default { routes }
```

</template>

<template v-slot:type-4>

```typescript twoslash
// @noErrors
import { defineRoutes, createRouteHandler } from 'vafast'

// 自定义中间件
const authMiddleware = async (request: Request, next: () => Promise<Response>) => {
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
    handler: createRouteHandler(() => ({ message: 'Admin OK' }))
  }
])

export default { routes }
```

</template>

<template v-slot:easy>

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello World')
  },
  {
    method: 'GET',
    path: '/stream',
    handler: createRouteHandler(function* () {
      yield 'Hello'
      yield 'World'
    })
  }
])

export default { routes }
```

</template>

<template v-slot:doc>

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast')
  }
])

export default { routes }
```

</template>

<template v-slot:e2e-type-safety>

```typescript twoslash
// @noErrors
// @filename: server.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/profile',
    handler: createRouteHandler(async ({ body }) => {
      if(body.age < 18) {
        return { error: '年龄不足' }, { status: 400 }
      }
      return { success: true, data: body }
    }),
    body: Type.Object({
      age: Type.Number({ minimum: 0 })
    })
  }
])

export default { routes }

// @filename: client.ts
// ---cut---
// 客户端类型安全
const response = await fetch('/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ age: 21 })
})
```

</template>

<template v-slot:test-code>

```typescript twoslash
// @errors: 2345 2304
// @filename: index.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/user',
    handler: createRouteHandler(async ({ body }) => {
      if(body.username === 'mika') {
        return { 
          success: false,
          message: '用户名已被占用'
        }, { status: 400 }
      }

      return {
        success: true,
        message: '用户创建成功'
      }
    }),
    body: Type.Object({
      username: Type.String(),
      password: Type.String()
    })
  }
])

export default { routes }

// @filename: client.ts
// ---cut---
import { test, expect } from 'bun:test'

test('应处理重复用户', async () => {
  const response = await fetch('/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'mika' })
  })

  const data = await response.json()
  expect(data).toEqual({
    success: false,
    message: '用户名已被占用'
  })
})
```

</template>

<template v-slot:test-script>

```bash
$ bun test
```

</template>

</Fern>
