---
title: 教程 - Vafast
prev:
  text: '快速入门'
  link: '/quick-start'
next:
  text: '核心概念'
  link: '/key-concept'
---

<script setup>
import Card from './components/nearl/card.vue'
import Deck from './components/nearl/card-deck.vue'
</script>

# 教程

跟着做一个 **内存版笔记 API**。没有数据库、没有生产鉴权——目标是把 Vafast 的主干用法走通，大约 15–20 分钟。

若已完成 [快速入门](/quick-start)，可跳过「设置」，从「第一步」开始。

### 来自其他框架？

<Deck>
    <Card title="From Express" href="/migrate/from-express">Express → Vafast</Card>
    <Card title="From Fastify" href="/migrate/from-fastify">Fastify → Vafast</Card>
    <Card title="From Hono" href="/migrate/from-hono">Hono → Vafast</Card>
    <Card title="From Elysia" href="/migrate/from-elysia">Elysia → Vafast</Card>
</Deck>

---

## 设置

```bash
npx create-vafast-app
cd hi-vafast
npm install
npm run dev
```

确认 [http://localhost:3000](http://localhost:3000) 能打开后继续。

---

## 第一步：读接口

先把逻辑写在 `src/index.ts`，只做查询，跑通再加写入。

```typescript
import { Server, defineRoute, defineRoutes, serve, err } from 'vafast'

interface Note {
  id: string
  title: string
  content: string
}

const notes: Note[] = [
  { id: '1', title: '欢迎', content: '这是第一条笔记' },
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
      if (!note) throw err.notFound('笔记不存在')
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
curl http://localhost:3000/notes/missing   # 应返回 404 JSON
```

::: tip 先记住两件事
1. **叶子路由** = `method` + `path` + `handler`
2. 业务错误用 `throw err.notFound(...)`，框架会转成 JSON 响应
:::

---

## 第二步：Schema + 创建接口

用 `Type` 声明请求体。校验失败自动 422，`body` 在 handler 里已有正确类型：

```typescript
import { Server, defineRoute, defineRoutes, serve, Type, err } from 'vafast'

const NoteBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

// ... notes 数组同上，可清空预置数据

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
      if (!note) throw err.notFound('笔记不存在')
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
  -d '{"title":"第一篇","content":"你好"}'
```

更多写法见 [验证](/essential/validation)。

---

## 第三步：拆成路由文件

单文件会很快变长。约定：**入口只管启动，路由按域拆文件**。

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
      if (!note) throw err.notFound('笔记不存在')
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

行为与第二步相同，只是结构更清晰。

---

## 第四步：用路由组组织路径

当 `/notes`、`/notes/:id`、`/notes`（POST）越来越多时，可用 **路由组** 共享前缀：

| 类型 | 特征 | 作用 |
|------|------|------|
| 叶子 | 有 `method` + `handler` | 真正的接口 |
| 路由组 | **无** `method`，有 `children` | 路径前缀 + 共享中间件 |

把叶子提成常量，再挂到组上：

```typescript
// src/routes/notes.ts
import { defineRoute, defineRoutes, Type, err } from 'vafast'

// ... Note、notes、NoteBody 同上

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
    if (!note) throw err.notFound('笔记不存在')
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
    path: '/notes', // 无 method → 路由组
    children: [listHandler, getOneHandler, createHandler],
  }),
])
```

实际路径仍是 `GET /notes`、`GET /notes/:id`、`POST /notes`。子路由写相对路径即可。

---

## 第五步：加一层中间件

中间件有三层：

| 层级 | 写法 | 范围 |
|------|------|------|
| 全局 | `server.use(mw)` | 全部路由（CORS、请求 ID） |
| 路由组 | `defineRoute({ path, middleware, children })` | 该组子路由（最常用） |
| 叶子 | `defineRoute({ method, middleware, handler })` | 单接口 |

### 组级日志（最简单）

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
    middleware: [logMiddleware], // children 全部继承
    children: [listHandler, getOneHandler, createHandler],
  }),
])
```

### 注入上下文：`next({ ... })` → handler

中间件不只做旁路逻辑，还可以把数据传给 handler：

```typescript
import { defineMiddleware, defineRoute, defineRoutes, err } from 'vafast'

const fakeAuth = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('请先登录')
  // 注入的字段会出现在同路由 handler 参数里，且有类型
  return next({ userId: 'demo-user' })
})

const createHandler = defineRoute({
  method: 'POST',
  path: '/',
  middleware: [fakeAuth], // 叶子上挂：类型可自动推断
  schema: { body: NoteBody },
  handler: ({ body, userId }) => {
    // userId: string ← 来自 fakeAuth
    return { id: String(Date.now()), userId, ...body }
  },
})
```

### 跨 `children` 时：用 `withContext`

父级组挂中间件、子路由拆成常量时，TypeScript 推不出父级注入的字段。用 `withContext` 做**纯类型包装**（零运行时开销）：

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
    middleware: [fakeAuth], // 运行时注入 userId
    children: [createHandler], // 类型靠 withContext 接上
  }),
])
```

::: tip 组级中间件的类型
叶子拆到 `children`、或多文件复用同一套上下文时，用 [`withContext`](/essential/best-practice#9-用-withcontext-封装类型安全路由) 封装路由定义器。嵌套路由与中间件分层见 [§2](/essential/best-practice#2-嵌套路由)、[§3](/essential/best-practice#3-中间件怎么挂)；声明式参数见 [§8](/essential/best-practice#8-路由可以加参数声明式元数据)。自建 JWT 见 [@vafast/jwt](/middleware/jwt)。
:::

---

## 你现在可以做什么

```typescript
// 叶子 + Schema
const createHandler = defineRoute({
  method: 'POST',
  path: '/',
  schema: { body: NoteBody },
  handler: ({ body }) => { /* ... */ },
})

// 组 + 中间件
export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    middleware: [logMiddleware],
    children: [listHandler, createHandler],
  }),
])

// 入口 + 全局中间件
const server = new Server(notesRoutes)
server.use(/* cors 等 */)
serve({ fetch: server.fetch, port: 3000 })
```

对照检查：

- [x] 叶子路由与路由组
- [x] `Type` + `schema` 校验
- [x] `throw err.*`
- [x] 按文件拆路由
- [x] 组级 / 叶子中间件
- [x] `next({ ... })` 注入上下文
- [x] `withContext` 跨 children 类型衔接

---

## 下一步

1. [最佳实践](/essential/best-practice) — 目录约定、`withContext`、启动配置  
2. [核心概念](/key-concept) — 请求如何穿过框架  
3. [路由指南](/routing) — 更完整的嵌套与匹配规则  
4. [中间件](/middleware) — `defineMiddleware` 细节  
5. 需要流式输出时看 [SSE](/essential/sse)；上线看 [部署](/patterns/deploy)
