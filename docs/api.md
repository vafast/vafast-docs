---
title: API 参考 - Vafast
---

# API 参考

本文档提供了 Vafast 框架的完整 API 参考。所有类型定义和接口都基于 TypeScript，确保类型安全。

## 核心类

### Server

`Server` 是 Vafast 的核心类，用于创建 HTTP 服务器。

```typescript
import { Server } from 'vafast'

const server = new Server(routes)
export default { fetch: server.fetch }
```

#### 构造函数

```typescript
new Server(routes: Route[], options?: ServerOptions)
```

**参数：**
- `routes`: 路由配置数组
- `options`: 可选的服务器配置

#### 方法

##### `fetch(request: Request): Promise<Response>`

处理 HTTP 请求并返回响应。

```typescript
const server = new Server(routes)
const response = await server.fetch(new Request('http://localhost:3000/api/users'))
```

### ComponentServer

`ComponentServer` 用于创建支持组件路由的服务器。

```typescript
import { ComponentServer } from 'vafast'

const server = new ComponentServer(routes)
export default { fetch: server.fetch }
```

#### 构造函数

```typescript
new ComponentServer(routes: ComponentRoute[], options?: ServerOptions)
```

**参数：**
- `routes`: 组件路由配置数组
- `options`: 可选的服务器配置

## 类型定义

### Route

基本路由配置接口。

```typescript
interface Route {
  method: HTTPMethod
  path: string
  handler: RouteHandler
  middleware?: Middleware[]
  body?: any
  query?: any
  params?: any
  headers?: any
  cookies?: any
  docs?: RouteDocs
  timeout?: number
  maxBodySize?: string
  [key: string]: any
}
```

**属性：**
- `method`: HTTP 方法（GET、POST、PUT、DELETE、PATCH、OPTIONS、HEAD）
- `path`: 路由路径
- `handler`: 路由处理函数
- `middleware`: 中间件数组
- `body`: 请求体验证配置
- `query`: 查询参数验证配置
- `params`: 路径参数验证配置
- `headers`: 请求头验证配置
- `cookies`: Cookie 验证配置
- `docs`: API 文档配置
- `timeout`: 请求超时时间
- `maxBodySize`: 最大请求体大小

### ComponentRoute

组件路由配置接口。

```typescript
interface ComponentRoute {
  path: string
  component: () => Promise<any>
  middleware?: Middleware[]
  children?: (ComponentRoute | NestedComponentRoute)[]
}
```

**属性：**
- `path`: 路由路径
- `component`: 组件导入函数
- `middleware`: 中间件数组
- `children`: 子路由配置

### NestedRoute

嵌套路由配置接口。

```typescript
interface NestedRoute {
  path: string
  middleware?: Middleware[]
  children?: (Route | NestedRoute)[]
}
```

**属性：**
- `path`: 路由路径
- `middleware`: 中间件数组
- `children`: 子路由配置

### Middleware

中间件函数类型。

```typescript
type Middleware = (
  req: Request, 
  next: () => Promise<Response>
) => Promise<Response>
```

**参数：**
- `req`: HTTP 请求对象
- `next`: 下一个中间件或路由处理函数

**返回值：** HTTP 响应对象

### RouteHandler

路由处理函数类型。推荐使用 `createHandler` 创建处理函数。

```typescript
// 基本类型
type RouteHandler = Handler | ((req: Request) => unknown)

// 推荐使用 createHandler
import { createHandler } from 'vafast'

// 无 schema
const handler = createHandler(({ req, params, query }) => {
  return { message: 'Hello' }
})

// 有 schema 验证
const handler = createHandler(
  { body: Type.Object({ name: Type.String() }) },
  ({ body }) => ({ success: true, name: body.name })
)
```

**返回值：** 任意值（自动转换为 Response）

### HTTPMethod

支持的 HTTP 方法类型。

```typescript
type HTTPMethod = 
  | 'GET' 
  | 'POST' 
  | 'PUT' 
  | 'DELETE' 
  | 'PATCH' 
  | 'OPTIONS' 
  | 'HEAD'
```

### RouteDocs

API 文档配置接口。

```typescript
interface RouteDocs {
  description?: string
  tags?: string[]
  security?: any[]
  responses?: Record<string, any>
}
```

