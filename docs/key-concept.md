---
title: 关键概念 - Vafast
---

# 关键概念

Vafast 是一个专为 Bun 运行时设计的高性能 Web 框架。了解这些核心概念将帮助你更好地使用 Vafast 构建应用。

## 🏗️ 架构概览

Vafast 采用模块化架构设计，主要包含以下核心组件：

- **Server**: 主要的服务器类，负责处理请求和响应
- **Router**: 路由匹配和分发系统
- **Middleware**: 中间件系统，用于扩展功能
- **Types**: 完整的类型定义系统
- **Utils**: 工具函数和辅助类

## 🚀 Server 类

`Server` 类是 Vafast 的核心，继承自 `BaseServer`，提供了完整的 HTTP 服务器功能。

### 主要特性

- **路由管理**: 自动扁平化嵌套路由
- **中间件支持**: 全局和路由级中间件
- **错误处理**: 内置的错误处理机制
- **性能优化**: 智能路由排序和冲突检测

### 基本用法

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello World')
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## 🛣️ 路由系统

Vafast 的路由系统基于配置对象，支持静态路径、动态参数和嵌套路由。

### 路由配置

```typescript
interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
  path: string
  handler: Handler
  middleware?: Middleware[]
  body?: any
  query?: any
  params?: any
  headers?: any
  cookies?: any
}
```

### 路径匹配

Vafast 使用智能路径匹配算法，支持：

- **静态路径**: `/users`
- **动态参数**: `/users/:id`
- **嵌套路由**: 支持父子路由结构

### 路由优先级

路由按特异性自动排序：
1. 静态路径（最高优先级）
2. 动态参数（`:param`）
3. 通配符（`*`）

## 🔧 中间件系统

中间件是 Vafast 中扩展功能的核心机制，支持全局和路由级中间件。

### 中间件类型

```typescript
type Middleware = (
  req: Request, 
  next: () => Promise<Response>
) => Promise<Response>
```

### 中间件链

中间件按以下顺序执行：
1. 全局中间件
2. 路由级中间件
3. 路由处理器

### 中间件示例

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 日志中间件
const loggingMiddleware = async (req: Request, next: () => Promise<Response>) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
}

// 认证中间件
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  return await next()
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/protected',
    handler: createRouteHandler(() => 'Protected content'),
    middleware: [authMiddleware]
  }
])

const server = new Server(routes)
server.use(loggingMiddleware) // 全局中间件
```

## 📝 类型系统

Vafast 提供完整的 TypeScript 支持，包括类型安全的处理器和验证器。

### 处理器类型

```typescript
type Handler = (context: HandlerContext) => Response | Promise<Response>

interface HandlerContext {
  req: Request
  params?: Record<string, string>
  body?: any
  query?: any
  headers?: any
  cookies?: any
}
```

### Schema 验证

Vafast 集成了 TypeBox 进行运行时类型验证：

```typescript
import { Type } from '@sinclair/typebox'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ pattern: '^[^@]+@[^@]+\\.[^@]+$' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      // body 已经通过验证，类型安全
      return { success: true, user: body }
    }),
    body: userSchema
  }
])
```

## 🎯 路由处理器工厂

`createRouteHandler` 函数用于创建类型安全的路由处理器，自动处理参数解构和类型推断。

### 基本用法

```typescript
// 简单处理器
const simpleHandler = createRouteHandler(() => 'Hello')

// 带参数的处理器
const paramHandler = createRouteHandler(({ params }) => `ID: ${params.id}`)

// 带请求体的处理器
const bodyHandler = createRouteHandler(async ({ req, body }) => {
  const data = await req.json()
  return { received: data, validated: body }
})
```

### 高级用法

```typescript
// 带多个验证的处理器
const fullHandler = createRouteHandler(
  ({ params, body, query, headers }) => {
    return {
      params,
      body,
      query,
      headers
    }
  },
  {
    body: userSchema,
    query: querySchema,
    params: paramsSchema
  }
)
```

## 🔄 请求处理流程

Vafast 的请求处理流程如下：

1. **请求接收**: 接收 HTTP 请求
2. **路由匹配**: 根据路径和方法匹配路由
3. **中间件执行**: 按顺序执行全局和路由中间件
4. **参数解析**: 解析路径参数、查询参数等
5. **Schema 验证**: 验证请求数据（如果配置了）
6. **处理器执行**: 执行路由处理器
7. **响应返回**: 返回 HTTP 响应

## 🚀 性能特性

Vafast 针对性能进行了多项优化：

- **路由预排序**: 构造时按特异性排序路由
- **中间件链优化**: 扁平化嵌套路由的中间件链
- **智能路径匹配**: 高效的路径匹配算法
- **内存优化**: 最小化内存分配和复制

## 📚 下一步

现在你已经了解了 Vafast 的核心概念，建议你：

1. 查看 [路由指南](/routing) 学习如何定义复杂路由
2. 阅读 [中间件系统](/middleware) 了解如何扩展功能
3. 探索 [API 参考](/api) 查看完整的 API 文档
4. 查看 [示例代码](/examples) 获取更多实践示例

如果你有任何问题，欢迎在我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 社区询问。