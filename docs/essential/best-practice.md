---
title: 最佳实践 - Vafast
prev:
  text: '教程'
  link: '/tutorial'
---

# 最佳实践

本页默认你已走完 [教程](/tutorial)：会写叶子路由、Schema、`err`、路由组和中间件。

这里整理 **项目变大之后** 的约定：目录、嵌套路由、中间件分层、启动配置、声明式元数据、`withContext`、SSE 与测试。

## 1. 目录怎么放

框架不强制结构。路由变多时，推荐：

```
src/
  index.ts           # Server + 全局中间件 + serve
  routes/
    index.ts         # 汇总导出
    notes.ts
    users.ts
  services/          # 与 HTTP 无关的业务函数（可选）
  utils/
```

- **路由文件**：定义叶子，用 `children` 挂到资源组
- **入口**：只做组装与启动
- 也可以按功能模块拆（`modules/notes/{routes,service}`），原则一样：路由薄、逻辑可测

## 2. 嵌套路由

叶子 = `method` + `path` + `handler`；组 = 只有 `path` + `children`（可再嵌套）。组负责前缀与共享中间件，叶子负责具体接口。

```typescript
// routes/notes.ts
import { defineRoute, defineRoutes, Type, err } from 'vafast'
import { listNotes, getNote, createNote } from '../services/notes'

const NoteBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

const listHandler = defineRoute({
  method: 'GET',
  path: '/',
  handler: () => listNotes(),
})

const getOneHandler = defineRoute({
  method: 'GET',
  path: '/:id',
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: ({ params }) => {
    const note = getNote(params.id)
    if (!note) throw err.notFound('笔记不存在')
    return note
  },
})

const createHandler = defineRoute({
  method: 'POST',
  path: '/',
  schema: { body: NoteBody },
  handler: ({ body }) => createNote(body),
})

export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    name: '笔记',
    description: '笔记 API',
    children: [listHandler, getOneHandler, createHandler],
  }),
])
```

多级嵌套时，子路径写**相对路径**，最终 URL = 各级 `path` 拼接：

```typescript
export const apiRoutes = defineRoutes([
  defineRoute({
    path: '/api',
    children: [
      defineRoute({
        path: '/v1',
        children: [
          defineRoute({
            path: '/notes',
            children: [listHandler, getOneHandler, createHandler],
          }),
        ],
      }),
    ],
  }),
])
// → GET /api/v1/notes 、 GET /api/v1/notes/:id 、 POST /api/v1/notes
```

```typescript
// routes/index.ts
import { notesRoutes } from './notes'
import { usersRoutes } from './users'

export const allRoutes = [...notesRoutes, ...usersRoutes]
```

| 推荐 | 原因 |
|------|------|
| 叶子先定义为常量再放入 `children` | 文件可读，组级中间件好挂 |
| 子路径写相对路径（`/`、`/:id`） | 前缀由组统一提供 |
| 按资源拆文件，入口 `...allRoutes` | 多模块组合清晰 |
| 鉴权 / 日志挂在组上 | 同一资源下的叶子自动继承 |

### 统一 API 前缀（可选）

也可以在入口统一拼前缀（不必改每个文件）：

```typescript
const BASE_PATH = '/api'

const routesWithBasePath = allRoutes.map((route) => ({
  ...route,
  path: BASE_PATH + route.path,
}))

const server = new Server([
  defineRoute({ method: 'GET', path: '/', handler: () => ({ ok: true }) }),
  ...routesWithBasePath,
])
```

探活路由常放在无前缀的 `/`。更多规则见 [路由指南](/routing)。

## 3. 中间件怎么挂

中间件是洋葱模型，三层可叠加：

| 层级 | 写法 | 范围 | 典型用途 |
|------|------|------|----------|
| 全局 | `server.use(mw)` | 全部路由（含 404） | CORS、请求 ID、访问日志 |
| 路由组 | `defineRoute({ path, middleware, children })` | 该组及子孙 | 鉴权、租户、资源级日志 |
| 叶子 | `defineRoute({ method, middleware, handler })` | 单接口 | 权限守卫、限流、上传校验 |

执行顺序（由外到内）：**全局 → 父组 → 子组 → 叶子 → handler**，返回时反向。

```typescript
import { Server, defineRoute, defineRoutes, defineMiddleware, serve, err } from 'vafast'
import { cors } from '@vafast/cors'
import { requestId } from '@vafast/request-id'

const log = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const res = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} ${res.status} ${Date.now() - start}ms`)
  return res
})

