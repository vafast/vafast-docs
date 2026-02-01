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
import { defineRoute, Type } from 'vafast'

// 使用 defineRoute 创建类型安全的路由
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

// Schema 验证 + 类型推断
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

// 自动响应转换：对象 -> JSON，字符串 -> text/plain
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

// 带中间件注入的额外上下文
type AuthContext = { user: { id: string; role: string } }

const authMiddleware = defineMiddleware<AuthContext>(async (req, next) => {
  const user = { id: '123', role: 'admin' } // 实际从 token 获取
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
      // body.age 自动类型推断为 number
      if(body.age < 18) {
        throw err.badRequest('年龄不足')
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
        throw err.badRequest('年龄不足')
      return { success: true, data: body }
    }
  })
])

const server = new Server(routes)
// 导出类型供客户端使用
export type AppRoutes = typeof routes
```

</template>

<template v-slot:e2e-client>

```typescript twoslash
import { eden, createClient, type InferEden } from '@vafast/api-client'
import { defineRoute, defineRoutes, Type } from 'vafast'

// 定义并处理路由
const routes = defineRoutes([
  defineRoute({
    method: 'PATCH',
    path: '/profile',
    schema: { body: Type.Object({ age: Type.Number() }) },
    handler: ({ body }) => ({ success: true, data: body })
  })
])

// ✅ 类型推断自动工作，无需 as const！
type Api = InferEden<typeof routes>
const api = eden<Api>(createClient('https://api.example.com'))

// 完整类型提示 + 自动补全
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

// 定义并处理路由
const routes = defineRoutes([
  defineRoute({
    method: 'PUT',
    path: '/user',
    schema: { body: Type.Object({ username: Type.String(), password: Type.String() }) },
    handler: ({ body }) => ({ success: true, message: '用户创建成功' })
  })
])

// ✅ 类型推断自动工作
type Api = InferEden<typeof routes>
const api = eden<Api>(createClient('http://localhost:3000'))

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
