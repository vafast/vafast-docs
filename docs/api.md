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
new Server(routes?: readonly ProcessedRoute[])
```

**参数：**
- `routes`: 由 `defineRoutes()` 返回的路由数组，可省略后通过 `addRoute()` / `addRoutes()` 动态注册

#### 方法

##### `fetch(request: Request): Promise<Response>`

处理 HTTP 请求并返回响应。可导出给 Bun、Cloudflare Workers 等运行时，或通过 `serve()` 启动 Node.js 服务。

```typescript
const server = new Server(routes)
const response = await server.fetch(new Request('http://localhost:3000/api/users'))
```

##### `use(middleware: Middleware): void`

注册全局中间件，作用于所有路由（包括 404/405 响应）。

```typescript
const server = new Server(routes)

server.use(cors())
server.use(requestLogger())
```

##### `addRoute(route: ProcessedRoute): void`

动态添加单个路由。

##### `addRoutes(routes: readonly ProcessedRoute[]): void`

动态批量添加路由，并自动更新全局 `RouteRegistry`。

##### `getRoutes(): Array<{ method: Method; path: string }>`

获取已注册路由的方法与路径列表。

##### `getRoutesWithMeta(): ProcessedRoute[]`

获取完整路由元信息（含 `schema`、`name`、`description` 等），用于 OpenAPI 生成、Webhook 注册等场景。

### ComponentServer

`ComponentServer` 用于创建支持组件路由的服务器。

```typescript
import { ComponentServer } from 'vafast'

const server = new ComponentServer(routes)
export default { fetch: server.fetch }
```

#### 构造函数

```typescript
new ComponentServer(routes: (ComponentRoute | NestedComponentRoute)[])
```

**参数：**
- `routes`: 组件路由配置数组，支持嵌套结构

#### 方法

##### `use(middleware: Middleware): void`

注册全局中间件，与 `Server.use()` 行为一致。

## 类型定义

### ProcessedRoute（Route）

`defineRoutes()` 扁平化后的路由对象，也是 `Server` 内部使用的路由类型（`Route` 为其别名）。

```typescript
interface ProcessedRoute {
  method: Method
  path: string
  handler: (req: Request) => Promise<Response>
  middleware?: Middleware[]
  schema?: RouteSchema
  sse?: boolean
  name?: string
  description?: string
  docs?: {
    tags?: string[]
    security?: unknown[]
    responses?: Record<string, unknown>
  }
  parent?: { path: string; name?: string; description?: string }
  [key: string]: unknown // 允许任意扩展（webhook、permission 等）
}
```

**属性：**
- `method`: HTTP 方法
- `path`: 扁平化后的完整路径
- `handler`: 框架包装后的处理函数
- `middleware`: 合并父级后的中间件数组
- `schema`: TypeBox 验证配置（`body` / `query` / `params` / `headers` / `cookies` / `response`）
- `sse`: 是否为 SSE 流式端点
- `name` / `description`: 路由元信息
- `docs`: OpenAPI 文档配置
- `parent`: 嵌套路由的父级信息
- `[key]`: 插件扩展字段（如 `webhook`、`permission`）

### RouteSchema

路由验证配置，基于 TypeBox：

```typescript
interface RouteSchema {
  body?: TSchema
  query?: TSchema
  params?: TSchema
  headers?: TSchema
  cookies?: TSchema
  response?: TSchema  // 仅用于类型同步，运行时不校验
}
```

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

嵌套路由通过 `defineRoute` 的 `children` 字段定义，由 `defineRoutes()` 自动扁平化：

```typescript
defineRoute({
  path: '/api',
  middleware: [authMiddleware],
  children: [
    defineRoute({
      method: 'GET',
      path: '/users',
      handler: () => ({ users: [] })
    })
  ]
})
```

扁平化后路径为 `/api/users`，中间件自动合并。

## 路由函数

### defineRoutes()

创建路由数组，自动保留字面量类型，支持端到端类型推断。

```typescript
function defineRoutes<const T extends readonly Route[]>(routes: T): T
```

**参数：**
- `routes`: 路由配置数组

**示例：**

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

// 定义并处理路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    schema: { query: Type.Object({ page: Type.Number() }) },
    handler: async ({ query }) => ({ users: [], page: query.page })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: Type.Object({ name: Type.String() }) },
    handler: async ({ body }) => ({ id: '1', name: body.name })
  })
])

// ✅ 类型推断自动工作，无需 as const！
type Api = InferEden<typeof routes>
```