**属性：**
- `description`: 路由描述
- `tags`: 标签数组
- `security`: 安全配置
- `responses`: 响应配置

## 服务器配置

### ServerOptions

服务器配置选项。

```typescript
interface ServerOptions {
  port?: number
  host?: string
  cors?: CorsOptions
  compression?: boolean
  trustProxy?: boolean
  [key: string]: any
}
```

**属性：**
- `port`: 服务器端口
- `host`: 服务器主机
- `cors`: CORS 配置
- `compression`: 是否启用压缩
- `trustProxy`: 是否信任代理

### CorsOptions

CORS 配置选项。

```typescript
interface CorsOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}
```

**属性：**
- `origin`: 允许的源
- `methods`: 允许的 HTTP 方法
- `allowedHeaders`: 允许的请求头
- `credentials`: 是否允许凭据
- `maxAge`: 预检请求缓存时间

## 中间件类型

### 官方中间件包

Vafast 提供独立的中间件包，功能更丰富：

| 包名 | 功能 | 文档 |
|------|------|------|
| `@vafast/cors` | CORS 跨域处理 | [查看](/middleware/cors) |
| `@vafast/jwt` | JWT 认证 | [查看](/middleware/jwt) |
| `@vafast/rate-limit` | 速率限制 | [查看](/middleware/rate-limit) |

#### 示例：CORS

```typescript
import { cors } from '@vafast/cors'

server.use(cors({
  origin: ['https://example.com'],
  credentials: true
}))
```

#### 示例：JWT 认证

```typescript
import { jwt } from '@vafast/jwt'

const authMiddleware = jwt({ secret: 'your-secret' })

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware],
    handler: createHandler(() => 'Admin panel')
  }
])
```

#### 示例：速率限制

```typescript
import { rateLimit } from '@vafast/rate-limit'

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100次请求
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/login',
    middleware: [rateLimitMiddleware],
    handler: createHandler(() => 'Login')
  }
])

## 工具函数

### defineRoute

用于定义类型安全的路由。

```typescript
import { defineRoute } from 'vafast'

const userRoute = defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: (req, params) => `User ${params?.id}`
})
```

### createMiddleware

用于创建可配置的中间件。

```typescript
import { createMiddleware } from 'vafast'

const logMiddleware = createMiddleware({
  level: 'info',
  format: 'json'
})
```

## 响应工具

Vafast 提供简洁的响应工具函数。

### json()

生成 JSON 响应。

```typescript
import { json } from 'vafast'

// 基本用法
return json(data)                          // 200 + JSON
return json(data, 201)                     // 201 + JSON
return json(data, 200, { 'X-Id': 'abc' })  // 自定义头部
```

**函数签名：**

```typescript
function json(
  data: unknown,
  status?: number,           // 默认 200
  headers?: HeadersInit      // 自定义响应头
): Response
```

### 其他响应工具

```typescript
import { text, html, redirect, empty, stream } from 'vafast'

// 纯文本响应
return text('Hello World')
return text('Created', 201)

// HTML 响应
return html('<h1>Hello</h1>')

// 重定向
return redirect('/new-url')        // 302 临时重定向
return redirect('/new-url', 301)   // 301 永久重定向

// 空响应
return empty()         // 204 No Content
return empty(201)      // 指定状态码

// 流式响应
return stream(readableStream)
return stream(readableStream, 200, { 'Content-Type': 'text/event-stream' })
```

### 自动响应转换

在 `createHandler` 中，返回值会自动转换为 Response：

```typescript
createHandler(() => {
  return user          // → 200 + JSON
  return 'Hello'       // → 200 + text/plain
  return 123           // → 200 + text/plain
  return null          // → 204 No Content
})
```

## 错误处理

### err() 错误工具函数（推荐）

`err()` 提供简洁、语义化的错误 API。

```typescript
import { err } from 'vafast'

// 预定义错误（推荐）
throw err.badRequest('参数错误')      // 400 BAD_REQUEST
throw err.unauthorized('请先登录')    // 401 UNAUTHORIZED
throw err.forbidden('无权限访问')     // 403 FORBIDDEN
throw err.notFound('用户不存在')      // 404 NOT_FOUND
throw err.conflict('用户名已存在')    // 409 CONFLICT
throw err.unprocessable('无法处理')   // 422 UNPROCESSABLE_ENTITY
throw err.tooMany('请求过于频繁')     // 429 TOO_MANY_REQUESTS
throw err.internal('服务器错误')      // 500 INTERNAL_ERROR

