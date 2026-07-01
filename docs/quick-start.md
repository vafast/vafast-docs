---
title: 快速入门 - Vafast
---

# 快速入门

Vafast 是一个高性能、类型安全的 TypeScript Web 框架。内置 JIT 编译验证器、Radix Tree 路由等优化技术，比 Express/Hono 快约 **1.8x**。

## 使用脚手架（推荐）

最快的方式是使用官方脚手架：

```bash
npx create-vafast-app
```

按照提示输入项目名称，然后：

```bash
cd my-vafast-app
npm install
npm run dev
```

访问 [localhost:3000](http://localhost:3000) 即可看到 "Hello Vafast!"。

## 手动配置

如果你想手动配置项目，请按以下步骤操作。

确保你已安装 Node.js（推荐版本 18+）。

### 1. 创建项目目录

```bash
mkdir my-vafast-app
cd my-vafast-app
npm init -y
```

### 2. 安装依赖

```bash
npm install vafast
npm install -D typescript tsx @types/node
```

### 3. 配置 TypeScript

创建 `tsconfig.json`：

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

### 4. 配置 package.json

在 `package.json` 中添加：

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc",
    "serve": "node dist/index.js"
  }
}
```

### 5. 创建 .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# IDE
.idea/
.vscode/

# OS
.DS_Store

# Logs
*.log

# Environment
.env
.env.local
```

### 6. 项目结构

```
my-vafast-app/
├── src/
│   └── index.ts
├── .gitignore
├── package.json
└── tsconfig.json
```

## 两种路由：叶子 vs 路由组

`defineRoute` 有两种写法，这是写后端最重要的结构：

### 叶子路由（有 `method`）

实际处理请求的端点，**必须有** `method`、`path`、`handler`：

```typescript
defineRoute({
  method: 'GET',       // GET | POST | PUT | DELETE | PATCH | ...
  path: '/users/:id',
  handler: ({ params }) => ({ id: params.id })
})
```

### 路由组（无 `method`）

只做**路径前缀 + 中间件共享**，**没有** `handler`，通过 `children` 挂子路由：

```typescript
defineRoute({
  path: '/api/users',           // 无 method
  name: '用户',
  description: '用户管理',
  middleware: [authMiddleware], // 子路由全部继承
  children: [
    defineRoute({ method: 'GET',  path: '/list',   handler: () => [...] }),
    defineRoute({ method: 'POST', path: '/create', handler: ({ body }) => body }),
  ]
})
// 实际路径：/api/users/list、/api/users/create
```

::: tip 生产项目惯例
- **路由组**：`path` + `middleware` + `children`（无 method）
- **子路由**：`method` + `path` + `handler`，path 写相对路径（`/list` 而非 `/api/users/list`）
- **handler 提前定义**：复杂 handler 可先 `const createHandler = defineRoute({...})` 再放入 `children`
:::

## 创建应用

创建 `src/index.ts`，有两种写法：

### 方式一：使用 defineRoutes（推荐）

`defineRoutes` 提供更好的类型推断，适合复杂项目：

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  }),
  defineRoute({
    method: 'GET',
    path: '/health',
    handler: () => ({ status: 'ok', timestamp: Date.now() })
  })
])

const server = new Server(routes)

serve({
  fetch: server.fetch,
  port: 3000,
  // 生产环境推荐启用优雅关闭
  gracefulShutdown: true
}, () => {
  console.log('Server running on http://localhost:3000')
})
```

### 方式二：导出 fetch（Bun / Workers）

不调用 `serve()`，直接导出 `fetch` 给边缘运行时：

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const server = new Server(defineRoutes([
  defineRoute({ method: 'GET', path: '/', handler: () => 'Hello Vafast!' })
]))

export default { fetch: server.fetch }
```

## 核心 API 一览

入门阶段需要掌握的 API：

| API | 作用 |
|-----|------|
| `defineRoute()` | 定义路由：叶子（有 method）或路由组（无 method，有 children） |
| `defineRoutes()` | 路由数组，保留字面量类型 |
| `new Server(routes)` | 创建服务器，负责路由匹配 |
| `server.use(mw)` | 注册**全局**中间件 |
| `serve({ fetch, port })` | 启动 Node.js HTTP 服务 |
| `Type` + `schema` | TypeBox 请求验证 |
| `err.notFound()` 等 | 结构化错误，由框架 `errorHandler` 自动转 JSON |