::: tip
`defineRoutes()` 使用 `const T` 泛型自动保留字面量类型，直接从其返回值推断类型即可。
:::

### Middleware

中间件函数类型。

```typescript
type Middleware = (
  req: Request,
  next: (ctx?: unknown) => Promise<Response>
) => Response | Promise<Response>
```

**参数：**
- `req`: HTTP 请求对象
- `next`: 调用下一个中间件；`defineMiddleware` 可通过 `next({ ...ctx })` 向下游注入上下文

**执行顺序（洋葱模型）：**

```
全局中间件 → errorHandler → 路由中间件 → handler
```

`errorHandler` 由框架自动注入，捕获后续链路中的 `VafastError` 及未处理异常。

### RouteHandler

路由处理函数类型。Handler 直接是函数，不再需要 `createHandler` 包装。

```typescript
// 基本类型
type RouteHandler = Handler | ((req: Request) => unknown)

// 推荐使用 defineRoute
import { defineRoute, Type } from 'vafast'

// 无 schema
const route = defineRoute({
  method: 'GET',
  path: '/hello',
  handler: ({ req, params, query }) => {
    return { message: 'Hello' }
  }
})

// 有 schema 验证
const route = defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: Type.Object({ name: Type.String() }) },
  handler: ({ body }) => ({ success: true, name: body.name })
})
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

### serve()

启动 HTTP 服务器，支持优雅关闭和请求超时配置。

```typescript
import { Server, serve } from 'vafast'

const server = new Server(routes)

serve({
  fetch: server.fetch,
  port: 3000,
  hostname: '0.0.0.0',
  gracefulShutdown: true,
  timeout: { requestTimeout: 30000 }
}, () => {
  console.log('Server running on http://localhost:3000')
})
```

### ServeOptions

`serve()` 函数的配置选项。

```typescript
interface ServeOptions {
  /** fetch 处理函数 */
  fetch: FetchHandler
  /** 端口号，默认 3000 */
  port?: number
  /** 主机名，默认 0.0.0.0 */
  hostname?: string
  /** 错误处理函数 */
  onError?: (error: Error) => Response | Promise<Response>
  /** 优雅关闭配置 */
  gracefulShutdown?: boolean | GracefulShutdownOptions
  /** 请求超时配置 */
  timeout?: RequestTimeoutOptions
  /** 请求体大小限制（字节），默认 1MB，设为 0 不限制 */
  bodyLimit?: number
}
```

**属性：**
- `fetch`: 请求处理函数（通常是 `server.fetch`）
- `port`: 服务器端口，默认 3000
- `hostname`: 服务器主机，默认 `0.0.0.0`
- `onError`: 全局错误处理函数
- `gracefulShutdown`: 优雅关闭配置
- `timeout`: 请求超时配置
- `bodyLimit`: 请求体大小限制（字节），默认 1MB

### GracefulShutdownOptions

优雅关闭配置，用于在 K8s 等环境中平滑关闭服务。

```typescript
interface GracefulShutdownOptions {
  /** 关闭超时时间（毫秒），默认 30000 */
  timeout?: number
  /** 关闭前回调 */
  onShutdown?: () => void | Promise<void>
  /** 关闭完成回调 */
  onShutdownComplete?: () => void
  /** 监听的信号，默认 ['SIGINT', 'SIGTERM'] */
  signals?: NodeJS.Signals[]
}
```

**示例：**

```typescript
serve({
  fetch: server.fetch,
  port: 3000,
  gracefulShutdown: {
    timeout: 30000,
    onShutdown: () => console.log('收到关闭信号，等待请求完成...'),
    onShutdownComplete: () => console.log('服务器已关闭')
  }
})
```

### RequestTimeoutOptions

请求超时配置，用于防止 DoS 攻击和资源泄漏。

默认行为与 Fastify 和 Node.js 一致：
- `requestTimeout`: 0（无限制）
- `headersTimeout`: 使用 Node.js 默认值 60000ms
- `keepAliveTimeout`: 使用 Node.js 默认值 5000ms

```typescript
interface RequestTimeoutOptions {
  /**
   * 单个请求的最大处理时间（毫秒）
   * - 默认: 0（无限制）
   * - 建议: 如果没有反向代理，设置为 30000-120000 以防 DoS
   */
  requestTimeout?: number
  /**
   * 接收完整请求头的超时时间（毫秒）
   * - 不设置则使用 Node.js 默认值（60000ms）
   */
  headersTimeout?: number
  /**
   * Keep-Alive 连接空闲超时时间（毫秒）
   * - 不设置则使用 Node.js 默认值（5000ms）
   */
  keepAliveTimeout?: number
  /**
   * 超时时返回的 JSON 响应
   * - 默认: { code: 504, message: "Request timeout" }
   */
  timeoutResponse?: { code: number; message: string }
}
```

**示例：**

```typescript
// 基础配置：只设置请求超时
serve({
  fetch: server.fetch,
  port: 3000,
  timeout: {
    requestTimeout: 30000  // 30 秒超时
  }
})

