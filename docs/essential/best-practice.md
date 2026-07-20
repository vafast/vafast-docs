---
title: 最佳实践 - Vafast
---

# 最佳实践

Vafast 不强制编码模式。本页按生产项目（如 ones-server）里的高频写法，整理一套可直接落地的结构与约定。

更细的 API 说明见 [路由指南](/routing)、[Auth Middleware](/middleware/auth-middleware)、[入门教程](/tutorial)。

## 文件夹结构

框架不规定目录。没有现成约定时，推荐 **按层划分**：

```
src/
  index.ts          # Server + 全局中间件 + serve
  routes/           # 按业务域的路由文件 + index 聚合
    index.ts
    blog.ts
    files.ts
  services/         # 业务逻辑（可再分子目录）
  middleware/       # 少量项目级中间件
  common/           # env、常量、共享 schema
  utils/
```

- **路由文件**：定义叶子 handler，用 `children` 挂到资源组后导出
- **服务**：与 HTTP 无关的业务逻辑；路由负责鉴权、校验、映射错误
- **也可按功能模块拆**（`modules/blog/{routes,service}`），但生产更常见的是上面这种扁平 `routes/` + `services/`

## 嵌套路由（核心）

生产主路径是：**叶子 handler → 资源组 `children` → `defineRoutes` 导出 → 入口拼接**。

### ✅ 推荐：叶子提前定义，再用路由组挂载

```typescript
// routes/blog.ts
import { defineRoute, defineRoutes, Type, err } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'
import { createBlog, findBlog } from '../services/blog'

const createHandler = defineAuthRouteWithApp({
  method: 'POST',
  path: '/create',
  name: '创建博客',
  description: '创建新博客',
  webhook: true, // 写操作可声明，见 @vafast/webhook
  middleware: [requireUser],
  schema: {
    body: Type.Object({
      title: Type.String(),
      content: Type.String(),
    }),
  },
  handler: async ({ body, userInfo, app }) => {
    return createBlog({ ...body, appId: app.id, userId: userInfo.id })
  },
})

const findOneHandler = defineAuthRouteWithApp({
  method: 'POST',
  path: '/findOne',
  name: '博客详情',
  middleware: [requireUser],
  schema: {
    body: Type.Object({ id: Type.String() }),
  },
  handler: async ({ body, app }) => {
    const blog = await findBlog(body.id, app.id)
    if (!blog) throw err.notFound('博客不存在')
    return blog
  },
})

export const blogRoutes = defineRoutes([
  defineRoute({
    path: '/blog',
    name: '博客',
    description: '博客管理',
    middleware: [authWithApp], // 组级中间件，children 继承
    children: [createHandler, findOneHandler],
  }),
])
```

要点：

| 写法 | 作用 |
|------|------|
| 叶子：`method` + `path` + `handler` | 真正处理请求 |
| 组：仅 `path` + `children`（无 `method`） | 路径前缀 + 共享中间件 |
| `name` / `description` | 给 api-spec / 文档用 |
| 组上挂 `authWithApp`，叶子再挂 `requireUser` | 生产最常见鉴权分层 |

### ✅ 推荐：入口聚合 + 统一前缀

```typescript
// routes/index.ts
import { blogRoutes } from './blog'
import { filesRoutes } from './files'

export const allRoutes = [
  ...blogRoutes,
  ...filesRoutes,
]
```

```typescript
// index.ts
import { Server, serve, defineRoute, defineRoutes } from 'vafast'
import { cors } from '@vafast/cors'
import { requestId } from '@vafast/request-id'
import { allRoutes } from './routes'

const BASE_PATH = '/api'

const rootRoutes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => ({ status: 'ok' }),
  }),
])

const routesWithBasePath = allRoutes.map((route) => ({
  ...route,
  path: BASE_PATH + route.path,
}))

const server = new Server([...rootRoutes, ...routesWithBasePath])

server.use(cors())
server.use(requestId())

serve({
  fetch: server.fetch,
  port: 3000,
  hostname: '0.0.0.0',
  gracefulShutdown: true,
  trustProxy: true,
})
```

无前缀的 `GET /` 适合负载均衡探活；业务路由统一加 `BASE_PATH`。

### ❌ 不推荐：在入口平铺大量叶子路由

把几十个 `defineRoute` 直接塞进 `new Server([...])` 会难维护。按域拆文件，组内用 `children`。

## 鉴权

多租户业务服务对接 auth-server 时，**优先**用 [@vafast/auth-middleware](/middleware/auth-middleware)，不要手写 JWT。