const auth = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('请先登录')
  return next({ userId: 'u_1' })
})

const adminOnly = defineMiddleware(async (req, next) => {
  // 读上一层注入的上下文，或自行查库
  return next()
})

const routes = defineRoutes([
  // 公开
  defineRoute({
    method: 'GET',
    path: '/health',
    handler: () => ({ ok: true }),
  }),

  // 组级鉴权：/account/* 都要登录
  defineRoute({
    path: '/account',
    middleware: [auth],
    children: [
      defineRoute({
        method: 'GET',
        path: '/profile',
        handler: ({ userId }) => ({ userId }),
      }),
      // 叶子再加一层
      defineRoute({
        method: 'DELETE',
        path: '/profile',
        middleware: [adminOnly],
        handler: ({ userId }) => {
          console.log('delete', userId)
          return null
        },
      }),
    ],
  }),
])

const server = new Server(routes)
server.use(cors())
server.use(requestId())
server.use(log) // 全局：所有请求都打日志
```

| 推荐 | 原因 |
|------|------|
| 横切能力用全局 | 与业务路径无关 |
| 同一资源的鉴权用组级 | 少在每个叶子重复挂 |
| 个别接口的额外约束用叶子 | 权限差异一眼能看出来 |
| 用 `next({ ... })` 传上下文 | handler 直接拿字段；跨 `children` 见 §9 `withContext` |

官方包（按需安装）：[`@vafast/cors`](/middleware/cors)、[`@vafast/jwt`](/middleware/jwt)、[`@vafast/request-id`](/middleware/request-id)、[`@vafast/request-logger`](/middleware/request-logger) 等。机制详见 [中间件](/middleware)。

## 4. Schema 与类型同源

用 `Type` 做校验，用 `Static` 推断类型；不要用 class / interface 当请求模型。

```typescript
import { Type, type Static } from 'vafast'

export const NoteBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

export type NoteBody = Static<typeof NoteBody>
```

相关 schema 可收拢：

```typescript
export const NoteModel = {
  create: NoteBody,
  update: Type.Partial(NoteBody),
}
```

详见 [验证](/essential/validation)。

## 5. 错误用 `err.*`，服务不碰 HTTP

```typescript
import { err } from 'vafast'

if (!id) throw err.badRequest('参数错误')
if (!row) throw err.notFound('资源不存在')
if (!allowed) throw err.forbidden('无权限')
```

```typescript
// ❌ 服务里构造 Response
export function getNote(id: string) {
  if (!id) return new Response('Bad Request', { status: 400 })
}

// ✅ 服务返回数据或 null；路由决定是否 throw err
export function getNote(id: string) {
  return db.notes.findById(id)
}
```

## 6. 服务层：普通函数即可

与请求无关的逻辑抽成函数，便于单测：

```typescript
// services/notes.ts
import type { NoteBody } from '../models/note'

const notes: Array<NoteBody & { id: string }> = []

export function listNotes() {
  return notes
}

export function getNote(id: string) {
  return notes.find((n) => n.id === id)
}

export function createNote(input: NoteBody) {
  const note = { id: String(Date.now()), ...input }
  notes.push(note)
  return note
}
```

路由负责：校验、鉴权上下文、调用服务、映射 `err`。不必强行 MVC。

## 7. 启动与 `serve` 配置

入口只做组装：挂全局中间件（见 §3），再 `serve`：

```typescript
import { Server, serve, defineRoute } from 'vafast'
import { cors } from '@vafast/cors'
import { requestId } from '@vafast/request-id'
import { allRoutes } from './routes'

const server = new Server([
  defineRoute({ method: 'GET', path: '/', handler: () => ({ ok: true }) }),
  ...allRoutes,
])

server.use(cors())
server.use(requestId())

