---
title: Webhook 中间件 - Vafast
---

# Webhook

`@vafast/webhook`：在路由上声明 `webhook`，当 handler 返回 **HTTP 2xx 且 `Content-Type` 含 `application/json`** 时，中间件在响应返回后 **异步** 向订阅方推送事件。

它解决的是「业务接口成功后，如何把同一份结果可靠地通知外部系统」，而不是替代业务 API 本身。

## 先搞清几个概念（给新用户）

### 事件（event）是什么？

一次 webhook 对应一个 **事件键** `eventKey`（如 `user.created`、`auth.signIn`）。中间件根据当前请求匹配到的路由，解析出 `eventKey`，再向 storage 查询「谁订阅了这个事件」，然后逐个投递。

`eventKey` 来源优先级：

1. 路由 `webhook.eventKey`（显式指定）
2. 否则由路径自动生成：去掉 `pathPrefix` 后，把路径段用 `.` 连接  
   - `/users/create` → `users.create`  
   - `/restfulApi/auth/signIn` + `pathPrefix: '/restfulApi'` → `auth.signIn`

### Storage 与 Dispatcher 的分工

| 角色 | 职责 | 典型实现 |
|------|------|----------|
| **Storage** | 查订阅列表 `findSubscriptions`、写投递日志 `saveLog` | `defineWebhooks` / MongoDB / HTTP 远端 |
| **Dispatcher**（可选） | 真正把事件发出去 | 默认本地 `fetch` POST；或 `createHttpDispatcher` 交给 webhook-server |

不传 `dispatcher` 时：中间件用本地 `fetch` 直接 POST 到订阅的 `endpointUrl`，并用订阅的 `secret` 生成 HMAC 签名头。  
传入 `dispatcher` 时：投递改由 dispatcher 完成（本地 `fetch` / HMAC 路径不再走），storage 仍负责查订阅与写日志。

### 载荷如何从响应变成外发 body？

中间件会：

1. `clone` 响应并 `json()` 解析
2. 用 `isSuccess` 判断是否触发（默认：JSON **对象**，非数组）
3. 用 `getData` 取出业务对象（默认：整段 JSON 对象）
4. 若配置了 `condition`，为假则不触发
5. 按字段策略处理：敏感字段 → `include` → `exclude` → `transform` → 追加 `clientIp` / `userAgent` / `timestamp`
6. `setImmediate` 异步分发，**不阻塞**原 HTTP 响应

## 安装

```bash
npm install @vafast/webhook
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { webhook, defineWebhooks } from '@vafast/webhook'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    name: '创建用户',
    description: '注册成功后通知订阅方',
    webhook: {
      eventKey: 'user.created',
      exclude: ['password'],
    },
    handler: ({ body }) => ({ id: '123', ...body }),
  }),
])

const storage = defineWebhooks([
  {
    eventKey: 'user.created',
    url: 'https://example.com/webhook',
    secret: process.env.WEBHOOK_SECRET!,
  },
])

const server = new Server(routes)
server.use(webhook({ storage }))
serve({ fetch: server.fetch, port: 3000 })
```

简写：`webhook: true` 或 `webhook: {}`（等价启用，`eventKey` 由路径派生）。可用 `pathPrefix` 去掉 API 前缀后再生成 `eventKey`。

## 用法

### 路由字段

| 字段 | 位置 | 说明 |
|------|------|------|
| `webhook` | 路由扩展 | `true` 或配置对象（见下） |
| `name` | 路由本体 | 事件展示名；**不是** `webhook` 里的字段 |
| `description` | 路由本体 | 事件描述；**不是** `webhook` 里的字段 |

```typescript
webhook: true
// 或
webhook: {
  eventKey?: string
  include?: string[]
  exclude?: string[]
  condition?: (data: Record<string, unknown>) => boolean
  transform?: (data: Record<string, unknown>, req: Request) => Record<string, unknown>
}
```

### `include` / `exclude` / `condition` / `transform`