常用组合：

| API | 场景 |
|-----|------|
| `defineAuthRouteWithApp` + `authWithApp` + `requireUser` | 需登录且绑定 app（最常见） |
| `defineRouteWithApp` + `requireApp` | 只需 app，不强制用户 |
| `defineOptionalAuthRouteWithApp` | 可选登录 |
| `defineApiKeyRoute` / `requireApiKey` | API Key、服务间调用 |

自建鉴权时再用 `defineMiddleware` + `next({ user })`，详见 [中间件](/middleware) 与 [教程](/tutorial)。

## Schema

用 `Type` 做运行时校验，用 `Static` 推断类型；**不要**用 class / interface 当请求模型。

```typescript
import { Type, type Static } from 'vafast'

export const CreateBlogBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String(),
  tags: Type.Optional(Type.Array(Type.String())),
})

export type CreateBlogBody = Static<typeof CreateBlogBody>
```

生产里 body 校验最常见；`params` / `query` 按需使用。复杂结构可用 `Type.Recursive`、`Type.Union` 等，见 [验证](/essential/validation)。

相关 Schema 可收拢到对象里：

```typescript
export const BlogModel = {
  create: CreateBlogBody,
  findOne: Type.Object({ id: Type.String() }),
}
```

## 错误处理

### ✅ 推荐：`throw err.*`

框架内置错误处理，业务侧直接抛语义化错误即可：

```typescript
import { err } from 'vafast'

if (!id) throw err.badRequest('参数错误')
if (!user) throw err.unauthorized('请先登录')
if (!allowed) throw err.forbidden('无权限')
if (!row) throw err.notFound('资源不存在')
if (dup) throw err.conflict('资源冲突')
throw err.internal('服务器错误')
```

默认响应形态类似：`{ "error": "NOT_FOUND", "message": "资源不存在" }`。

### ❌ 不推荐：在服务里构造 `Response`

服务返回数据或抛错；HTTP 状态与对外错误由路由 / `err` 负责。

```typescript
// ❌
export async function getBlog(id: string) {
  if (!id) return new Response('Bad Request', { status: 400 })
}

// ✅
export async function getBlog(id: string) {
  const blog = await db.blog.findById(id)
  return blog // 不存在则返回 null，由路由 throw err.notFound
}
```

仅当需要消化第三方库异常时，再挂自定义错误中间件；优先仍用 `err.*`。详见 [错误处理相关 API](/api)。

## 服务层

把与请求无关的逻辑抽成普通函数，便于单测与复用：

```typescript
// services/blog.ts
export async function createBlog(input: {
  title: string
  content: string
  appId: string
  userId: string
}) {
  return db.blog.create(input)
}
```

路由负责：鉴权上下文、`schema`、调用服务、`err` 映射。不必强行 MVC；handler 内写薄编排、重逻辑进 `services/` 即可。

## 测试

用 `server.fetch` 做路由集成测试，服务函数单独单测：

```typescript
import { describe, it, expect } from 'vitest'
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/health',
    handler: () => ({ ok: true }),
  }),
])

const server = new Server(routes)

describe('health', () => {
  it('returns ok', async () => {
    const res = await server.fetch(new Request('http://localhost/health'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
```

更多见 [单元测试](/patterns/unit-test)。

## 生产配套（按需）

这些在 ones 系服务里很常见，本页不展开，按链接深入：

| 能力 | 说明 |
|------|------|
| [Webhook](/middleware/webhook) | 路由声明 `webhook: true`，全局挂 webhook 中间件 |
| [Request Logger](/middleware/request-logger) / [Request Id](/middleware/request-id) / [CORS](/middleware/cors) | 入口 `server.use(...)` |
| [API Client / Sync](/api-client/overview) | `getApiSpec` + `vafast sync` 生成前端客户端 |
| [SSE](/essential/sse) | 流式接口（如 AI agent） |

## 总结

| 推荐 | 原因 |
|------|------|
| `children` 嵌套路由 + 按域拆文件 | 前缀与中间件共享，易维护 |
| `@vafast/auth-middleware` | 多租户鉴权与类型安全，避免手写 JWT |
| `Type` + `Static` | 运行时校验与类型同源 |
| `throw err.*` | 统一错误响应，服务不碰 HTTP |
| 入口：全局中间件 + `gracefulShutdown` + `trustProxy` | 对齐生产启动约定 |
| `server.fetch` 测路由 | 无需起端口的集成测试 |
