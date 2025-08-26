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

路由处理函数类型。

```typescript
type RouteHandler = (
  req: Request, 
  params?: Record<string, string>
) => Response | Promise<Response>
```

**参数：**
- `req`: HTTP 请求对象
- `params`: 路径参数（可选）

**返回值：** HTTP 响应对象或 Promise

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

### 内置中间件

Vafast 提供了一些内置中间件：

#### authMiddleware

身份验证中间件。

```typescript
import { authMiddleware } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware],
    handler: () => 'Admin panel'
  }
]
```

#### corsMiddleware

CORS 中间件。

```typescript
import { corsMiddleware } from 'vafast'

const routes: any[] = [
  {
    path: '/api',
    middleware: [corsMiddleware],
    children: [
      // API 路由
    ]
  }
]
```

#### rateLimitMiddleware

速率限制中间件。

```typescript
import { rateLimitMiddleware } from 'vafast'

const routes: any[] = [
  {
    method: 'POST',
    path: '/login',
    middleware: [rateLimitMiddleware],
    handler: () => 'Login'
  }
]
```

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

## 错误处理

### 内置错误类型

```typescript
class VafastError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'VafastError'
  }
}
```

### 错误响应

```typescript
const routes: any[] = [
  {
    method: 'GET',
    path: '/error',
    handler: () => {
      throw new VafastError('Something went wrong', 500, 'INTERNAL_ERROR')
    }
  }
]
```

## 验证配置

### 请求体验证

```typescript
const routes: any[] = [
  {
    method: 'POST',
    path: '/users',
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2 },
        email: { type: 'string', format: 'email' },
        age: { type: 'number', minimum: 18 }
      },
      required: ['name', 'email']
    },
    handler: async (req) => {
      const body = await req.json()
      // body 已经通过验证
      return new Response('User created', { status: 201 })
    }
  }
]
```

### 查询参数验证

```typescript
const routes: any[] = [
  {
    method: 'GET',
    path: '/users',
    query: {
      type: 'object',
      properties: {
        page: { type: 'number', minimum: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100 },
        sort: { type: 'string', enum: ['name', 'email', 'created_at'] }
      }
    },
    handler: (req) => {
      const url = new URL(req.url)
      const page = url.searchParams.get('page')
      const limit = url.searchParams.get('limit')
      const sort = url.searchParams.get('sort')
      // 参数已经通过验证
      return `Page: ${page}, Limit: ${limit}, Sort: ${sort}`
    }
  }
]
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
// 使用条件中间件避免不必要的执行
const conditionalMiddleware = (condition: (req: Request) => boolean, middleware: Middleware) => {
  return async (req: Request, next: () => Promise<Response>) => {
    if (condition(req)) {
      return middleware(req, next)
    }
    return next()
  }
}

const routes: any[] = [
  {
    method: 'GET',
    path: '/admin',
    middleware: [
      conditionalMiddleware(
        (req) => req.url.includes('/admin'),
        authMiddleware
      )
    ],
    handler: () => 'Admin panel'
  }
]
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
import { Server } from 'vafast'

test('GET /users returns users list', async () => {
  const routes: any[] = [
    {
      method: 'GET',
      path: '/users',
      handler: () => new Response(JSON.stringify(['user1', 'user2']))
    }
  ]
  
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
  const routes: any[] = [
    {
      method: 'POST',
      path: '/users',
      handler: async (req) => {
        const body = await req.json()
        return new Response(JSON.stringify({ id: 1, ...body }), { status: 201 })
      }
    }
  ]
  
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