serve({
  fetch: server.fetch,
  port: 3000,
  hostname: '0.0.0.0',
  bodyLimit: 1024 * 1024,       // 默认 1MB；上传可调大，0 = 不限制
  timeout: { requestTimeout: 30_000 },
  gracefulShutdown: true,
  trustProxy: true,             // 反代后取真实 IP
})
```

### `serve()` 常用配置

| 选项 | 默认 | 作用 |
|------|------|------|
| `fetch` | （必填） | 通常传 `server.fetch` |
| `port` | `3000` | 监听端口 |
| `hostname` | `'0.0.0.0'` | 绑定地址 |
| `bodyLimit` | `1MB` | 请求体上限（字节）；超限 → 413；`0` 不限制 |
| `timeout.requestTimeout` | `0`（不限） | 单请求处理超时（毫秒）；超限 → 504 |
| `timeout.headersTimeout` | Node 默认 | 收齐请求头的超时 |
| `timeout.keepAliveTimeout` | Node 默认 | Keep-Alive 空闲超时 |
| `gracefulShutdown` | 关 | `true` 或对象：收 SIGTERM/SIGINT 后等请求结束再关 |
| `trustProxy` | `false` | 信任反代，从 `X-Forwarded-*` 取 IP；`request.ip` / `ips` |
| `onError` | — | Node 适配层未捕获错误时的兜底 |

| 场景 | 建议 |
|------|------|
| 纯 JSON API | `bodyLimit` 保持 1MB 或更小 |
| 文件上传 | `bodyLimit: 10 * 1024 * 1024` 等按业务调 |
| 前面有 Nginx / Ingress | 超时多交给代理；需要真实 IP 时开 `trustProxy` |
| 裸奔公网 | 设 `timeout.requestTimeout`（如 30–120s）防慢速 DoS |
| K8s / 容器 | `gracefulShutdown: true`（或设 `timeout`） |

完整字段与示例见 [API 参考 · serve()](/api#serve)。

## 8. 路由可以加参数：声明式元数据

### 理念

Vafast 的路由是**配置对象**，不只是 `method + path + handler`。

| 概念 | 含义 |
|------|------|
| 声明式 | 路由配置描述「这个端点能做什么、带什么能力」 |
| 单一数据源 | 元数据写在叶子上，和 handler 放一起；不另起 path→权限/计费 映射表 |
| 可查询 | 中间件、文档、Webhook 通过 `RouteRegistry` 读同一份配置 |
| 显式 | 行为开关写在路由上（如 `sse: true`），不靠隐式推断 |

路径上的 `:id`、`schema` 管的是**请求怎么进来**；路由上的参数管的是**端点自身的能力与策略**。

### 内置元信息

```typescript
defineRoute({
  method: 'POST',
  path: '/notes',
  name: 'create_note',           // 机器可读（文档、工具）
  description: '创建一条笔记',     // 人可读
  docs: { tags: ['notes'] },      // OpenAPI 等
  sse: true,                      // 显式声明 SSE（如需要）
  schema: { body: NoteBody },
  handler: ({ body }) => createNote(body),
})
```

### 业务扩展字段

任意自定义字段都会保留在扁平化后的路由上，常见用法：

```typescript
defineRoute({
  method: 'POST',
  path: '/notes',
  name: 'create_note',
  description: '创建一条笔记',
  webhook: true,                    // 写操作触发 Webhook
  permission: 'notes.create',       // 权限码
  // billing: { price: 0.01 },     // 按需：计费、审计等
  schema: { body: NoteBody },
  handler: ({ body }) => createNote(body),
})
```

中间件用 `getRouteRegistry()` 按当前请求查元数据，而不是硬编码路径：

```typescript
import { defineMiddleware, getRouteRegistry, err } from 'vafast'

const requirePermission = defineMiddleware(async (req, next) => {
  const route = getRouteRegistry().get(req.method, new URL(req.url).pathname)
  if (route?.permission) {
    const allowed = await checkPermission(req, route.permission)
    if (!allowed) throw err.forbidden('无权限')
  }
  return next()
})
```

| 推荐 | 原因 |
|------|------|
| 元数据写在叶子路由上 | 和 handler 同处，改接口时一起改 |
| 中间件读 Registry | 横切逻辑与具体 path 解耦 |
| 扩展字段命名稳定 | 便于 `registry.filter('webhook')` 批量收集 |

需要给扩展字段做 **TypeScript 约束**时，用下一节的 `withContext` 第二个泛参。完整说明见 [路由 · 扩展字段](/routing#扩展字段--声明式元数据)。

## 9. 用 withContext 封装类型安全路由

`withContext` 用来创建**带预设上下文的路由定义器**：定义一次，多处复用。handler 自动获得中间件注入字段的类型；第二个泛参约束上一节的扩展字段（如 `webhook`、`permission`）。

常见场景：

| 场景 | 作用 |
|------|------|
| 中间件注入的上下文 | handler 里直接用 `userId` / `role`，有完整类型 |
| 路由拆到多个文件 | 导出 `defineAuthedRoute`，各模块共用同一套上下文约定 |
| 组级 middleware + `children` | 跨调用时 TS 推不出父级注入，用定义器显式接上 |
| 扩展字段类型 | `withContext<Ctx, { webhook?: boolean; permission?: string }>()` |

```typescript
import {
  defineRoute,
  defineRoutes,
  defineMiddleware,
  withContext,
  err,
} from 'vafast'

