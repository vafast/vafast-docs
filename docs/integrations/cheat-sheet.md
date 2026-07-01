---
title: 集成速查表 - Vafast
---

# 集成速查表

这是一个快速参考指南，展示如何在 Vafast 中集成常用的库和工具。

## 数据库

### Prisma

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: async () => {
      const users = await prisma.user.findMany()
      return { users }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({
        name: Type.String(),
        email: Type.String({ format: 'email' })
      })
    },
    handler: async ({ body }) => {
      const user = await prisma.user.create({
        data: body
      })
      return { user }
    }
  })
])
```

### Drizzle

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { users } from './schema'

const db = drizzle(new Database('sqlite.db'))

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: async () => {
      const allUsers = await db.select().from(users)
      return { users: allUsers }
    }
  })
])
```

### MongoDB

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://localhost:27017')
const db = client.db('myapp')

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: async () => {
      const users = await db.collection('users').find({}).toArray()
      return { users }
    }
  })
])
```

## 认证

### JWT

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'
import { jwt } from '@vafast/jwt'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    schema: {
      body: Type.Object({
        username: Type.String(),
        password: Type.String()
      })
    },
    handler: async ({ body }) => {
      const token = await jwt.sign(body, { expiresIn: '1h' })
      return { token }
    }
  })
])

const server = new Server(routes)
server.use(jwt({
  secret: process.env.JWT_SECRET
}))
```

### Better Auth

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { BetterAuth } from 'better-auth'
import { VafastAdapter } from 'better-auth/adapters/vafast'

const auth = new BetterAuth({
  adapter: VafastAdapter({
    // 配置选项
  })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/profile',
    handler: async ({ request }) => {
      const session = await auth.api.getSession(request)
      return { user: session?.user }
    }
  })
])
```

## 中间件

### CORS

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  // 路由定义
])

const server = new Server(routes)
server.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}))
```

### Helmet

```typescript
import { Server } from 'vafast'
import { helmet } from '@vafast/helmet'

const server = new Server(routes)
server.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}))
```

### Rate Limiting

```typescript
import { Server } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const server = new Server(routes)
server.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
}))
```

## 监控和日志

### OpenTelemetry

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)
server.use(opentelemetry({
  serviceName: 'my-vafast-app',
  tracing: {
    enabled: true,
    exporter: {
      type: 'otlp',
      endpoint: 'http://localhost:4317'
    }
  }
}))
```

### Server Timing

```typescript
import { Server } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const server = new Server(routes)
server.use(serverTiming())
```

## 文件处理

### 文件上传

文件上传推荐使用 **POST**（创建新资源）或 **PUT**（替换指定资源）。

```typescript
import { defineRoute, defineRoutes, parseFile, parseFormData, err } from 'vafast'
import { writeFile } from 'node:fs/promises'

const routes = defineRoutes([
  // 方式1：POST 上传新文件（最常用）
  // 服务器决定存储位置，返回文件 ID
  defineRoute({
    method: 'POST',
    path: '/files',
    handler: async ({ req }) => {
      const file = await parseFile(req)
      const fileId = crypto.randomUUID()
      
      await writeFile(`./uploads/${fileId}-${file.name}`, file.data)
      
      return { 
        id: fileId, 
        filename: file.name,
        size: file.size 
      }
    }
  }),

  // 方式2：PUT 上传到指定位置（替换/覆盖）
  // 客户端指定文件 ID，幂等操作
  defineRoute({
    method: 'PUT',
    path: '/files/:fileId',
    handler: async ({ req, params }) => {
      const file = await parseFile(req)
      
      await writeFile(`./uploads/${params.fileId}`, file.data)
      
      return { 
        id: params.fileId,
        filename: file.name,
        replaced: true 
      }
    }
  }),

  // 方式3：使用原生 formData API
  defineRoute({
    method: 'POST',
    path: '/upload',
    handler: async ({ req }) => {
      const formData = await req.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        throw err.badRequest('未上传文件')
      }
      
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(`./uploads/${file.name}`, buffer)
      
      return { success: true, filename: file.name }
    }
  })
])
```

### 静态文件服务

```typescript
import { Server } from 'vafast'
import { staticFiles } from '@vafast/static'

