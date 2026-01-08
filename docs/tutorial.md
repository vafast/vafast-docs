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

现在让我们创建我们的 API 路由：

```typescript
import { Server, defineRoutes, createHandler, serve, Type, json, err } from 'vafast'

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const notes: Note[] = []

// 笔记 Schema
const NoteSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 })
})

const routes = defineRoutes([
  // 获取所有笔记
  {
    method: 'GET',
    path: '/notes',
    handler: createHandler(() => notes)
  },
  
  // 获取单个笔记
  {
    method: 'GET',
    path: '/notes/:id',
    handler: createHandler(({ params }) => {
      const note = notes.find(n => n.id === params.id)
      
      if (!note) {
        throw err.notFound('Note not found')
      }
      
      return note
    })
  },
  
  // 创建笔记
  {
    method: 'POST',
    path: '/notes',
    handler: createHandler(
      { body: NoteSchema },
      ({ body }) => {
        const note: Note = {
          id: Date.now().toString(),
          title: body.title,
          content: body.content,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        notes.push(note)
        return json(note, 201)  // 201 Created
      }
    )
  },
  
  // 更新笔记
  {
    method: 'PUT',
    path: '/notes/:id',
    handler: createHandler(
      { body: NoteSchema },
      ({ params, body }) => {
        const noteIndex = notes.findIndex(n => n.id === params.id)
        
        if (noteIndex === -1) {
          throw err.notFound('Note not found')
        }
        
        notes[noteIndex] = {
          ...notes[noteIndex],
          title: body.title,
          content: body.content,
          updatedAt: new Date()
        }
        
        return notes[noteIndex]
      }
    )
  },
  
  // 删除笔记
  {
    method: 'DELETE',
    path: '/notes/:id',
    handler: createHandler(({ params }) => {
      const noteIndex = notes.findIndex(n => n.id === params.id)
      
      if (noteIndex === -1) {
        throw err.notFound('Note not found')
      }
      
      notes.splice(noteIndex, 1)
      return null  // 204 No Content
    })
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
```

### 3. 测试 API

现在让我们测试我们的 API。重启开发服务器：

```bash
npm run dev
```

#### 创建笔记

```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "我的第一个笔记", "content": "这是笔记的内容"}'
```

#### 获取所有笔记

```bash
curl http://localhost:3000/notes
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

让我们为我们的 API 添加一些中间件来增强功能：

### 1. 日志中间件

```typescript
const logMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const start = Date.now()
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  
  const response = await next()
  
  const duration = Date.now() - start
  console.log(`Response: ${response.status} (${duration}ms)`)
  
  return response
}
```

### 2. 错误处理中间件

```typescript
import { json } from 'vafast'

const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    console.error('Error:', error)
    return json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
}
```

### 3. 使用中间件

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/notes',
    middleware: [logMiddleware, errorHandler],
    handler: createHandler(() => notes)
  }
  // ... 其他路由
])
```

或者添加全局中间件：

```typescript
const server = new Server(routes)
server.use(logMiddleware)
server.use(errorHandler)
```

## 添加验证

Vafast 内置 TypeBox 进行 Schema 验证，直接从 `vafast` 导入 `Type`：

```typescript
import { Server, defineRoutes, createHandler, serve, Type } from 'vafast'

const NoteSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 100 }),
  content: Type.String({ minLength: 1, maxLength: 1000 })
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/notes',
    handler: createHandler(
      { body: NoteSchema },
      ({ body }) => {
        // body 已经通过验证，类型安全
        const note: Note = {
          id: Date.now().toString(),
          title: body.title,
          content: body.content,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        notes.push(note)
        return note
      }
    )
  }
])
```

## 总结

恭喜！您已经成功构建了一个完整的 CRUD API 服务器，包括：

- ✅ 创建、读取、更新和删除笔记
- ✅ 中间件支持（日志记录、错误处理）
- ✅ Schema 验证
- ✅ 类型安全的 TypeScript 代码
- ✅ 内存数据存储

### 下一步

现在您可以：

1. **添加更多功能** - 如搜索、分页、排序等
2. **集成数据库** - 如 SQLite、PostgreSQL 或 MongoDB
3. **添加身份验证** - 用户登录和权限控制
4. **部署到生产环境** - 如 Vercel、Netlify 或自己的服务器

### 相关资源

- [核心概念](/key-concept) - 深入了解 Vafast 的工作原理
- [路由指南](/routing) - 学习更多路由技巧
- [中间件系统](/middleware) - 探索中间件的强大功能
- [API 参考](/api) - 完整的 API 文档

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast)。
