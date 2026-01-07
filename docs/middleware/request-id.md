---
title: Request ID 中间件 - Vafast
---

# Request ID 中间件

为每个请求生成唯一标识符，用于日志追踪和调试。

## 安装

```bash
npm install @vafast/request-id
```

## 使用

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'
import { requestId } from '@vafast/request-id'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(({ requestId }) => {
      return { requestId, message: 'Hello World' }
    })
  }
])

const server = new Server(routes)
server.use(requestId())

export default { fetch: server.fetch }
```

响应头会自动包含 `X-Request-Id`：

```
HTTP/1.1 200 OK
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{"requestId":"550e8400-e29b-41d4-a716-446655440000","message":"Hello World"}
```

## 配置项

```typescript
requestId({
  // 自定义请求 ID 生成器
  generator: () => crypto.randomUUID(),
  
  // 响应头名称
  headerName: 'X-Request-Id',
  
  // 是否使用请求中已有的 ID
  useExisting: true
})
```

### generator

自定义 ID 生成函数。默认使用 `crypto.randomUUID()`。

```typescript
import { nanoid } from 'nanoid'

requestId({
  generator: () => nanoid()
})
```

### headerName

响应头中的字段名，默认为 `X-Request-Id`。

### useExisting

如果请求头中已包含 Request ID，是否复用。默认为 `true`。

## 日志追踪

结合 Logger 使用，实现完整的请求追踪：

```typescript
import { requestId } from '@vafast/request-id'
import { logger } from '@vafast/logger'

server.use(requestId())
server.use(logger({
  format: ({ method, path, status, duration, requestId }) => {
    return `[${requestId}] ${method} ${path} ${status} ${duration}ms`
  }
}))
```

## 相关链接

- [GitHub](https://github.com/vafast/vafast-request-id)
- [npm](https://www.npmjs.com/package/@vafast/request-id)

