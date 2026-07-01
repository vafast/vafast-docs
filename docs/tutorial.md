---
title: 教程 - Vafast
next:
  text: '关键概念'
  link: '/key-concept'
---

<script setup>
import Card from './components/nearl/card.vue'
import Deck from './components/nearl/card-deck.vue'
</script>

# Vafast 教程

我们将构建一个简单的 CRUD 笔记 API 服务器。

这里没有数据库，也没有其他"生产就绪"功能。本教程将重点介绍 Vafast 的功能以及如何使用 Vafast。

如果你跟着做，我们预计大约需要 15-20 分钟。

---

### 来自其他框架？

如果您使用过其他流行框架，您会发现 Vafast 非常熟悉，只是有一些小差异。

<Deck>
    <Card title="From Express" href="/migrate/from-express">
        从 Express 迁移到 Vafast 的指南
    </Card>
    <Card title="From Fastify" href="/migrate/from-fastify">
        从 Fastify 迁移到 Vafast 的指南
    </Card>
    <Card title="From Hono" href="/migrate/from-hono">
        从 Hono 迁移到 Vafast 的指南
    </Card>
    <Card title="From Elysia" href="/migrate/from-elysia">
        从 Elysia 迁移到 Vafast 的指南
    </Card>
</Deck>

### 不喜欢教程？

如果您更倾向于自己动手的方式，可以跳过这个教程，直接访问 [关键概念](/key-concept) 页面，深入了解 Vafast 的工作原理。

<Deck>
    <Card title="关键概念（5 分钟）" href="/key-concept">
        Vafast 的核心概念及其使用方法。
    </Card>
</Deck>

### llms.txt

或者，您可以下载 <a href="/llms.txt" download>llms.txt</a> 或 <a href="/llms-full.txt" download>llms-full.txt</a>，并将其输入您最喜欢的 LLM，如 ChatGPT、Claude 或 Gemini，以获得更互动的体验。

<Deck>
    <Card title="llms.txt" href="/llms.txt" download>
        下载带有参考的 Vafast 文档摘要，格式为 Markdown，以便提示 LLM。
    </Card>
    <Card title="llms-full.txt" href="/llms-full.txt" download>
        下载完整的 Vafast 文档，以 Markdown 格式在一个文件中供 LLM 提示使用。
    </Card>
</Deck>


## 设置

### 使用脚手架（推荐）

最快的方式是使用官方脚手架：

```bash
npx create-vafast-app
```

按照提示输入项目名称（如 `hi-vafast`），然后：

```bash
cd hi-vafast
npm install
npm run dev
```

### 手动创建

如果你更喜欢手动配置：

```bash
mkdir hi-vafast
cd hi-vafast
npm init -y
npm install vafast
npm install -D typescript tsx @types/node
```

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

在 `package.json` 中添加脚本：

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  }
}
```

### 项目结构

创建项目后，您应该看到以下结构：

```
hi-vafast/
├── src/
│   └── index.ts
├── .gitignore
├── package.json
└── tsconfig.json
```

### 启动开发服务器

```bash
npm run dev
```

现在您应该能够在 [http://localhost:3000](http://localhost:3000) 看到 "Hello Vafast!" 消息。

## 构建笔记 API

现在让我们开始构建我们的笔记 API。我们将创建一个简单的内存存储系统来管理笔记。

### 1. 定义笔记类型

首先，让我们在 `src/index.ts` 中定义我们的笔记类型：

```typescript
interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

// 内存存储
const notes: Note[] = []
```

### 2. 创建路由

Vafast 后端有两种 `defineRoute` 写法：

| 类型 | 必有字段 | 作用 |
|------|---------|------|
| **路由组** | `path` + `children` | 路径前缀、共享中间件，**无 method** |
| **叶子路由** | `method` + `path` + `handler` | 实际 API 端点 |

推荐做法：先把每个 handler 定义为常量，再用**路由组**（无 method）组织：

```typescript
// src/routes/notes.ts
import { defineRoute, defineRoutes, Type, json, err } from 'vafast'

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const notes: Note[] = []

const NoteSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

// --- 叶子路由：每个 handler 单独定义 ---

const listHandler = defineRoute({
  method: 'GET',
  path: '/',
  name: '获取笔记列表',
  handler: () => notes,
})

const getOneHandler = defineRoute({
  method: 'GET',
  path: '/:id',
  name: '获取单条笔记',
  handler: ({ params }) => {
    const note = notes.find(n => n.id === params.id)
    if (!note) throw err.notFound('Note not found')
    return note
  },
})

const createHandler = defineRoute({
  method: 'POST',
  path: '/create',
  name: '创建笔记',
  schema: { body: NoteSchema },
  handler: ({ body }) => {
    const note: Note = {
      id: Date.now().toString(),
      title: body.title,
      content: body.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    notes.push(note)
    return json(note, 201)
  },
})

const updateHandler = defineRoute({
  method: 'PUT',
  path: '/:id',
  name: '更新笔记',
  schema: { body: NoteSchema },
  handler: ({ params, body }) => {
    const idx = notes.findIndex(n => n.id === params.id)
    if (idx === -1) throw err.notFound('Note not found')
    notes[idx] = { ...notes[idx], ...body, updatedAt: new Date() }
    return notes[idx]
  },
})

const deleteHandler = defineRoute({
  method: 'DELETE',
  path: '/:id',
  name: '删除笔记',
  handler: ({ params }) => {
    const idx = notes.findIndex(n => n.id === params.id)
    if (idx === -1) throw err.notFound('Note not found')
    notes.splice(idx, 1)
    return null  // 204
  },
})

// --- 路由组：无 method，挂 children ---

export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    name: '笔记',
    description: '笔记 CRUD API',
    children: [listHandler, getOneHandler, createHandler, updateHandler, deleteHandler],
  }),
])
```

```typescript
// src/index.ts
import { Server, serve } from 'vafast'
import { notesRoutes } from './routes/notes'