// 自定义错误
throw err('自定义错误消息', 418, 'CUSTOM_ERROR_TYPE')
```

**完整的预定义错误列表：**

| 方法 | 状态码 | 错误类型 | 默认消息 |
|------|--------|----------|----------|
| `err.badRequest(msg?)` | 400 | BAD_REQUEST | 请求参数错误 |
| `err.unauthorized(msg?)` | 401 | UNAUTHORIZED | 未授权 |
| `err.forbidden(msg?)` | 403 | FORBIDDEN | 禁止访问 |
| `err.notFound(msg?)` | 404 | NOT_FOUND | 资源不存在 |
| `err.conflict(msg?)` | 409 | CONFLICT | 资源冲突 |
| `err.unprocessable(msg?)` | 422 | UNPROCESSABLE_ENTITY | 无法处理的实体 |
| `err.tooMany(msg?)` | 429 | TOO_MANY_REQUESTS | 请求过于频繁 |
| `err.internal(msg?)` | 500 | INTERNAL_ERROR | 服务器内部错误 |

### VafastError 类

底层错误类，`err()` 是它的便捷封装。

```typescript
import { VafastError } from 'vafast'

class VafastError extends Error {
  status: number      // HTTP 状态码，默认 500
  type: string        // 错误类型，默认 'internal_error'
  expose: boolean     // 是否暴露错误消息给客户端，默认 false
  
  constructor(
    message: string,
    options?: {
      status?: number    // HTTP 状态码
      type?: string      // 错误类型标识
      expose?: boolean   // 是否暴露消息给客户端
      cause?: unknown    // 原始错误（用于错误链）
    }
  )
}

// 直接使用（不推荐，除非需要 expose: false）
throw new VafastError('Internal error', { 
  status: 500, 
  type: 'DB_ERROR',
  expose: false  // 不暴露给客户端
})
```

### 完整示例

```typescript
import { defineRoutes, createHandler, json, err, Type } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(async ({ params }) => {
      const user = await db.findUser(params.id)
      
      if (!user) {
        throw err.notFound('用户不存在')
      }
      
      return user  // 200 + JSON
    })
  },
  {
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({
        name: Type.String(),
        email: Type.String({ format: 'email' })
      })
    },
    handler: createHandler(async ({ body }) => {
      if (await db.emailExists(body.email)) {
        throw err.conflict('邮箱已被注册')
      }
      
      const user = await db.createUser(body)
      return json(user, 201)  // 201 Created
    })
  },
  {
    method: 'DELETE',
    path: '/users/:id',
    handler: createHandler(async ({ params }) => {
      await db.deleteUser(params.id)
      return null  // 204 No Content
    })
  }
])

// 错误响应格式：
// { "error": "NOT_FOUND", "message": "用户不存在" }
```

### API 速查表

```
┌─────────────────────────────────────────────────────────────┐
│                      成功响应                                │
├─────────────────────────────────────────────────────────────┤
│  return data           →  200 + JSON（自动转换）            │
│  return json(data,201) →  201 + JSON                        │
│  return 'Hello'        →  200 + text/plain                  │
│  return null           →  204 No Content                    │
│  return new Response() →  完全控制                          │
├─────────────────────────────────────────────────────────────┤
│                      错误响应                                │
├─────────────────────────────────────────────────────────────┤
│  throw err.badRequest()    →  400                           │
│  throw err.unauthorized()  →  401                           │
│  throw err.forbidden()     →  403                           │
│  throw err.notFound()      →  404                           │
│  throw err.conflict()      →  409                           │
│  throw err.unprocessable() →  422                           │
│  throw err.tooMany()       →  429                           │
│  throw err.internal()      →  500                           │
│  throw err(msg, 418, 'X')  →  自定义                        │
└─────────────────────────────────────────────────────────────┘
```

## 验证配置

### 请求体验证

```typescript
import { defineRoutes, createHandler, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 18 }))
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    // 使用 createHandler 自动验证
    handler: createHandler(
      { body: userSchema },
      ({ body }) => {
        // body 已经通过验证，类型安全
        return { message: 'User created' }
      }
    )
  }
])
```

### 查询参数验证

```typescript
import { defineRoutes, createHandler, Type } from 'vafast'

const querySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  sort: Type.Optional(Type.Union([
    Type.Literal('name'),
    Type.Literal('email'),
    Type.Literal('created_at')
  ]))
})

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    // 使用 createHandler 自动解析和验证
    handler: createHandler(
      { query: querySchema },
      ({ query }) => {
        // query 已经通过验证，类型安全
        return `Page: ${query.page}, Limit: ${query.limit}, Sort: ${query.sort}`
    }
    )
  }
])
```

## 生命周期钩子

### 服务器生命周期

```typescript
const server = new Server(routes)

// 启动前
server.on('beforeStart', () => {
  console.log('Server starting...')
})

// 启动后
server.on('afterStart', () => {
  console.log('Server started')
})

// 关闭前
server.on('beforeClose', () => {
  console.log('Server closing...')
})

// 关闭后
server.on('afterClose', () => {
  console.log('Server closed')
})
```

## 性能优化

### 路由缓存

Vafast 自动缓存路由匹配结果以提高性能：

```typescript
const routes: any[] = [
  {
    method: 'GET',
    path: '/users/:id',
    handler: (req, params) => `User ${params?.id}`,
    cache: {
      ttl: 300, // 5 分钟缓存
      key: (req, params) => `user:${params?.id}`
    }
  }
]
```

### 中间件优化

```typescript
import { jwt } from '@vafast/jwt'

// 创建认证中间件
const authMiddleware = jwt({ secret: 'your-secret' })

// 使用条件中间件避免不必要的执行
const conditionalMiddleware = (condition: (req: Request) => boolean, middleware: Middleware) => {
  return async (req: Request, next: () => Promise<Response>) => {
    if (condition(req)) {
      return middleware(req, next)
    }
    return next()
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/admin',
    middleware: [
      conditionalMiddleware(
        (req) => req.url.includes('/admin'),
        authMiddleware
      )
    ],
    handler: createHandler(() => 'Admin panel')
  }
])
```

## 部署配置

### 生产环境配置

```typescript
const productionConfig: ServerOptions = {
  port: process.env.PORT || 3000,
  host: '0.0.0.0',
  cors: {
    origin: ['https://yourdomain.com'],
    credentials: true
  },
  compression: true,
  trustProxy: true
}

const server = new Server(routes, productionConfig)
```

### 环境变量

```typescript
const config: ServerOptions = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
  }
}
```

## 测试

### 单元测试

```typescript
import { test, expect } from 'bun:test'
import { Server, defineRoutes, createHandler } from 'vafast'

test('GET /users returns users list', async () => {
  const routes = defineRoutes([
    {
      method: 'GET',
      path: '/users',
      handler: createHandler(() => ['user1', 'user2'])
    }
  ])
  
  const server = new Server(routes)
  const response = await server.fetch(new Request('http://localhost:3000/users'))
  const data = await response.json()
  
  expect(response.status).toBe(200)
  expect(data).toEqual(['user1', 'user2'])
})
```

### 集成测试

```typescript
test('POST /users creates new user', async () => {
  const routes = defineRoutes([
    {
      method: 'POST',
      path: '/users',
      handler: createHandler(
        async ({ body }) => ({
          data: { id: 1, ...body },
          status: 201
        })
      )
    }
  ])
  
  const server = new Server(routes)
  const response = await server.fetch(
    new Request('http://localhost:3000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    })
  )
  
  const data = await response.json()
  
  expect(response.status).toBe(201)
  expect(data.name).toBe('John')
  expect(data.email).toBe('john@example.com')
  expect(data.id).toBe(1)
})
```

## 总结

Vafast 提供了完整的 API 参考，包括：

- ✅ 核心类和接口
- ✅ 类型定义和类型安全
- ✅ 中间件系统
- ✅ 验证配置
- ✅ 生命周期钩子
- ✅ 性能优化
- ✅ 部署配置
- ✅ 测试支持

### 下一步

- 查看 [路由指南](/routing) 了解路由系统
- 学习 [中间件系统](/middleware) 了解中间件用法
- 探索 [组件路由](/component-routing) 了解组件路由功能
- 查看 [最佳实践](/essential/best-practice) 获取开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