// 完整配置
serve({
  fetch: server.fetch,
  port: 3000,
  timeout: {
    requestTimeout: 30000,
    headersTimeout: 60000,
    keepAliveTimeout: 5000,
    timeoutResponse: {
      code: 504,
      message: '请求超时，请稍后重试'
    }
  }
})
```

::: tip 何时需要设置 requestTimeout
- **有反向代理（Nginx/K8s Ingress）**：通常不需要设置，代理会处理超时
- **无反向代理**：建议设置 30-120 秒，防止慢速 DoS 攻击
:::

### bodyLimit

请求体大小限制，防止大请求 DoS 攻击。

```typescript
serve({
  fetch: server.fetch,
  port: 3000,
  bodyLimit: 1048576,  // 1MB（默认值）
})
```

**配置说明：**

| 值 | 说明 |
|------|------|
| `undefined` | 使用默认值 1MB |
| `0` | 不限制请求体大小 |
| `n` | 限制为 n 字节 |

**超过限制时返回：**

```json
{
  "code": 413,
  "message": "Payload Too Large",
  "limit": 1048576
}
```

**常用大小参考：**

```typescript
bodyLimit: 1024 * 1024,      // 1MB（默认）
bodyLimit: 10 * 1024 * 1024, // 10MB（文件上传）
bodyLimit: 100 * 1024,       // 100KB（纯 JSON API）
bodyLimit: 0,                // 不限制
```

### trustProxy

信任代理配置，用于在反向代理（Nginx、K8s Ingress、Cloudflare）后获取真实客户端 IP。

```typescript
serve({
  fetch: server.fetch,
  port: 3000,
  trustProxy: true,  // 信任所有代理
})
```

**配置选项：**

| 值 | 说明 |
|------|------|
| `true` | 信任所有代理，从 X-Forwarded-For 等头获取 IP |
| `false` | 不信任代理，使用 socket IP（默认） |
| `string` | 信任特定 IP 或 CIDR，如 `"127.0.0.1"` 或 `"10.0.0.0/8"` |
| `string[]` | 信任多个 IP 或 CIDR |

**支持的代理头（按优先级）：**

1. `X-Forwarded-For` - 标准代理头
2. `X-Real-IP` - Nginx
3. `X-Client-IP` - Apache
4. `CF-Connecting-IP` - Cloudflare
5. `Fastly-Client-IP` - Fastly
6. `X-Cluster-Client-IP` - GCP
7. `True-Client-IP` - Akamai & Cloudflare
8. `Fly-Client-IP` - Fly.io
9. `X-Forwarded` / `Forwarded-For` / `Forwarded` - RFC 7239
10. `AppEngine-User-IP` - GCP AppEngine
11. `CF-Pseudo-IPv4` - Cloudflare IPv6 兼容

**使用方式：**

```typescript
import type { VafastRequest } from 'vafast'

