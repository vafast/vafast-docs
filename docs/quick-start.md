---
title: 快速入门 - Vafast
next:
  text: '教程'
  link: '/tutorial'
---

# 快速入门

用几分钟跑起一个 Vafast 服务。本页覆盖 **安装 → Hello → 常见请求类型 → 简单中间件**；带 Schema 的 CRUD、嵌套路由请跟 [教程](/tutorial) 一步步做。

## 创建项目

::: code-group

```bash [脚手架（推荐）]
npx create-vafast-app
cd my-vafast-app
npm install
npm run dev
```

```bash [手动]
mkdir my-vafast-app && cd my-vafast-app
npm init -y
npm install vafast
npm install -D typescript tsx @types/node
```

:::

脚手架创建后访问 [localhost:3000](http://localhost:3000) 即可看到欢迎页。

手动创建时，在 `package.json` 加上：

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  }
}
```

`tsconfig.json` 可用：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

## Hello Vafast

创建 `src/index.ts`：

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!',
  }),
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('http://localhost:3000')
})
```

```bash
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，应看到 `Hello Vafast!`。

## 常见请求类型

handler 里按需取 `params` / `query` / `body`，方法写在 `method` 上：

```typescript
const routes = defineRoutes([
  // GET + 路径参数：/hello/world → Hello, world!
  defineRoute({
    method: 'GET',
    path: '/hello/:name',
    handler: ({ params }) => `Hello, ${params.name}!`,
  }),

  // GET + 查询参数：/search?q=vafast&page=1
  defineRoute({
    method: 'GET',
    path: '/search',
    handler: ({ query }) => ({
      q: query.q,
      page: query.page ?? '1',
    }),
  }),

  // POST + JSON body
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }) => ({
      id: '1',
      name: body.name,
    }),
  }),

  // PUT / PATCH / DELETE
  defineRoute({
    method: 'PUT',
    path: '/users/:id',
    handler: async ({ params, body }) => ({
      id: params.id,
      ...body,
    }),
  }),
  defineRoute({
    method: 'PATCH',
    path: '/users/:id',
    handler: async ({ params, body }) => ({
      id: params.id,
      ...body,
    }),
  }),
  defineRoute({
    method: 'DELETE',
    path: '/users/:id',
    handler: ({ params }) => {
      console.log('deleted', params.id)
      return null // → 204 No Content
    },
  }),
])
```

| 取数据 | 来源 | 示例 |
|--------|------|------|
| `params` | 路径 `:id` | `/users/1` → `params.id` |
| `query` | URL 查询串 | `?q=a` → `query.q` |
| `body` | JSON 请求体 | POST / PUT / PATCH |

handler **直接返回值**即可，框架会转成 `Response`：

| 返回值 | 结果 |
|--------|------|
| `'text'` | `text/plain` |
| `{ ok: true }` | `application/json` |
| `null` | `204 No Content` |

## 简单中间件

用 `defineMiddleware` 包一层；挂在路由的 `middleware` 上即可：

```typescript
import { Server, defineRoute, defineRoutes, defineMiddleware, serve } from 'vafast'

const log = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const res = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} ${res.status} ${Date.now() - start}ms`)
  return res
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    middleware: [log],
    handler: () => 'Hello Vafast!',
  }),
])

const server = new Server(routes)
// 全局中间件（作用于全部路由）：server.use(log)
serve({ fetch: server.fetch, port: 3000 })
```

需要把数据传给 handler 时，用 `next({ ... })`：

```typescript
const withUser = defineMiddleware(async (req, next) => {
  return next({ userId: req.headers.get('x-user-id') ?? 'guest' })
})

defineRoute({
  method: 'GET',
  path: '/me',
  middleware: [withUser],
  handler: ({ userId }) => ({ userId }), // userId 有类型
})
```

| 挂载方式 | 写法 |
|----------|------|
| 单条路由 | `defineRoute({ middleware: [log], ... })` |
| 全局 | `server.use(log)` |

更多（组级继承、`withContext`、鉴权）见 [教程 · 中间件](/tutorial#第五步加一层中间件)。

## 你现在掌握了什么

| API | 作用 |
|-----|------|
| `defineRoute` | 定义一条路由（`method` + `path` + `handler`） |
| `defineRoutes` | 组成路由表 |
| `defineMiddleware` | 定义中间件；`next()` / `next({ ctx })` |
| `new Server(routes)` | 创建应用 |
| `serve({ fetch, port })` | 在 Node 里监听端口 |

## 下一步

接着做 [教程](/tutorial)：给 body / query 加上 Schema 校验，再拆文件、嵌套路由。

想先摸清原理，也可以看 [核心概念](/key-concept)。
