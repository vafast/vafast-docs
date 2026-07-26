---
title: Request ID 中间件 - Vafast
---

# Request ID

`@vafast/request-id` 为每个请求生成唯一 ID：写入 `req.id`、经 `next({ requestId })` 注入 handler 上下文，并回写到响应头（默认 `X-Request-Id`）。

## 安装

```bash
npm install @vafast/request-id
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { requestId } from '@vafast/request-id'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: ({ requestId: id, req }) => ({
      fromContext: id,
      fromReq: req.id,
    }),
  }),
])

const server = new Server(routes)
server.use(requestId())
serve({ fetch: server.fetch, port: 3000 })
```

响应会带上：

```
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

## 用法

### 从 handler 读取

中间件执行 `next({ requestId })`，handler 可直接解构；同时也挂在 `req.id`：

```typescript
defineRoute({
  method: 'GET',
  path: '/work',
  handler: ({ requestId: id, req }) => {
    console.log(id, req.id) // 同一值
    return { ok: true }
  },
})
```

### 类型安全辅助

```typescript
import { getRequestId } from '@vafast/request-id'

const id = getRequestId(req) // string | undefined
```

### 自定义生成器 / 响应头

```typescript
import { requestId } from '@vafast/request-id'

server.use(
  requestId({
    generator: () => `req-${Date.now()}`,
    headerName: 'X-Correlation-Id',
  }),
)
```

### 分布式追踪（复用上游 ID）

默认 `useExisting: true`：若入站请求已有同名头，则复用，不再生成。

```typescript
server.use(
  requestId({
    headerName: 'X-Request-Id',
    existingHeaderName: 'X-Trace-Id', // 从另一请求头读取
  }),
)

// 始终生成新 ID
server.use(requestId({ useExisting: false }))
```

### 与 request-logger 配合

```typescript
import { requestId } from '@vafast/request-id'
import { requestLogger } from '@vafast/request-logger'

server.use(requestId()) // 先挂，写入 req.id
server.use(
  requestLogger({
    url: process.env.LOG_INGEST_URL!,
    service: 'my-server',
  }),
)
```

`request-logger` 会优先读 `req.id`，再回退到 `x-request-id` 头。

## API完整参数

### `requestId(options?)`

返回 Vafast 中间件。

#### `RequestIdOptions`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `generator` | `() => string` | `crypto.randomUUID()` | 自定义 ID 生成器 |
| `headerName` | `string` | `'X-Request-Id'` | 写入响应头的名称 |
| `useExisting` | `boolean` | `true` | 是否复用入站请求头中的 ID |
| `existingHeaderName` | `string` | 同 `headerName` | 读取已有 ID 的请求头名称 |

行为摘要：

1. 若 `useExisting`，从 `existingHeaderName` 读入站 ID  
2. 没有则调用 `generator()`  
3. 赋给 `req.id`，并 `next({ requestId: id })`  
4. 克隆响应，设置 `headerName` 后返回  

### `getRequestId(req)`

```typescript
getRequestId(req: Request): string | undefined
```

读取 `req.id`，未挂中间件时为 `undefined`。

### 类型

```typescript
type IdGenerator = () => string

interface RequestIdOptions {
  generator?: IdGenerator
  headerName?: string
  useExisting?: boolean
  existingHeaderName?: string
}
```

包还通过 `declare global` 给 `Request` 增加可选 `id?: string`。

## 最佳实践

- **尽早挂载**：放在需要关联日志的中间件之前（尤其是 `request-logger`）  
- **链路统一头名**：网关与服务约定同一 `X-Request-Id`，保持 `useExisting: true`  
- **业务日志带上 ID**：`logger.info({ requestId: id }, '...')`，便于与访问日志关联  
- 需要短 ID 时用自定义 `generator`（如 nanoid），不要改全局 `crypto`

## 注意事项

- 中间件会**新建 Response** 以写入响应头；原 `response.body` 流会被转发，勿在下游重复消费后依赖同一 body  
- `useExisting: true` 时信任入站头内容，不做格式校验——网关侧应校验或清洗  
- `@vafast/logger` **不是**请求中间件；应用日志需自行带上 `requestId`  
- handler 里同时可用上下文 `requestId` 与 `req.id`，二者为同一字符串

## 相关链接

- [Request Logger](/middleware/request-logger)
- [Logger](/middleware/logger)
- [中间件概览](/middleware)