const server = new Server(routes)
server.use(staticFiles({
  root: './public',
  prefix: '/static'
}))
```

## 缓存

### Redis

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { Redis } from 'ioredis'

const redis = new Redis()

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: async ({ params }) => {
      // 尝试从缓存获取
      const cached = await redis.get(`user:${params.id}`)
      if (cached) {
        return JSON.parse(cached)
      }
      
      // 从数据库获取
      const user = await getUserFromDB(params.id)
      
      // 缓存结果
      await redis.setex(`user:${params.id}`, 3600, JSON.stringify(user))
      
      return { user }
    }
  })
])
```

### 内存缓存

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const cache = new Map()

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/data/:key',
    handler: async ({ params }) => {
      if (cache.has(params.key)) {
        return { data: cache.get(params.key), cached: true }
      }
      
      const data = await fetchData(params.key)
      cache.set(params.key, data)
      
      return { data, cached: false }
    }
  })
])
```

## 任务调度

### Cron Jobs

```typescript
import { Server } from 'vafast'
import { cron } from '@vafast/cron'

const server = new Server(routes)
server.use(cron({
  jobs: [
    {
      name: 'cleanup',
      schedule: '0 2 * * *', // 每天凌晨2点
      task: async () => {
        console.log('Running cleanup task...')
        // 执行清理任务
      }
    }
  ]
}))
```

## 压缩

### Gzip/Brotli

```typescript
import { Server } from 'vafast'
import { compress } from '@vafast/compress'

const server = new Server(routes)
server.use(compress({
  algorithms: ['gzip', 'brotli'],
  threshold: 1024
}))
```

## 模板引擎

### HTML 渲染

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { html } from '@vafast/html'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return html`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Vafast App</title>
          </head>
          <body>
            <h1>Welcome to Vafast!</h1>
          </body>
        </html>
      `
    }
  })
])
```

## 测试

### 单元测试

```typescript
import { describe, expect, it } from 'vitest'
import { Server, defineRoute, defineRoutes } from 'vafast'

describe('User Routes', () => {
  it('should create a user', async () => {
    const routes = defineRoutes([
      defineRoute({
        method: 'POST',
        path: '/users',
        handler: ({ body }) => {
          return { id: '123', ...body }
        }
      })
    ])
    
    const server = new Server(routes)
    
    const request = new Request('http://localhost/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    })
    
    const response = await server.fetch(request)
    const data = await response.json()
    
    expect(data.id).toBe('123')
    expect(data.name).toBe('John')
  })
})
```

## 部署

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

### 环境变量

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# JWT
JWT_SECRET="your-secret-key"

# Redis
REDIS_URL="redis://localhost:6379"

# 监控
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
```

## SSE 流式响应

### AI 聊天流式响应

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import OpenAI from 'openai'

const openai = new OpenAI()

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/chat/stream',
    sse: true,  // 显式声明 SSE 端点
    schema: {
      body: Type.Object({ message: Type.String() })
    },
    handler: async function* ({ body }) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: body.message }],
        stream: true,
      })
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield { data: { token: content } }
        }
      }
      
      yield { event: 'done', data: { message: 'Stream completed' } }
    },
  })
])
```

### 进度更新

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/tasks/:taskId/progress',
    sse: true,
    schema: { params: Type.Object({ taskId: Type.String() }) },
    handler: async function* ({ params }) {
      const { taskId } = params
      
      while (true) {
        const task = await getTaskStatus(taskId) // 你的业务逻辑
        
        yield { data: { 
          status: task.status,
          progress: task.progress,
        }}
        
        if (task.status === 'completed' || task.status === 'failed') {
          return
        }
        
        await new Promise(r => setTimeout(r, 2000))
      }
    },
  })
])
```

> 📖 详细文档见 [SSE 流式响应](/essential/sse)

## 最佳实践

1. **错误处理**：始终使用 try-catch 包装异步操作
2. **类型安全**：使用 TypeBox 进行运行时类型验证
3. **中间件顺序**：注意中间件的执行顺序
4. **性能监控**：使用 OpenTelemetry 监控应用性能
5. **安全**：使用 Helmet 和其他安全中间件
6. **测试**：为所有路由编写测试用例

## 相关链接

- [中间件系统](/middleware) - 探索可用的中间件
- [路由指南](/routing) - 学习如何定义路由
- [SSE 流式响应](/essential/sse) - Server-Sent Events 详细文档
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