字段处理在 `processFields` 中按固定顺序执行：

1. **始终剔除** `sensitiveFields`（见下方默认列表；可在中间件配置覆盖）
2. **`include`（白名单）**：若配置且非空，只保留列出的字段
3. **`exclude`（黑名单）**：再删除列出的字段
4. **`transform`**：自定义改写；签名为 `(data, req) => Record<string, unknown>`
5. **追加公共字段**：`clientIp`、`userAgent`、`timestamp`（ISO）

`condition` 在字段处理之前、基于 `getData` 取出的原始业务对象判断：返回 `false` 则不触发。未配置时视为始终触发。

```typescript
webhook: {
  eventKey: 'order.paid',
  include: ['orderId', 'amount', 'currency'],
  exclude: ['internalNote'],
  condition: (data) => data.status === 'paid',
  transform: (data, req) => ({
    ...data,
    requestId: req.headers.get('x-request-id'),
  }),
}
```

### 触发条件

中间件仅在以下条件同时满足时分发：

1. 响应 `ok`（HTTP 2xx）
2. `Content-Type` 含 `application/json`
3. 路由注册了 `webhook`
4. `isSuccess(data)` 为真（默认：`isWebhookResponseSuccess`，要求 JSON 对象体）
5. `condition`（若配置）为真

分发在 `setImmediate` 中异步执行，失败只记日志 / `saveLog`，**不影响**原 HTTP 响应。

### Storage

```typescript
interface WebhookStorage {
  findSubscriptions(
    appId: string | undefined,
    eventKey: string,
  ): Promise<WebhookSubscription[]>
  saveLog(log: WebhookLog): Promise<void>
}
```

| API | 场景 |
|-----|------|
| `defineWebhooks([...])` | 内存 / 配置型订阅；`eventKey` 支持 `auth.*` 这类通配 |
| `createWebhookStorage({...})` | MongoDB 适配（按 `sourceService` 过滤） |
| `createHttpStorage({...})` | 远端 webhook-server HTTP 存储（`/internal/findSubscriptions`、`/internal/saveLog`） |
| 自定义实现 | 任意数据库 / Redis / API |

`defineWebhooks` 配置项用 `url`，内部映射为订阅的 `endpointUrl`；另有 `add` / `logs` / `clearLogs` 便于测试。

### 订阅字段（`WebhookSubscription`）

| 字段 | 说明 |
|------|------|
| `id` | 订阅 ID；日志里记为 `webhookId` |
| `appId` | 可选；多租户时用于匹配；单租户可不设 |
| `eventKey` | 订阅的事件键（内存存储支持 `xxx.*` 通配） |
| `endpointUrl` | 投递目标 URL |
| `secret` | 可选；本地投递时用于 HMAC-SHA256 签名头 |
| `signSecret` | 可选；透传给 dispatcher / webhook-server（本地 `fetch` 路径用的是 `secret`） |
| `deliveryType` | 可选；如 `generic` / `feishu` / `dingtalk` / `wecom` / `slack` |
| `status` | `'enabled' \| 'disabled'`；只有 `enabled` 会被查到 |
| `sourceService` | 可选；来源服务标识（Mongo/HTTP storage 会按此过滤） |
| `name` | 可选；展示名 |
| `type` | 可选；分类用 |

### Storage vs Dispatcher（再强调）

```typescript
// 开发：内存订阅 + 本地直发
server.use(webhook({ storage: defineWebhooks([...]) }))

// 生产微服务：HTTP 查订阅/写日志 + HTTP 代发
server.use(
  webhook({
    storage: createHttpStorage({ baseUrl, sourceService, apiKeyId, apiKeySecret }),
    dispatcher: createHttpDispatcher({ baseUrl, apiKeyId, apiKeySecret }),
  }),
)
```

- **只有 storage**：本进程 `fetch` 订阅 URL，并在有 `secret` 时加签名。
- **storage + dispatcher**：`dispatcher.dispatch(...)` 代发；签名 / 通道适配由远端负责。

