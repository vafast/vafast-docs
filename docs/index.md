---
title: Vafast 中文文档
titleTemplate: ':title - 高性能 TypeScript Web 框架'
layout: page
sidebar: false
head:
    - - meta
      - property: 'og:title'
        content: Vafast 中文文档 - 高性能 TypeScript Web 框架

    - - meta
      - name: 'description'
        content: Vafast 是一个高性能、类型安全的 TypeScript Web 框架，专为现代 Web 应用设计。提供优秀的开发者体验、灵活的中间件系统、组件路由支持和完整的类型安全。

    - - meta
      - property: 'og:description'
        content: Vafast 是一个高性能、类型安全的 TypeScript Web 框架，专为现代 Web 应用设计。提供优秀的开发者体验、灵活的中间件系统、组件路由支持和完整的类型安全。
---

<script setup>
    import Fern from './components/fern/fern.vue'
</script>

<Fern>

<template v-slot:type-1>

```typescript twoslash
// @noErrors
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/id/:id',
    handler: (req: Request, params?: Record<string, string>) => {
      // params.id 类型安全
      return new Response(`ID: ${params?.id}`)
    }
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:type-2>

```typescript twoslash
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'POST',
    path: '/profile',
    handler: async (req: Request) => {
      const body = await req.json()
      // body 类型安全
      return new Response(JSON.stringify(body))
    },
    body: {
      // 可以定义 body 验证规则
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    }
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:type-3>

```typescript twoslash
// @noErrors
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/profile',
    handler: (req: Request) => {
      if(Math.random() > .5) {
        return new Response('Unauthorized', { status: 401 })
      }
      return new Response('OK')
    },
    responses: {
      200: { description: '成功' },
      401: { description: '未授权' }
    }
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:type-4>

```typescript twoslash
// @noErrors
import { Server } from 'vafast'

// 自定义中间件
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const auth = req.headers.get('authorization')
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }
  return next()
}

const routes: any[] = [
  {
    method: 'GET',
    path: '/admin/check',
    middleware: [authMiddleware],
    handler: () => new Response('Admin OK')
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:easy>

```typescript
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: () => new Response('Hello World')
  },
  {
    method: 'GET',
    path: '/stream',
    handler: function* () {
      yield 'Hello'
      yield 'World'
    }
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:doc>

```typescript
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: () => new Response('Hello Vafast')
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:e2e-type-safety>

```typescript twoslash
// @noErrors
// @filename: server.ts
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'POST',
    path: '/profile',
    handler: async (req: Request) => {
      const body = await req.json() as { age: number }
      if(body.age < 18) {
        return new Response('年龄不足', { status: 400 })
      }
      return new Response(JSON.stringify(body))
    },
    body: {
      type: 'object',
      properties: {
        age: { type: 'number' }
      }
    }
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }

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
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'POST',
    path: '/user',
    handler: async (req: Request) => {
      const body = await req.json() as { username: string; password: string }
      if(body.username === 'mika') {
        return new Response(JSON.stringify({
          success: false,
          message: '用户名已被占用'
        }), { status: 400 })
      }

      return new Response(JSON.stringify({
        success: true,
        message: '用户创建成功'
      }))
    },
    body: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' }
      }
    }
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }

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