> `Server` 只管路由，端口/超时/代理等配置走 `serve()`，详见 [API 参考](/api)。

## 启动服务

```bash
npm run dev
```

访问 [localhost:3000](http://localhost:3000) 应该会显示 "Hello Vafast"。

## 基础示例

### 简单路由

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  }),
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => ['user1', 'user2', 'user3']
  })
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

### 带参数的路由

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => {
      return `User ID: ${params.id}`
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: async ({ body }) => {
      return { success: true, user: body }
    }
  })
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

### 使用 Schema 验证

```typescript
import { Server, defineRoute, defineRoutes, serve, Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: UserSchema },
    handler: ({ body }) => {
      // body 已验证并自动推导类型
      return { success: true, user: body }
    }
  })
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

### 全局中间件

```typescript
import { cors } from '@vafast/cors'

const server = new Server(routes)
server.use(cors())  // 作用于所有路由

serve({ fetch: server.fetch, port: 3000 })
```

### 嵌套路由

```typescript
const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [logMiddleware],
    children: [
      defineRoute({
        method: 'GET',
        path: '/users',
        handler: () => ({ users: [] })
      })
    ]
  })
])
```

路径自动扁平化为 `/api/users`，父级中间件自动继承。

### Handler 上下文

handler 接收一个上下文对象，常用字段：

```typescript
defineRoute({
  method: 'GET',
  path: '/users/:id',
  schema: {
    params: Type.Object({ id: Type.String() }),
    query:  Type.Object({ page: Type.Optional(Type.Number()) }),
  },
  handler: ({ req, params, query, body, headers, cookies }) => {
    // params.id、query.page 均有类型
    return { id: params.id, page: query.page ?? 1 }
  }
})
```

| 字段 | 来源 |
|------|------|
| `req` | 原始 `Request` |
| `params` | 路径参数 `/users/:id` |
| `query` | URL 查询参数 `?page=1` |
| `body` | 请求体（POST/PUT/PATCH） |
| `headers` | 请求头 |
| `cookies` | Cookie |

### 响应写法

handler 返回值会自动转为 `Response`：

```typescript
handler: () => 'plain text'           // text/plain
handler: () => ({ ok: true })         // application/json
handler: () => null                    // 204 No Content
handler: () => json(data, 201)        // 指定状态码
handler: () => new Response(...)       // 原生 Response
```

### 结构化错误

```typescript
import { err } from 'vafast'

handler: ({ params }) => {
  const user = findUser(params.id)
  if (!user) throw err.notFound('用户不存在')
  return user
}
```

`err` 常用方法：`badRequest` `unauthorized` `forbidden` `notFound` `conflict` `internal`

### 项目结构（多文件）

```
src/
├── index.ts          # Server + serve + 全局中间件
├── routes/
│   ├── index.ts      # defineRoutes 汇总
│   └── users.ts      # 按模块拆分
```

生产项目认证见 [@vafast/auth-middleware](/middleware/auth-middleware)；自建 JWT 见 [@vafast/jwt](/middleware/jwt)。

```typescript
// routes/users.ts — 路由组 + 子路由
import { authWithApp, requireUser } from '@vafast/auth-middleware'

export const usersRoutes = defineRoutes([
  defineRoute({
    path: '/users',
    middleware: [authWithApp],
    children: [
      defineRoute({ method: 'GET', path: '/list', middleware: [requireUser], handler: () => [...] }),
    ]
  })
])

// index.ts
import { usersRoutes } from './routes/users'
const server = new Server([...usersRoutes])
```

## 下一步

现在你已经成功创建了一个 Vafast 应用！接下来你可以：

- 查看 [核心概念](/key-concept) 了解 Vafast 的基本原理
- 阅读 [路由指南](/routing) 学习嵌套路由与 `withContext` 类型包装
- 探索 [中间件系统](/middleware) 了解 `defineMiddleware` 与全局中间件
- 微服务认证见 [Auth Middleware](/middleware/auth-middleware)（`ones-server` 同款方案）
- 完整 API 见 [API 参考](/api)