serve({
  fetch: (req: VafastRequest) => {
    // 启用 trustProxy 后，request 对象会附加 ip 和 ips 属性
    const ip = req.ip;       // 客户端真实 IP（类型安全）
    const ips = req.ips;     // 代理链中的所有 IP
    return new Response(`Your IP: ${ip}`);
  },
  port: 3000,
  trustProxy: true,
})
```

::: warning 安全提示
只有当应用部署在可信的反向代理后面时才启用 trustProxy。
直接暴露到公网时启用会导致 IP 伪造风险。
:::

### ServeResult

`serve()` 函数的返回值。

```typescript
interface ServeResult {
  /** Node.js HTTP Server 实例 */
  server: HttpServer
  /** 服务器端口 */
  port: number
  /** 服务器主机名 */
  hostname: string
  /** 立即关闭服务器 */
  stop: () => Promise<void>
  /** 优雅关闭（等待现有请求完成） */
  shutdown: () => Promise<void>
}
```

### Server 与 serve 的职责划分

`Server` 只负责路由匹配与请求处理，**不接受** `port` / `cors` 等运行时配置。服务器启动、超时、代理信任等选项通过 `serve()` 配置：

```typescript
import { Server, serve } from 'vafast'
import { cors } from '@vafast/cors'

const server = new Server(routes)
server.use(cors({ origin: ['https://yourdomain.com'] }))

serve({
  fetch: server.fetch,
  port: Number(process.env.PORT) || 3000,
  hostname: '0.0.0.0',
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024,
  gracefulShutdown: true,
  timeout: { requestTimeout: 30000 }
})
```

## 中间件类型

### 官方中间件包

Vafast 提供独立的中间件包，功能更丰富：

| 包名 | 功能 | 文档 |
|------|------|------|
| `@vafast/auth-middleware` | JWT/API Key + app 认证（对接 auth-server） | [查看](/middleware/auth-middleware) |
| `@vafast/cors` | CORS 跨域处理 | [查看](/middleware/cors) |
| `@vafast/jwt` | JWT 认证 | [查看](/middleware/jwt) |
| `@vafast/rate-limit` | 速率限制 | [查看](/middleware/rate-limit) |

#### 示例：CORS

```typescript
import { Server } from 'vafast'
import { cors } from '@vafast/cors'

const server = new Server(routes)

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
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware],
    handler: () => 'Admin panel'
  })
])
```

::: tip 生产环境
对接 auth-server 的微服务请使用 [@vafast/auth-middleware](/middleware/auth-middleware)，而非 `@vafast/jwt`。
:::

#### 示例：速率限制

```typescript
import { rateLimit } from '@vafast/rate-limit'

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100次请求
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    middleware: [rateLimitMiddleware],
    handler: () => 'Login'
  })
])
```

## 工具函数

### defineRoute

定义类型安全的路由，支持叶子路由与嵌套路由两种形式。

```typescript
import { defineRoute, Type } from 'vafast'

// 叶子路由
const userRoute = defineRoute({
  method: 'GET',
  path: '/users/:id',
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: ({ params }) => ({ id: params.id })
})

// 嵌套路由
const apiGroup = defineRoute({
  path: '/api',
  middleware: [authMiddleware],
  children: [
    defineRoute({
      method: 'GET',
      path: '/profile',
      handler: ({ user }) => ({ name: user.name }) // user 来自 authMiddleware
    })
  ]
})
```

### defineRoutes

将路由数组扁平化并保留字面量类型，供 `vafast-api-client` 推断：

```typescript
const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: () => ({ users: [] }) })
])