const auth = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('请先登录')
  return next({ userId: 'u_1', role: 'admin' as const })
})

// 定义一次：预设上下文 + 扩展字段类型
const defineAuthedRoute = withContext<
  { userId: string; role: 'admin' | 'user' },
  { webhook?: boolean; permission?: string }
>()

const profileHandler = defineAuthedRoute({
  method: 'GET',
  path: '/profile',
  permission: 'account.read',
  handler: ({ userId, role }) => ({ userId, role }),
})

const updateHandler = defineAuthedRoute({
  method: 'PATCH',
  path: '/profile',
  webhook: true,
  permission: 'account.write',
  handler: ({ userId, body }) => ({ userId, ...body }),
})

export const accountRoutes = defineRoutes([
  defineRoute({
    path: '/account',
    middleware: [auth],
    children: [profileHandler, updateHandler],
  }),
])
```

| 对比 | 做法 |
|------|------|
| 叶子自己挂 middleware、无自定义扩展类型 | 普通 `defineRoute` 即可 |
| 要复用上下文 / 约束扩展字段 / 组级注入 | `withContext` 封装定义器 |
| 自建 JWT 签发 / 校验 | [@vafast/jwt](/middleware/jwt) |

原理详见 [中间件 · withContext](/middleware#父级中间件类型注入withcontext)。

## 10. SSE 流式响应

单向实时推送（AI 对话、进度、通知）用内置 SSE：路由上 **显式** `sse: true`，handler 写 `async function*`，直接 `yield` 即可。

```typescript
import { defineRoute, Type } from 'vafast'

defineRoute({
  method: 'POST',
  path: '/chat',
  sse: true,
  schema: {
    body: Type.Object({
      prompt: Type.String({ minLength: 1 }),
    }),
  },
  handler: async function* ({ body }) {
    yield { type: 'start' }
    for await (const chunk of streamModel(body.prompt)) {
      yield { type: 'delta', content: chunk }
    }
    yield { type: 'done' }
  },
})
```

| 要点 | 说明 |
|------|------|
| `sse: true` | 必须显式声明，框架才走 `text/event-stream` |
| `async function*` | `yield` 任意 JSON 可序列化数据 |
| Schema / 中间件 | 与普通路由一样，先校验再进 generator |
| WebSocket | 核心暂未内置；双向通道需自管或反代 |

需要事件名 / id 时用 `sse()` helper。完整用法见 [SSE](/essential/sse)。

### 其它配套

| 能力 | 文档 |
|------|------|
| 写操作触发 Webhook | [Webhook](/middleware/webhook) |
| 请求日志 / CORS | [Request Logger](/middleware/request-logger)、[CORS](/middleware/cors) |
| 静态文件 | [Static](/middleware/static) |
| OpenAPI | [OpenAPI](/integrations/openapi) |
| 前端类型化客户端 | [API Client](/api-client/overview) |
| Cookie | [Cookie](/middleware/cookie) |

## 11. 测试

用 `server.fetch`，不必起端口：

```typescript
import { describe, it, expect } from 'vitest'
import { Server, defineRoute, defineRoutes } from 'vafast'

const server = new Server(
  defineRoutes([
    defineRoute({
      method: 'GET',
      path: '/health',
      handler: () => ({ ok: true }),
    }),
  ]),
)

describe('health', () => {
  it('returns ok', async () => {
    const res = await server.fetch(new Request('http://localhost/health'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
```

服务函数单独单测即可。更多见 [单元测试](/patterns/unit-test)。

## 小结

| 阶段 | 关注点 |
|------|--------|
| 入门 | Schema、叶子路由、请求类型、简单中间件（[快速入门](/quick-start)） |
| 教程 | Schema、`err`、拆文件、路由组、中间件 |
| 本页 | 嵌套路由、中间件分层、serve 配置、声明式参数、`withContext`、SSE、测试 |