### HMAC 签名（本地投递）

当订阅配置了 `secret`，外发请求会增加：

```http
X-Webhook-Signature: <hex>
```

算法：对 **完整 JSON body 字符串** 做 `HMAC-SHA256(secret)`，输出 hex。接收方应用同样算法校验。配置了 `dispatcher` 时，本地不再计算该头。

### 重试（`retry`）

总尝试次数 = `(retry.count ?? 0) + 1`（`count` 表示失败后再试次数）。  
第 `i` 次失败后（还有下一次时）等待：

```text
min(delay * backoff^i, maxDelay)
```

| 字段 | 默认 | 说明 |
|------|------|------|
| `count` | `0` | 失败后再试次数（0 = 只试 1 次） |
| `delay` | `1000` | 初始间隔（毫秒） |
| `backoff` | `2` | 指数退避倍数 |
| `maxDelay` | `30000` | 间隔上限（毫秒） |

日志中的 `attempt` 为实际尝试次数（从 1 起）。

### 手动分发

签名为 **`(storage, logger, options)`**，不要把 storage 塞进 options：

```typescript
import { dispatchWebhook } from '@vafast/webhook'

dispatchWebhook(storage, logger, {
  appId,
  eventKey: 'auth.oauth',
  data: { userId, provider },
  req,
})
```

适合 OAuth 回调等返回 redirect、无法走自动 JSON 钩子的场景。手动分发会补上 `clientIp` / `userAgent` / `timestamp`，但 **不会** 走路由上的 `include` / `exclude` / `sensitiveFields` / `condition` / `transform`。

### 投递载荷与请求头

外发 body 大致为：

```json
{
  "eventId": "evt_...",
  "eventType": "auth",
  "eventKey": "auth.signIn",
  "timestamp": "2026-01-07T12:00:00.000Z",
  "appId": "app_123",
  "data": { "...": "业务字段 + clientIp / userAgent / timestamp" }
}
```

`eventType` 取自 `eventKey` 第一个 `.` 之前的段；`appId` 仅在有值时写入。

| Header | 说明 |
|--------|------|
| `Content-Type` | `application/json` |
| `X-Webhook-Event` | 事件键 |
| `X-Webhook-Event-Id` | 幂等用事件 ID（`evt_{timestamp}_{random}`） |
| `X-Webhook-Timestamp` | ISO 时间 |
| `X-Webhook-Signature` | 订阅配置了 `secret` 且走本地投递时的 HMAC-SHA256 |

### 查询路由事件

```typescript
import {
  getAllWebhookEvents,
  getWebhookCategories,
  getWebhookEventsByCategory,
} from '@vafast/webhook'

getAllWebhookEvents('/restfulApi')
getWebhookCategories('/restfulApi')
getWebhookEventsByCategory('auth', '/restfulApi')
```

### 类型扩展

```typescript
import { withContext } from 'vafast'
import type { WebhookRouteExtensions } from '@vafast/webhook'

const defineRoute = withContext<MyContext, WebhookRouteExtensions>()
```

生产中若使用 `@vafast/auth-middleware` 的 `defineAuthRouteWithApp`，已内置精简版 `webhook` 类型（无 `condition` / `transform`）。

## API

### `webhook(config)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `storage` | `WebhookStorage` | — | **必填**。查订阅、写日志 |
| `dispatcher` | `WebhookDispatcher` | 本地 `fetch` | 可选；如 `createHttpDispatcher` |
| `logger` | `WebhookLogger` | console 包装 | `debug` / `info` / `warn` / `error` |
| `pathPrefix` | `string` | `''` | 生成 `eventKey` 时去掉的路径前缀 |
| `sourceService` | `string` | — | 类型上存在；**中间件当前未读取**。请在 `createWebhookStorage` / `createHttpStorage` 上配置 |
| `getAppId` | `(req) => string \| null \| undefined` | 不传 | 多租户；默认单租户（无 appId）。**不会**自动读 `app-id` |
| `isSuccess` | `(data) => boolean` | `isWebhookResponseSuccess` | 是否触发 |
| `getData` | `(data) => Record<string, unknown>` | `getWebhookResponseData` | 从响应取载荷 |
| `timeout` | `number` | `30000` | 本地投递超时（毫秒） |
| `sensitiveFields` | `string[]` | 见下表 | 始终剔除的字段 |
| `retry` | `RetryConfig` | 不重试 | 见上节 |
| `concurrency` | `number` | `10` | 同事件并发投递上限 |