type Api = InferEden<typeof routes> // 无需 as const
```

### defineMiddleware

定义带类型注入的中间件，通过 `next(ctx)` 向下游传递上下文：

```typescript
import { defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware<{ user: { id: string } }>((req, next) => {
  const user = getUserFromToken(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)
  return next({ user })
})
```

### withContext

为父级中间件注入的上下文创建预设类型的路由定义器：

```typescript
import { withContext } from 'vafast'

export const defineAuthRoute = withContext<{ userInfo: UserInfo }>()

defineAuthRoute({
  method: 'GET',
  path: '/profile',
  handler: ({ userInfo }) => ({ id: userInfo.id })
})
```

### SSE 端点

通过 `sse: true` 声明流式端点。handler 写 `async function*` 即可，框架内部自动包装为 SSE（**无需 `createSSEHandler`**）：

```typescript
import { defineRoute, defineRoutes, Type, sse } from 'vafast'

// handler 提前定义为常量（生产惯例）
const streamHandler = defineRoute({
  method: 'GET',
  path: '/stream/:id',
  sse: true,
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: async function* ({ params }) {
    yield { taskId: params.id }
    yield sse({ event: 'complete' }, { done: true })
  },
})

const routes = defineRoutes([streamHandler])
```

**SSE 辅助函数 `sse()`：**

需要自定义 `event` / `id` / `retry` 元数据时使用：

```typescript
yield sse({ event: 'status', id: '42', retry: 5000 }, { online: true })
```

> 📖 详细文档见 [SSE 流式响应](/essential/sse)

## 请求解析工具

Vafast 提供了一系列请求解析函数，用于从请求中提取数据。

### parseBody()

解析请求体，自动根据 Content-Type 处理 JSON、表单等格式。

```typescript
import { parseBody } from 'vafast'

const handler = async ({ req }) => {
  const body = await parseBody(req)
  return { received: body }
}
```

**支持的格式：**
- `application/json` → 解析为 JSON 对象
- `application/x-www-form-urlencoded` → 解析为对象
- 其他 → 返回原始文本

**HTTP 方法限制：**
- GET/HEAD 请求调用此函数返回 `null`（防御性设计）
- POST、PUT、PATCH、DELETE 正常解析

### parseFormData()

解析 multipart/form-data 格式的表单数据，支持文件上传。

```typescript
import { parseFormData } from 'vafast'

const handler = async ({ req }) => {
  const formData = await parseFormData(req)
  // formData.fields: 普通表单字段
  // formData.files: 上传的文件
  return { fields: formData.fields }
}
```

**返回类型：**

```typescript
interface FormData {
  fields: Record<string, string>
  files: Record<string, FileInfo>
}

interface FileInfo {
  name: string      // 文件名
  type: string      // MIME 类型
  size: number      // 文件大小（字节）
  data: Buffer      // 文件内容
}
```

**HTTP 方法限制：**
- GET/HEAD 请求调用会抛出错误
- POST、PUT、PATCH、DELETE 正常解析

### parseFile()

解析单个文件上传，适用于只上传一个文件的场景。

```typescript
import { parseFile } from 'vafast'

const handler = async ({ req }) => {
  const file = await parseFile(req)
  await saveFile(file.name, file.data)
  return { filename: file.name, size: file.size }
}
```

**HTTP 方法最佳实践：**

| 方法 | 用途 | 示例 |
|------|------|------|
| **POST** | 上传新文件，服务器生成 ID | `POST /files` |
| **PUT** | 上传到指定位置，或替换文件 | `PUT /files/abc123` |

### parseQuery()

解析 URL 查询参数。

```typescript
import { parseQuery } from 'vafast'

// URL: /users?page=1&limit=10&filter[name]=john
const handler = async ({ req }) => {
  const query = parseQuery(req)
  // { page: '1', limit: '10', filter: { name: 'john' } }
  return { query }
}
```

### parseHeaders()

解析请求头为对象。

```typescript
import { parseHeaders } from 'vafast'

const handler = async ({ req }) => {
  const headers = parseHeaders(req)
  const token = headers['authorization']
  return { hasAuth: !!token }
}
```

### parseCookies()

解析 Cookie 为对象。

```typescript
import { parseCookies } from 'vafast'

const handler = async ({ req }) => {
  const cookies = parseCookies(req)
  const sessionId = cookies['sessionId']
  return { sessionId }
}
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

在 Handler 中，返回值会自动转换为 Response：

```typescript
handler: () => {
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
import { defineRoute, defineRoutes, json, err, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: async ({ params }) => {
      const user = await db.findUser(params.id)
      
      if (!user) {
        throw err.notFound('用户不存在')
      }
      
      return user  // 200 + JSON
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
      if (await db.emailExists(body.email)) {
        throw err.conflict('邮箱已被注册')
      }
      
      const user = await db.createUser(body)
      return json(user, 201)  // 201 Created
    })
  },
  defineRoute({
    method: 'DELETE',
    path: '/users/:id',
    handler: async ({ params }) => {
      await db.deleteUser(params.id)
      return null  // 204 No Content
    }
  })
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
import { defineRoute, defineRoutes, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 18 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    // 使用 defineRoute 自动验证
    schema: { body: userSchema },
    handler: ({ body }) => {
      // body 已经通过验证，类型安全
      return { message: 'User created' }
    }
  })
])
```

### 查询参数验证

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

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
  defineRoute({
    method: 'GET',
    path: '/users',
    // 使用 defineRoute 自动解析和验证
    schema: { query: querySchema },
    handler: ({ query }) => {
      // query 已经通过验证，类型安全
      return `Page: ${query.page}, Limit: ${query.limit}, Sort: ${query.sort}`
    }
  })
])
```

## 错误处理

### VafastError 与 err()

框架内置结构化错误类型，配合 `errorHandler` 自动转换为 JSON 响应：

```typescript
import { err, VafastError, isVafastError } from 'vafast'