const server = new Server(notesRoutes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
```

实际路径：`GET /notes/`、`GET /notes/:id`、`POST /notes/create` 等。

### 3. 测试 API

现在让我们测试我们的 API。重启开发服务器：

```bash
npm run dev
```

#### 创建笔记

```bash
curl -X POST http://localhost:3000/notes/create \
  -H "Content-Type: application/json" \
  -d '{"title": "我的第一个笔记", "content": "这是笔记的内容"}'
```

#### 获取所有笔记

```bash
curl http://localhost:3000/notes/
```

#### 获取单个笔记

```bash
curl http://localhost:3000/notes/<id>
```

#### 更新笔记

```bash
curl -X PUT http://localhost:3000/notes/<id> \
  -H "Content-Type: application/json" \
  -d '{"title": "更新的标题", "content": "更新的内容"}'
```

#### 删除笔记

```bash
curl -X DELETE http://localhost:3000/notes/<id>
```

## 添加中间件

在路由组（无 method）上挂中间件，**所有 children 自动继承**——这是生产项目最常用的模式。

### 1. 日志中间件

```typescript
import { defineMiddleware } from 'vafast'

const logMiddleware = defineMiddleware(async (req, next) => {
  const start = Date.now()
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)

  const response = await next()

  console.log(`Response: ${response.status} (${Date.now() - start}ms)`)
  return response
})
```

中间件签名：`(req, next) => Response`。通过 `next({ ctx })` 可向下游注入类型化上下文。

框架会**自动注入** `errorHandler`，捕获 `throw err.notFound()` 等错误，**无需手写错误处理中间件**。

### 2. 三层中间件

| 层级 | 写法 | 作用范围 |
|------|------|---------|
| 全局 | `server.use(mw)` | 所有路由 |
| 路由组 | `defineRoute({ path, middleware, children })` | 该组所有子路由 |
| 叶子路由 | `defineRoute({ method, middleware, handler })` | 单个端点 |

```typescript
// 全局
const server = new Server(notesRoutes)
server.use(logMiddleware)

// 路由组级（无 method）
export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    middleware: [logMiddleware],  // 所有 children 继承
    children: [listHandler, createHandler, ...],
  }),
])

// 叶子路由级
const createHandler = defineRoute({
  method: 'POST',
  path: '/create',
  middleware: [rateLimitMiddleware],  // 仅此路由
  handler: ...
})
```

执行顺序：全局 → `errorHandler`（自动） → 路由组 → 叶子路由 → handler。

### 3. 中间件注入上下文（认证预备）

```typescript
import { defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware<{ userId: string }>(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('未登录')
  return next({ userId: 'user-123' })  // 注入下游 handler
})

// handler 中可直接使用 userId（需配合 withContext 或 @vafast/auth-middleware 获得类型）
```

生产认证见 [Auth Middleware](/middleware/auth-middleware)。

## Schema 验证

- `Type` 直接从 `vafast` 导入
- 验证失败自动返回 400
- 支持 `body` / `query` / `params` / `headers` / `cookies`

```typescript
defineRoute({
  method: 'GET',
  path: '/search',
  schema: {
    query: Type.Object({
      keyword: Type.String(),
      page: Type.Optional(Type.Number({ minimum: 1 })),
    }),
  },
  handler: ({ query }) => ({ keyword: query.keyword, page: query.page ?? 1 }),
})
```

## 汇总：后端最小知识清单

看完本教程，你应该能独立写出如下结构的后端：

```typescript
// 1. 叶子路由（有 method + handler）
const createHandler = defineRoute({
  method: 'POST',
  path: '/create',
  schema: { body: NoteSchema },
  middleware: [requireUser],          // 可选：路由级
  handler: ({ body }) => { ... },
})

// 2. 路由组（无 method + children）
export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    middleware: [authMiddleware],       // 组级，children 继承
    children: [listHandler, createHandler],
  }),
])

// 3. 入口
const server = new Server([...notesRoutes])
server.use(cors())                      // 全局
serve({ fetch: server.fetch, port: 3000 })
```

## 总结

恭喜！您已经成功构建了一个完整的 CRUD API 服务器，包括：

- ✅ **路由组**（无 method）+ **叶子路由**（有 method）组织方式
- ✅ handler 提前定义为常量，放入 `children`
- ✅ 三层中间件：全局 / 路由组 / 叶子路由
- ✅ `schema` 验证 body、query、params
- ✅ `err.notFound()` 等结构化错误
- ✅ `defineMiddleware` + `next({ ctx })` 上下文注入
- ✅ 多文件拆分（`routes/` + `index.ts`）

### 下一步

现在您可以：

1. **嵌套路由与类型包装** — [路由指南](/routing)、[Auth Middleware](/middleware/auth-middleware)
2. **SSE 流式响应** — [SSE 指南](/essential/sse)（`sse: true` + `async function*`）
3. **集成数据库** — [Drizzle](/integrations/drizzle)、[Prisma](/integrations/prisma)
4. **部署** — [部署指南](/patterns/deploy)

### 相关资源

- [核心概念](/key-concept) - 架构与请求处理流程
- [API 参考](/api) - 完整 API 文档
- [中间件系统](/middleware) - `defineMiddleware`、`withContext` 原理

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast)。
