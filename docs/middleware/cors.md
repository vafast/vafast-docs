---
title: CORS 中间件 - Vafast
---

# CORS 中间件

这个中间件为自定义 [跨源资源共享](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) 行为提供支持。

安装命令：

```bash
npm add @vafast/cors
```

然后使用它：

```typescript
import { Server, defineRoutes, createHandler, serve } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello World')
  }
])

const server = new Server(routes)
server.use(cors())

serve({ fetch: server.fetch, port: 3000 })
```

这样将使 Vafast 接受来自任何源的请求。

## 配置

以下是该中间件接受的配置

### origin

@默认 `true`

指示是否可以与来自给定来源的请求代码共享响应。

值可以是以下之一：

- **字符串** - 源的名称，会直接分配给 [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) 头部。
- **布尔值** - 如果设置为 true， [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) 将设置为 `*`（任何来源）。
- **RegExp** - 匹配请求 URL 的模式，如果匹配则允许。
- **函数** - 自定义逻辑以允许资源共享，如果返回 true 则允许。
    - 预期具有以下类型：
    ```typescript
    (request: Request) => boolean | void
    ```
- **Array<string | RegExp | Function>** - 按顺序迭代上述所有情况，只要有任何一个值为 `true` 则允许。

---

### methods

@默认 `true`（允许所有方法）

允许的跨源请求方法。

分配 [Access-Control-Allow-Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) 头部。

值可以是以下之一：

- **boolean** - `true` 允许所有方法，`false` 忽略。
- **undefined | null | ''** - 忽略所有方法。
- **\*** - 允许所有方法。
- **字符串** - 期望单个方法或逗号分隔的字符串
    - (例如: `'GET, PUT, POST'`)
- **string[]** - 允许多个 HTTP 方法。
    - 例如: `['GET', 'PUT', 'POST']`

---

### allowedHeaders

@默认 `true`（允许所有请求头）

允许的传入请求头。

分配 [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) 头部。

值可以是以下之一：

- **true** - 允许所有请求头
- **字符串** - 期望单个头或逗号分隔的字符串
    - 例如: `'Content-Type, Authorization'`。
- **string[]** - 允许多个 HTTP 头。
    - 例如: `['Content-Type', 'Authorization']`

---

### exposeHeaders

@默认 `true`（暴露所有响应头）

响应 CORS 中包含指定的头部。

分配 [Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) 头部。

值可以是以下之一：

- **true** - 暴露所有响应头
- **字符串** - 期望单个头或逗号分隔的字符串。
    - 例如: `'Content-Type, X-Powered-By'`。
- **string[]** - 允许多个 HTTP 头。
    - 例如: `['Content-Type', 'X-Powered-By']`

---

### credentials

@默认 `true`

Access-Control-Allow-Credentials 响应头告诉浏览器在请求的凭证模式 [Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) 为 `include` 时，是否将响应暴露给前端 JavaScript 代码。

凭证包括 cookies、授权头或 TLS 客户端证书。

分配 [Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) 头部。

---

### maxAge

@默认 `5`

指示 [预检请求](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) 的结果（即包含在 [Access-Control-Allow-Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) 和 [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) 头部中的信息）可以缓存多久（秒）。

分配 [Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age) 头部。

---

### preflight

@默认 `true`

预检请求是用来检查 CORS 协议是否被理解以及服务器是否知道如何使用特定方法和头部的请求。

此配置指示服务器是否应该自动响应 OPTIONS 预检请求。

## 示例

以下是使用该中间件的常见模式。

### 按顶级域名允许 CORS

```typescript
import { Server, defineRoutes, createHandler, serve } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => '你好')
  }
])

const server = new Server(routes)
server.use(cors({
  origin: /.*\.example\.com$/
}))

serve({ fetch: server.fetch, port: 3000 })
```

这将允许来自顶级域名 `example.com` 的请求。

### 指定允许的源

```typescript
server.use(cors({
  origin: ['https://example.com', 'https://app.example.com']
}))
```

### 使用函数动态判断

```typescript
server.use(cors({
  origin: (request) => {
    const origin = request.headers.get('origin')
    return origin?.endsWith('.example.com') ?? false
  }
}))
```

### 限制允许的方法和头

```typescript
server.use(cors({
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
```