// 语义化快捷方法
throw err.notFound('用户不存在')
throw err.unauthorized('请先登录')
throw err.badRequest('参数无效')

// 自定义错误
throw new VafastError('内部错误', { status: 500, code: 50001, expose: false })
```

`expose: true` 时错误信息会返回给客户端，否则统一返回通用提示。

## 性能优化

### Radix Tree 路由

基于 Radix Tree 的路由匹配，时间复杂度 O(k)（k 为路径段数）。构造时自动按特异性排序并检测冲突，无需手动配置路由缓存。

### JIT 编译验证器

Schema 验证器在首次使用时编译并缓存：

```typescript
import { validateFast, createValidator, precompileSchemas } from 'vafast'

precompileSchemas([userSchema, postSchema]) // 启动时预编译，避免首请求延迟
```

### 中间件优化

```typescript
import { jwt } from '@vafast/jwt'
import { defineMiddleware, type Middleware } from 'vafast'

const authMiddleware = jwt({ secret: 'your-secret' })

const conditionalMiddleware = (
  condition: (req: Request) => boolean,
  middleware: Middleware
) => {
  return defineMiddleware(async (req, next) => {
    if (condition(req)) {
      return middleware(req, next)
    }
    return next()
  })
}

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [
      conditionalMiddleware(
        (req) => req.url.includes('/admin'),
        authMiddleware
      )
    ],
    handler: () => 'Admin panel'
  })
])
```

## 部署配置

### 生产环境配置

```typescript
import { Server, serve } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'

const server = new Server(routes)
server.use(cors({ origin: ['https://yourdomain.com'], credentials: true }))
server.use(helmet())

