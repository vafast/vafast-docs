---
title: 集成速查表 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: 集成速查表 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 框架的集成速查表，包含常用库和工具的集成示例。

  - - meta
    - property: 'og:description'
      content: Vafast 框架的集成速查表，包含常用库和工具的集成示例。
---

# 集成速查表

这是一个快速参考指南，展示如何在 Vafast 中集成常用的库和工具。

## 数据库

### Prisma

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createRouteHandler(async () => {
      const users = await prisma.user.findMany()
      return { users }
    })
  },
  
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(async ({ body }) => {
      const user = await prisma.user.create({
        data: body
      })
      return { user }
    }),
    body: Type.Object({
      name: Type.String(),
      email: Type.String({ format: 'email' })
    })
  }
])
```

### Drizzle

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite3'
import { users } from './schema'

const db = drizzle(new Database('sqlite.db'))

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createRouteHandler(async () => {
      const allUsers = await db.select().from(users)
      return { users: allUsers }
    })
  }
])
```

### MongoDB

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://localhost:27017')
const db = client.db('myapp')

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createRouteHandler(async () => {
      const users = await db.collection('users').find({}).toArray()
      return { users }
    })
  }
])
```

## 认证

### JWT

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { jwt } from '@vafast/jwt'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/login',
    handler: createRouteHandler(async ({ body }) => {
      const token = await jwt.sign(body, { expiresIn: '1h' })
      return { token }
    }),
    body: Type.Object({
      username: Type.String(),
      password: Type.String()
    })
  }
])

const app = createRouteHandler(routes)
  .use(jwt({
    secret: process.env.JWT_SECRET
  }))
```

### Better Auth

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { BetterAuth } from 'better-auth'
import { VafastAdapter } from 'better-auth/adapters/vafast'

const auth = new BetterAuth({
  adapter: VafastAdapter({
    // 配置选项
  })
})

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/profile',
    handler: createRouteHandler(async ({ request }) => {
      const session = await auth.api.getSession(request)
      return { user: session?.user }
    })
  }
])
```

## 中间件

### CORS

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  // 路由定义
])

const app = createRouteHandler(routes)
  .use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
  }))
```

### Helmet

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { helmet } from '@vafast/helmet'

const app = createRouteHandler(routes)
  .use(helmet({
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
import { defineRoutes, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const app = createRouteHandler(routes)
  .use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 15分钟内最多100个请求
  }))
```

## 监控和日志

### OpenTelemetry

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const app = createRouteHandler(routes)
  .use(opentelemetry({
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
import { defineRoutes, createRouteHandler } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const app = createRouteHandler(routes)
  .use(serverTiming())
```

## 文件处理

### 文件上传

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/upload',
    handler: createRouteHandler(async ({ request }) => {
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (file) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // 保存文件
        await Bun.write(`./uploads/${file.name}`, buffer)
        
        return { success: true, filename: file.name }
      }
      
      return { error: 'No file uploaded' }, { status: 400 }
    })
  }
])
```

### 静态文件服务

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { staticFiles } from '@vafast/static'

const app = createRouteHandler(routes)
  .use(staticFiles({
    root: './public',
    prefix: '/static'
  }))
```

## 缓存

### Redis

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { Redis } from 'ioredis'

const redis = new Redis()

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(async ({ params }) => {
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
    })
  }
])
```

### 内存缓存

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'

const cache = new Map()

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/data/:key',
    handler: createRouteHandler(async ({ params }) => {
      if (cache.has(params.key)) {
        return { data: cache.get(params.key), cached: true }
      }
      
      const data = await fetchData(params.key)
      cache.set(params.key, data)
      
      return { data, cached: false }
    })
  }
])
```

## 任务调度

### Cron Jobs

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { cron } from '@vafast/cron'

const app = createRouteHandler(routes)
  .use(cron({
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
import { defineRoutes, createRouteHandler } from 'vafast'
import { compress } from '@vafast/compress'

const app = createRouteHandler(routes)
  .use(compress({
    algorithms: ['gzip', 'brotli'],
    threshold: 1024
  }))
```

## 模板引擎

### HTML 渲染

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { html } from '@vafast/html'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
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
    })
  }
])
```

## 测试

### 单元测试

```typescript
import { describe, expect, it } from 'bun:test'
import { createRouteHandler } from 'vafast'

describe('User Routes', () => {
  it('should create a user', async () => {
    const handler = createRouteHandler(({ body }) => {
      return { id: '123', ...body }
    })
    
    const request = new Request('http://localhost/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    })
    
    const response = await handler(request)
    const data = await response.json()
    
    expect(data.id).toBe('123')
    expect(data.name).toBe('John')
  })
})
```

## 部署

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
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

## 最佳实践

1. **错误处理**：始终使用 try-catch 包装异步操作
2. **类型安全**：使用 TypeBox 进行运行时类型验证
3. **中间件顺序**：注意中间件的执行顺序
4. **性能监控**：使用 OpenTelemetry 监控应用性能
5. **安全**：使用 Helmet 和其他安全中间件
6. **测试**：为所有路由编写测试用例

## 相关链接

- [中间件系统](/middleware) - 探索可用的中间件
- [路由定义](/essential/route) - 学习如何定义路由
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
