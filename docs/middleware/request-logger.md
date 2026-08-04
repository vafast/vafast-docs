---
title: Request Logger - Vafast
---

# Request Logger

`@vafast/request-logger` 是 HTTP **访问日志中间件**：记录方法、路径、耗时、脱敏后的 headers/body/response，异步上报远程服务，并可双写 stdout。

::: tip 与 @vafast/logger 的区别
| 包 | 用途 |
|----|------|
| `@vafast/logger` | 应用内 `logger.info` / `error`（**不是**中间件） |
| `@vafast/request-logger` | 每个 HTTP 请求的访问日志中间件 |
:::

## 安装

```bash
npm install @vafast/request-logger
```

## 快速开始

`url` 与 `service` **必填**：

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { requestId } from '@vafast/request-id'
import { requestLogger } from '@vafast/request-logger'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => ({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(requestId())
server.use(
  requestLogger({
    url: 'http://log-server:9005/api/logs/ingest',
    service: 'my-server',
  }),
)

serve({ fetch: server.fetch, port: 3000 })
```

默认行为：stdout JSON 双写开启、敏感字段脱敏、上报失败熔断 + 错误节流。

## 用法

### 认证头与排除路径

```typescript
server.use(
  requestLogger({
    url: process.env.LOG_INGEST_URL!,
    service: 'auth-server',
    headers: {
      Authorization: `Bearer ${process.env.LOG_INGEST_TOKEN}`,
    },
    excludePaths: ['/health', '/metrics', /^\/internal/],
  }),
)
```

`excludePaths`：字符串为精确匹配或「前缀 + `/`」；`RegExp` 则 `test(path)`。

### 路由级关闭

在路由定义上设 `log: false`（经框架 `getRoute` 读取）：

```typescript
defineRoute({
  method: 'GET',
  path: '/health',
  log: false,
  handler: () => ({ ok: true }),
})
```

### stdout 双写（K8s）

```typescript
requestLogger({
  url: '...',
  service: 'auth-server',
  stdout: {
    enabled: true, // 默认 true；设 false 可关闭
    format: 'json', // 或 'text'
    includeBody: true,
    includeResponse: false, // 响应体可能很大
  },
})
```

stdout 级别：2xx → 30 (INFO)，4xx → 40 (WARN)，5xx → 50 (ERROR)。

### 自定义业务字段

```typescript
requestLogger({
  url: '...',
  service: 'billing-server',
  getUserId: ({ req }) => req.__locals?.userInfo?.id,
  getAppId: async ({ path, body }) => {
    if (path !== '/notify/alipay') return undefined
    const form = body as Record<string, string>
    return lookupAppId(form.out_trade_no)
  },
  getAuthType: ({ headers }) =>
    headers.authorization?.startsWith('Bearer ak_') ? 'apiKey' : undefined,
})
```

未提供 getter 时的默认：

- `appId` ← header `app-id`
- `authType` ← `Authorization` 前缀启发式（`Bearer ak_` → apiKey，`Bearer eyJ` → jwt）
- `userId` ← 未验签解析 JWT payload 的 `sub` / `userId` / `id`
- `clientKey` ← header `client-key`（Ones App Client）
- `platform` ← header `x-platform`
- `appVersion` ← header `x-app-version`

端字段在 headers 脱敏前解析并写入 ingest **顶层**；缺失或空串为 `null`。log-server 不再从 headers 兜底。

### 采样与熔断

```typescript
requestLogger({
  url: '...',
  service: 'gateway',
  sampleRate: 0.1, // 只记约 10%
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60_000,
  },
  errorThrottle: { interval: 60_000 },
  onError: (error, { droppedCount }) => {
    console.warn(error.message, droppedCount)
  },
})
```

### 与 request-id

优先 `req.id`，否则读 `requestIdHeader`（默认 `x-request-id`）：

```typescript
server.use(requestId())
server.use(requestLogger({ url: '...', service: 'my-server' }))
```

## API完整参数

### `requestLogger(options)`

```typescript
requestLogger(options: RequestLoggerOptions): Middleware
```

`createRequestLogger` 为同名别名（**已废弃**）。

### `RequestLoggerOptions`

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `url` | `string` | **是** | — | 远程 ingest URL |
| `service` | `string` | **是** | — | 服务标识 |
| `headers` | `Record<string, string>` | 否 | `{}` | 上报请求额外头 |
| `timeout` | `number` | 否 | `5000` | 上报超时（毫秒） |
| `enabled` | `boolean` | 否 | `true` | 总开关 |
| `excludePaths` | `(string \| RegExp)[]` | 否 | `[]` | 排除路径 |
| `sanitize` | `SanitizeConfig` | 否 | 内置默认 | body/headers/response 脱敏 |
| `onError` | `(error, { droppedCount }) => void` | 否 | 结构化 warn JSON | 上报失败回调 |
| `circuitBreaker` | `CircuitBreakerConfig` | 否 | 见下 | 熔断 |
| `errorThrottle` | `ErrorThrottleConfig` | 否 | 见下 | 错误节流 |
| `stdout` | `StdoutConfig` | 否 | 见下 | stdout 双写 |
| `sampleRate` | `number` | 否 | `1` | `0–1`，采样率 |
| `requestIdHeader` | `string` | 否 | `'x-request-id'` | 无 `req.id` 时读取的头 |
| `getAppId` | `ContextGetter` | 否 | — | 自定义 appId |
| `getUserId` | `ContextGetter` | 否 | — | 自定义 userId |
| `getAuthType` | `ContextGetter` | 否 | — | 自定义 authType |

`ContextGetter`：

```typescript
(context: RequestLoggerContext) => string | undefined | Promise<string | undefined>
```

`RequestLoggerContext` 含：`req`、`response`、`method`、`url`、`path`、`headers`、`body`、`responseData`。

### `CircuitBreakerConfig`

| 参数 | 默认 | 说明 |
|------|------|------|
| `failureThreshold` | `5` | 连续失败次数后打开熔断 |
| `resetTimeout` | `60000` | 熔断后等待再试（毫秒） |

### `ErrorThrottleConfig`

| 参数 | 默认 | 说明 |
|------|------|------|
| `interval` | `60000` | 同类错误节流间隔（毫秒） |

### `StdoutConfig`

| 参数 | 默认 | 说明 |
|------|------|------|
| `enabled` | `true` | `enabled !== false` 即输出 |
| `format` | `'json'` | `'json'` \| `'text'` |
| `includeBody` | `true` | 是否含请求体 |
| `includeResponse` | `false` | 是否含响应体 |

### `SanitizeConfig`

| 参数 | 默认 | 说明 |
|------|------|------|
| `removeFields` | password / secret 等 | 字段名精确匹配（小写）→ 占位符 |
| `maskFields` | token / authorization 等 | 字段名包含匹配 → 部分脱敏 |
| `placeholder` | `'[REDACTED]'` | 占位 |
| `maxDepth` | `10` | 递归深度 |

另导出：`sanitize`、`sanitizeHeaders`、`isSensitiveField`（见包源码）。

### 上报载荷（示意）

```typescript
{
  method, url, path, headers, body, query,
  status, duration, service,
  appId, authType, userId, clientKey, platform, appVersion,
  ip, traceId, userAgent,
  createdAt, response,
  clientIp?, requestId?
}
```

## 最佳实践

- **必填** `url` + `service`；本地可把 `url` 指到假服务，或 `enabled: false`  
- 先 `requestId()` 再 `requestLogger()`，保证 `traceId` / `requestId` 一致  
- 健康检查、metrics 用 `excludePaths` 或路由 `log: false`  
- 高 QPS 用 `sampleRate`；响应体默认不要开 `stdout.includeResponse`  
- 支付回调等无登录态场景用 `getAppId` 从 body 反查租户

## 注意事项

- 上报在 `next()` **之后异步**执行，不阻塞响应；失败只触发熔断 / `onError`，不影响业务  
- 会在业务前 `req.clone()` 读 body；跳过日志的路径（排除 / `log: false` / 采样）**不会**读 body  
- 没有默认排除 `/health`——需自己配置 `excludePaths`  
- JWT `userId` 默认解析**不验签**，仅用于日志归属  
- sanitize 配置字段是 `removeFields` / `maskFields`，不是 `fields` / `mask`

## 相关链接

- [Logger](/middleware/logger)
- [Request ID](/middleware/request-id)
- [最佳实践](/essential/best-practice)