serve({
  fetch: server.fetch,
  port: Number(process.env.PORT) || 3000,
  hostname: '0.0.0.0',
  trustProxy: true,
  gracefulShutdown: { timeout: 30000 },
  timeout: { requestTimeout: 30000 }
})
```

### 环境变量

```typescript
serve({
  fetch: server.fetch,
  port: parseInt(process.env.PORT || '3000'),
  hostname: process.env.HOST || '0.0.0.0',
  trustProxy: process.env.TRUST_PROXY === 'true'
})
```

## 测试

### 单元测试

```typescript
import { test, expect } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'

test('GET /users returns users list', async () => {
  const routes = defineRoutes([
    defineRoute({
      method: 'GET',
      path: '/users',
      handler: () => ['user1', 'user2']
    })
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
    defineRoute({
      method: 'POST',
      path: '/users',
      handler: async ({ body }) => ({
        data: { id: 1, ...body },
        status: 201
      })
    })
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

## 监控模块

Vafast 内置了零依赖的监控系统，位于 `vafast/monitoring`。

### withMonitoring

为 Server 添加监控能力。

```typescript
import { Server } from 'vafast'
import { withMonitoring } from 'vafast/monitoring'

const server = new Server(routes)
const monitored = withMonitoring(server, {
  slowThreshold: 500,
  excludePaths: ['/health']
})
```

### MonitoringConfig

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用监控 |
| `console` | `boolean` | `true` | 是否输出到控制台 |
| `slowThreshold` | `number` | `1000` | 慢请求阈值（毫秒） |
| `maxRecords` | `number` | `1000` | 最大记录数 |
| `samplingRate` | `number` | `1` | 采样率 0-1 |
| `excludePaths` | `string[]` | `[]` | 排除的路径 |
| `onRequest` | `(metrics) => void` | - | 请求完成回调 |
| `onSlowRequest` | `(metrics) => void` | - | 慢请求回调 |

### MonitoredServer 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getMonitoringStatus()` | `MonitoringStatus` | 完整监控状态 |
| `getMonitoringMetrics()` | `MonitoringMetrics[]` | 原始指标数据 |
| `getPathStats(path)` | `PathStats` | 单路径统计 |
| `getTimeWindowStats(ms)` | `TimeWindowStats` | 时间窗口统计 |
| `getRPS()` | `number` | 当前每秒请求数 |
| `getStatusCodeDistribution()` | `StatusCodeDistribution` | 状态码分布 |
| `resetMonitoring()` | `void` | 重置监控数据 |

### MonitoringStatus

```typescript
interface MonitoringStatus {
  enabled: boolean
  uptime: number                    // 服务运行时间（毫秒）
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  avgResponseTime: number           // 平均响应时间
  p50: number                       // P50 响应时间
  p95: number                       // P95 响应时间
  p99: number                       // P99 响应时间
  minTime: number
  maxTime: number
  rps: number                       // 当前 RPS
  statusCodes: StatusCodeDistribution
  timeWindows: {
    last1min: TimeWindowStats
    last5min: TimeWindowStats
    last1hour: TimeWindowStats
  }
  byPath: Record<string, PathStats>
  memoryUsage: { heapUsed: string; heapTotal: string }
  recentRequests: MonitoringMetrics[]
}
```

### TimeWindowStats

```typescript
interface TimeWindowStats {
  requests: number      // 请求数
  successful: number    // 成功数
  failed: number        // 失败数
  errorRate: number     // 错误率
  avgTime: number       // 平均响应时间
  rps: number           // 每秒请求数
}
```

### StatusCodeDistribution

```typescript
interface StatusCodeDistribution {
  '2xx': number
  '3xx': number
  '4xx': number
  '5xx': number
  detail: Record<number, number>  // 详细分布如 { 200: 100, 404: 5 }
}
```

详细用法请参考 [性能监控](/patterns/trace)。

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
- ✅ 内置监控

### 下一步

- 查看 [路由指南](/routing) 了解路由系统
- 学习 [中间件系统](/middleware) 了解中间件用法
- 探索 [组件路由](/component-routing) 了解组件路由功能
- 查看 [性能监控](/patterns/trace) 了解监控功能
- 查看 [最佳实践](/essential/best-practice) 获取开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
