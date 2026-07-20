---
title: 快速入门 - Vafast
next:
  text: '教程'
  link: '/tutorial'
---

# 快速入门

用几分钟跑起一个 Vafast 服务。本页覆盖 **安装 → Hello → Schema → 常见请求类型 → 简单中间件**。CRUD 拆分与嵌套路由请跟 [教程](/tutorial) 做。

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

## Schema

用 `Type` 声明 `schema`：校验失败自动 422，handler 里字段自动有类型。

```typescript
import { defineRoute, Type } from 'vafast'

const CreateUser = Type.Object({
  name: Type.String({ minLength: 1 }),
  age: Type.Optional(Type.Number({ minimum: 0 })),
})

defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: CreateUser },
  handler: ({ body }) => ({ id: '1', name: body.name, age: body.age ?? 18 }),
})
```

| schema 字段 | 作用 |
|-------------|------|
| `body` | JSON 请求体 |
| `query` | 查询串 |
| `params` | 路径 `:id` |

校验失败时 **不会进入 handler**，框架直接返回 HTTP **422**：

```json
{
  "code": 422,
  "message": "请求参数校验失败",
  "details": [
    {
      "location": "body",
      "path": "/name",
      "field": "name",
      "message": "Expected string length greater or equal to 1",
      "value": ""
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `details[].location` | `body` / `query` / `params` 等 |
| `details[].field` | 表单字段路径，如 `name`、`receiver.email` |
| `details[].message` | TypeBox 原始英文提示 |
| `details[].value` | 触发错误的实际值（可选） |

更多见 [验证](/essential/validation)。

## 常见请求类型

方法写在 `method` 上，入参用 `schema` 约束：

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  // GET + 路径 / 查询参数
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: {
      params: Type.Object({ id: Type.String() }),
      query: Type.Object({
        verbose: Type.Optional(Type.Boolean()),
      }),
    },
    handler: ({ params, query }) => ({
      id: params.id,
      verbose: query.verbose ?? false,
    }),
  }),

  // POST + body
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({ name: Type.String({ minLength: 1 }) }),
    },
    handler: ({ body }) => ({ id: '1', name: body.name }),
  }),

  // PUT / PATCH
  defineRoute({
    method: 'PUT',
    path: '/users/:id',
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({ name: Type.String() }),
    },
    handler: ({ params, body }) => ({ id: params.id, ...body }),
  }),

  // DELETE
  defineRoute({
    method: 'DELETE',
    path: '/users/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: ({ params }) => {
      console.log('deleted', params.id)
      return null // → 204 No Content
    },
  }),
])
```

handler 直接返回值即可：`'text'` → text/plain，`{ ok: true }` → JSON，`null` → 204。

## 简单中间件

```typescript
import { defineMiddleware, defineRoute } from 'vafast'

const log = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const res = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} ${res.status} ${Date.now() - start}ms`)
  return res
})

defineRoute({
  method: 'GET',
  path: '/',
  middleware: [log],
  handler: () => 'Hello Vafast!',
})

// 全局：server.use(log)
```

向 handler 注入数据用 `next({ ... })`：

```typescript
const withUser = defineMiddleware(async (req, next) => {
  return next({ userId: req.headers.get('x-user-id') ?? 'guest' })
})

defineRoute({
  method: 'GET',
  path: '/me',
  middleware: [withUser],
  handler: ({ userId }) => ({ userId }),
})
```

更多见 [教程 · 中间件](/tutorial#第五步加一层中间件)。

## 你现在掌握了什么

| API | 作用 |
|-----|------|
| `Type` + `schema` | 请求校验与类型推断 |
| `defineRoute` / `defineRoutes` | 定义路由 |
| `defineMiddleware` | 中间件；`next()` / `next({ ctx })` |
| `Server` + `serve` | 创建应用并监听端口 |

## 下一步

接着做 [教程](/tutorial)：拆文件、嵌套路由。想先摸清原理看 [核心概念](/key-concept)。