### 默认 `sensitiveFields`（源码常量）

以下字段会在 `include` / `exclude` 之前被删除：

| 字段 |
|------|
| `password` |
| `token` |
| `jwtToken` |
| `refreshToken` |
| `secret` |
| `accessToken` |
| `apiKey` |

可通过 `webhook({ sensitiveFields: [...] })` 覆盖整份列表。

### `dispatchWebhook(storage, logger, options)`

| 参数 | 说明 |
|------|------|
| `storage` | `WebhookStorage` |
| `logger` | `WebhookLogger` |
| `options.appId` | 可选 |
| `options.eventKey` | 事件键 |
| `options.data` | 业务数据 |
| `options.req` | 用于补 `clientIp` / `userAgent` |
| `options.timeout` | 默认 `30000` |
| `options.retry` | 同中间件 |
| `options.concurrency` | 默认 `10` |
| `options.dispatcher` | 可选 |

### `RetryConfig`

| 字段 | 默认 | 说明 |
|------|------|------|
| `count` | `0` | 失败后再试次数 |
| `delay` | `1000` | 初始间隔（毫秒） |
| `backoff` | `2` | 指数退避倍数 |
| `maxDelay` | `30000` | 间隔上限 |

### 工厂与工具

| 导出 | 说明 |
|------|------|
| `defineWebhooks` | 内存订阅 + `add` / `logs` / `clearLogs`；支持 `eventKey` 通配 |
| `createWebhookStorage` | MongoDB；需 `collection` + `sourceService` |
| `createHttpStorage` | HTTP 查订阅 / 写日志 |
| `createHttpDispatcher` | HTTP 代发（`/internal/dispatchEvent`，默认超时 10000ms） |
| `isWebhookResponseSuccess` / `getWebhookResponseData` | 默认成功与取数 |
| `getWebhookEventConfig` / `getAllWebhookEvents` / … | 路由事件查询 |
| `generateSignature` / `generateEventId` / `DEFAULT_SENSITIVE_FIELDS` | 工具与常量 |

## 最佳实践

- 路由用 `name` / `description` 描述事件；`webhook` 只放触发与字段策略。
- 生产优先持久化 `WebhookStorage`，开发可用 `defineWebhooks`。
- 订阅配 `secret`，接收方校验 `X-Webhook-Signature`。
- 用 `eventId`（`X-Webhook-Event-Id`）做幂等；用 `retry` + `concurrency` 控制失败与打爆下游。
- 微服务场景：`createHttpStorage` + `createHttpDispatcher` 交给统一 webhook-server。
- 需要按业务语义触发时用 `condition`；需要改结构时用 `transform`，而不是在 handler 里塞专用 webhook 字段。

## 注意事项

- 只处理 2xx + JSON；redirect / HTML / 非对象 JSON（默认 `isSuccess`）不会自动触发。
- 默认敏感字段会删掉上表列出的字段；仍建议业务侧再 `exclude`。
- `getAppId` 默认**不是**读 `app-id`，单租户不传即可；多租户需自行实现。
- `WebhookMiddlewareConfig.sourceService` 目前中间件未使用；在 storage 工厂上配置。
- 分发失败只记日志 / `saveLog`，不影响原 HTTP 响应。
- `dispatchWebhook` 不应用路由级字段策略与 `sensitiveFields`。

## 相关链接

- [Auth Middleware](/middleware/auth-middleware)
- [中间件概述](/middleware/overview)
- [最佳实践](/essential/best-practice)
