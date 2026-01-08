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
    //    ^?
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
    //    ^?
    return { success: true, data: body }
  }
)
```

</template>

<template v-slot:type-3>

```typescript twoslash
import { createHandler } from 'vafast'

// 自动响应转换：对象 -> JSON，字符串 -> text/plain
const getProfile = createHandler((ctx) => {
  const req = ctx.req
  //    ^?
  if(Math.random() > .5) {
    throw new VafastError('Unauthorized', { status: 401, expose: true })
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
    //    ^?
    return { success: true, userId: user.id }
  }
)
```

</template>

<template v-slot:easy>

```typescript
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

```typescript
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

```typescript
import { Server, defineRoutes, createHandler, Type } from 'vafast'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/profile',
    handler: createHandler(
      { body: Type.Object({ age: Type.Number() }) },
      ({ body }) => {
        // body.age 自动类型推断为 number
        if(body.age < 18) {
          throw new VafastError('年龄不足', { status: 400, expose: true })
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

<template v-slot:test-code>

```typescript
import { Server, defineRoutes, createHandler, Type } from 'vafast'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/user',
    handler: createHandler(
      { body: Type.Object({ username: Type.String(), password: Type.String() }) },
      ({ body }) => {
        // body.username 和 body.password 自动类型安全
        if(body.username === 'mika') {
          throw new VafastError('用户名已被占用', { status: 400, expose: true })
        }
        return { success: true, message: '用户创建成功' }
      }
    )
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
