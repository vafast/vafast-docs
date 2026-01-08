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
import { createHandler, Type } from 'vafast'

// 使用 createHandler 创建类型安全的处理器
const getUser = createHandler(
  { params: Type.Object({ id: Type.String() }) },
  ({ params }) => {
    const id = params.id
    return `User ID: ${id}`
  }
)
```

</template>

<template v-slot:type-2>

```typescript twoslash
import { createHandler, Type } from 'vafast'

// Schema 验证 + 类型推断
const createProfile = createHandler(
  { body: Type.Object({ name: Type.String(), age: Type.Number() }) },
  ({ body }) => {
    const name = body.name
    return { success: true, data: body }
  }
)
```

</template>

<template v-slot:type-3>

```typescript twoslash
import { createHandler, err } from 'vafast'

// 自动响应转换：对象 -> JSON，字符串 -> text/plain
const getProfile = createHandler((ctx) => {
  const req = ctx.req
  if(Math.random() > .5) {
    throw err.unauthorized('Unauthorized')
  }
  return { message: 'OK' }
})
```

</template>

<template v-slot:type-4>

```typescript twoslash
import { createHandlerWithExtra, Type } from 'vafast'

// 带中间件注入的额外上下文
type AuthContext = { user: { id: string; role: string } }

const adminHandler = createHandlerWithExtra<AuthContext>(
  { body: Type.Object({ action: Type.String() }) },
  ({ body, user }) => {
    const role = user.role
    return { success: true, userId: user.id }
  }
)
```

</template>

<template v-slot:easy>

```typescript twoslash
import { Server, defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello World')
  },
  {
    method: 'GET',
    path: '/json',
    handler: createHandler(() => ({ message: 'Hello World' }))
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:doc>

```typescript twoslash
import { Server, defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello Vafast')
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:e2e-type-safety>

```typescript twoslash
import { Server, defineRoutes, createHandler, Type, err } from 'vafast'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/profile',
    handler: createHandler(
      { body: Type.Object({ age: Type.Number() }) },
      ({ body }) => {
        // body.age 自动类型推断为 number
        if(body.age < 18) {
          throw err.badRequest('年龄不足')
        }
        return { success: true, data: body }
      }
    )
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

</template>

<template v-slot:e2e-server>

```typescript twoslash
import { Server, defineRoutes, createHandler, Type, err } from 'vafast'

const routes = defineRoutes([
  {
    method: 'PATCH',
    path: '/profile',
    handler: createHandler(
      { body: Type.Object({ age: Type.Number() }) },
      ({ body }) => {
        if (body.age < 18)
          throw err.badRequest('年龄不足')
        return { success: true, data: body }
      }
    )
  }
])

const server = new Server(routes)
// 导出类型供客户端使用
export type AppRoutes = typeof routes
```

</template>

<template v-slot:e2e-client>

```typescript twoslash
import { eden, type InferEden } from '@vafast/api-client'
import { defineRoutes, createHandler, Type } from 'vafast'

// 从服务端路由推断类型（实际项目中 import type { AppRoutes } from './server'）
const routes = defineRoutes([
  {
    method: 'PATCH',
    path: '/profile',
    handler: createHandler(
      { body: Type.Object({ age: Type.Number() }) },
      ({ body }) => ({ success: true, data: body })
    )
  }
])

type Api = InferEden<typeof routes>
const api = eden<Api>('https://api.example.com')

// 完整类型提示 + 自动补全
const { data } = await api.profile.patch({
  age: 21
})
```

</template>

<template v-slot:test-code>

```typescript twoslash
// @errors: 2345
import { eden, type InferEden } from '@vafast/api-client'
import { defineRoutes, createHandler, Type } from 'vafast'

const routes = defineRoutes([
  {
    method: 'PUT',
    path: '/user',
    handler: createHandler(
      { body: Type.Object({ username: Type.String(), password: Type.String() }) },
      ({ body }) => ({ success: true, message: '用户创建成功' })
    )
  }
])

type Api = InferEden<typeof routes>
const api = eden<Api>('http://localhost:3000')

// ❌ 缺少 password 字段 → 编译时报错
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
