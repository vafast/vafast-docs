---
title: 关键概念 - Vafast
---

# 关键概念

Vafast 是一个高性能的 TypeScript Web 框架，支持 Node.js、Bun 等多种运行时。了解这些核心概念将帮助你更好地使用 Vafast 构建应用。

## 架构概览

Vafast 采用模块化架构设计，主要包含以下核心组件：

- **Server**: 主要的服务器类，负责处理请求和响应
- **Router**: 路由匹配和分发系统
- **Middleware**: 中间件系统，用于扩展功能
- **Types**: 完整的类型定义系统
- **Utils**: 工具函数和辅助类

## Server 类

`Server` 类是 Vafast 的核心，继承自 `BaseServer`，提供了完整的 HTTP 服务器功能。

### 主要特性

- **路由管理**: 自动扁平化嵌套路由
- **中间件支持**: 全局和路由级中间件
- **错误处理**: 内置的错误处理机制
- **性能优化**: 智能路由排序和冲突检测

### 基本用法

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

> **新框架用法说明**：
> - 所有路由必须使用 `defineRoute` 包装
> - Handler 直接是函数，不再需要 `createHandler` 包装

## 路由系统

Vafast 的路由系统基于配置对象，支持静态路径、动态参数和嵌套路由。

### 路由配置

```typescript
// 使用 defineRoute 定义路由
defineRoute({
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
  path: string,
  handler: (ctx: HandlerContext) => Response | Promise<Response>,
  middleware?: Middleware[],
  schema?: {
    body?: TSchema,
    query?: TSchema,
    params?: TSchema,
    headers?: TSchema,
    cookies?: TSchema
  },
  name?: string,
  description?: string
})
```

> **新框架用法说明**：
> - Schema 验证统一在 `schema` 字段中定义，不再使用独立的 `body`、`query` 等字段
> - 支持路由元信息：`name`、`description` 等

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

## 中间件系统

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
import { Server, defineRoute, defineRoutes, defineMiddleware, json } from 'vafast'

// 日志中间件
const loggingMiddleware = defineMiddleware(async (req, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
})

// 认证中间件
const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return await next()
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/protected',
    handler: () => 'Protected content',
    middleware: [authMiddleware]
  })
])

const server = new Server(routes)
server.use(loggingMiddleware) // 全局中间件
```

> **新框架用法说明**：
> - 中间件使用 `defineMiddleware` 定义，支持类型注入
> - 全局中间件使用 `server.use()` 方法
> - Handler 不再需要 `createHandler` 包装

## 类型系统

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
import { defineRoute, defineRoutes, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ pattern: '^[^@]+@[^@]+\\.[^@]+$' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => {
      // body 已经通过验证，类型安全
      return { success: true, user: body }
    }
  })
])
```

> **新框架用法说明**：
> - Schema 验证在路由配置的 `schema` 字段中定义
> - Handler 直接接收验证后的数据，自动获得类型推断

## 路由定义系统

`defineRoute` 函数用于定义类型安全的路由，自动处理参数解构和类型推断。

### 基本用法

```typescript
import { defineRoute } from 'vafast'

// 简单路由
const simpleRoute = defineRoute({
  method: 'GET',
  path: '/',
  handler: () => 'Hello'
})

// 带路径参数的路由
const paramRoute = defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => `ID: ${params.id}`
})

// 带 Schema 验证的路由
const validatedRoute = defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: Type.Object({ name: Type.String() }) },
  handler: ({ body }) => {
    // body 已通过验证，类型安全
    return { received: body }
  }
})
```

> **新框架用法说明**：
> - 不再使用 `createHandler` 函数
> - Handler 直接是函数，在路由配置中定义
> - Schema 验证在 `schema` 字段中定义

### 高级用法

```typescript
// 带多个验证的路由
const fullRoute = defineRoute({
  method: 'POST',
  path: '/users/:id',
  schema: {
    body: userSchema,
    query: querySchema,
    params: paramsSchema
  },
  handler: ({ params, body, query, headers }) => {
    return {
      params,
      body,
      query,
      headers
    }
  }
})
```

> **新框架用法说明**：
> - Schema 验证统一在 `schema` 字段中定义
> - Handler 直接接收所有验证后的数据

## 请求处理流程

Vafast 的请求处理流程如下：

1. **请求接收**: 接收 HTTP 请求
2. **路由匹配**: 根据路径和方法匹配路由
3. **中间件执行**: 按顺序执行全局和路由中间件
4. **参数解析**: 解析路径参数、查询参数等
5. **Schema 验证**: 验证请求数据（如果配置了）
6. **处理器执行**: 执行路由处理器
7. **响应返回**: 返回 HTTP 响应

## 性能优化

Vafast 内置多项性能优化技术，无需额外配置即可获得高性能：

### JIT 编译验证器

Schema 验证器在首次使用时编译并缓存，后续验证直接使用编译后的代码：

```typescript
import { createValidator, validateFast, precompileSchemas } from 'vafast'
import { Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String(),
  age: Type.Number()
})

// 方式一：自动缓存（推荐）
const isValid = validateFast(UserSchema, data)

// 方式二：预编译验证器（最高性能）
const validateUser = createValidator(UserSchema)
const result = validateUser(data)

// 启动时预编译（避免首次请求开销）
precompileSchemas([UserSchema, PostSchema])
```

**性能效果：10000 次验证仅需 ~5ms**

### 快速请求解析

提供优化的解析函数，比标准方法快约 2x：

```typescript
import { parseQueryFast, getCookie, getHeader } from 'vafast'

// 快速解析查询参数（简单场景）
const query = parseQueryFast(req)

// 获取单个 Cookie（避免解析全部）
const sessionId = getCookie(req, 'sessionId')

// 获取单个请求头
const token = getHeader(req, 'Authorization')
```

### Radix Tree 路由

基于 Radix Tree 的高效路由匹配，时间复杂度 O(k)（k 为路径段数）：

- **路由预排序**: 构造时按特异性排序
- **智能路径匹配**: 静态路径 > 动态参数 > 通配符
- **冲突检测**: 自动检测并警告路由冲突

## 下一步

现在你已经了解了 Vafast 的核心概念，建议你：

1. 查看 [路由指南](/routing) 学习如何定义复杂路由
2. 阅读 [中间件系统](/middleware) 了解如何扩展功能
3. 探索 [API 参考](/api) 查看完整的 API 文档
4. 查看 [示例代码](/examples) 获取更多实践示例

如果你有任何问题，欢迎在我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 社区询问。