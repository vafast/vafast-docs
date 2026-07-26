---
title: Rate Limit 中间件 - Vafast
---

# Rate Limit

`@vafast/rate-limit` 按客户端 **key** 限制请求频率。每个 key 在时间窗口内最多允许 `max` 次请求；超限返回 **429**，并可写入 `RateLimit-*` / `Retry-After` 响应头。

## 先搞清几个概念（给新用户）

### 限流 key 是什么？

中间件不会「按连接」或「按路由」天然限流，而是把每次请求映射成一个字符串 key，再在 `context`（默认内存表）里对该 key 计数。

默认 key 来自客户端 IP 相关请求头（见下方顺序）。反代后若头不可信，或你想按用户 / API Key 限流，应自定义 `generator`。

### `skip` 语义（务必记清）

| `skip` 返回值 | 行为 |
|---------------|------|
| **`true`** | **跳过**限流：不生成计数（若尚未生成）、不递增、不写限流头 |
| **`false`** | **应用**限流：生成 key（若需要）、递增、可能 429 |

默认 `skip: () => false`，表示对所有请求都限流。

`skip.length` 会影响何时生成 key：

- `skip.length < 2`（只接收 `req`）：先 `skip(req)`；未跳过再 `generator`
- `skip.length >= 2`（接收 `req, key`）：先 `generator`，再 `skip(req, key)`

这样「仅按路径跳过」时可避免无谓的 key 计算；「按 key 决定是否跳过」时则先有 key。

### 计数与超限判定

流程是 **先 `increment`，再判断**：

```text
current >= max + 1  →  429
```

例如 `max: 10` 时，第 11 次请求会被拒绝。窗口长度由 `duration`（毫秒）决定；`Retry-After` 约为 `ceil(duration / 1000)` 秒。

### 默认内存存储与多实例

`DefaultContext` 使用进程内 LRU 计数。多进程 / 多副本部署时，**各实例计数互不相通**，全局 QPS 上限大约是 `max × 实例数`。需要集群级限流时，实现自定义 `Context`（如 Redis）并传入 `context` 选项。

## 安装

```bash
npm install @vafast/rate-limit
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(
  rateLimit({
    max: 100,
    duration: 60_000,
  }),
)
serve({ fetch: server.fetch, port: 3000 })
```

## 用法

### 全局限流

```typescript
server.use(
  rateLimit({
    max: 100,
    duration: 60_000,
  }),
)
```

### 单路由限流

```typescript
defineRoute({
  method: 'POST',
  path: '/login',
  middleware: [rateLimit({ max: 10, duration: 60_000 })],
  handler: () => json({ ok: true }),
})
```

### 跳过探活等路径

`skip` 返回 **`true` 表示跳过**计数与限流：

```typescript
server.use(
  rateLimit({
    max: 60,
    duration: 60_000,
    skip: (req) => {
      const path = new URL(req.url).pathname
      return path === '/' || path === '/health'
    },
  }),
)
```

### 自定义限流 key

```typescript
rateLimit({
  max: 30,
  duration: 60_000,
  generator: (req) =>
    req.headers.get('authorization') ??
    req.headers.get('x-forwarded-for') ??
    'anonymous',
})
```

### 自定义超限响应（`errorResponse` 三种形态）

| 类型 | 行为 |
|------|------|
| `string` | 以 **429** 文本响应返回该字符串（`text(...)`）；可附带限流头 |
| `Response` | `clone()` 后返回；若 `headers: true` 会把 `RateLimit-*` / `Retry-After` 写到 clone 上 |
| `Error` | **抛出**该 Error（由上层错误处理接管） |
| 其它非上述类型 | 回落为文本 `'Too Many Requests'`，状态 429 |

```typescript
import { err } from 'vafast'

rateLimit({
  max: 5,
  duration: 60_000,
  errorResponse: new Response(JSON.stringify({ error: 'Too Many Requests' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  }),
  // 或抛错：errorResponse: err('Too Many Requests', 429)
  // 或纯文本：errorResponse: 'rate-limit reached'
})
```

### 自定义 `Context`（存储）

需要 Redis 等外部存储时，实现 `Context` 接口并传入：

| 方法 | 说明 |
|------|------|
| `init(options)` | 中间件创建时调用；可读取 `duration` / `max` 等（不含 `context` 自身） |
| `increment(key)` | 计数 +1，返回 `{ count, nextReset }` |
| `decrement(key)` | 计数 -1；`countFailedRequest: false` 且下游抛错时会调用 |
| `reset(key?)` | 重置某个 key，或不传则清空全部 |
| `kill()` | 进程结束时的清理钩子 |

```typescript
import type { Context } from '@vafast/rate-limit'
import { rateLimit } from '@vafast/rate-limit'

const redisContext: Context = {
  init() { /* ... */ },
  async increment(key) { /* return { count, nextReset } */ },
  async decrement(key) { /* ... */ },
  async reset(key) { /* ... */ },
  async kill() { /* ... */ },
}

rateLimit({ max: 100, duration: 60_000, context: redisContext })
```

## API

### 导出

| 导出 | 说明 |
|------|------|
| `rateLimit(options?)` | 主入口，返回中间件 |
| `DefaultContext` | 默认内存计数存储（LRU，构造参数 `maxSize` 默认 5000） |
| `defaultOptions` | 默认配置常量 |
| `Options` / `Context` / `Generator` | 相关类型 |

### `rateLimit(options?: Partial<Options>)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `duration` | `number` | `60000` | 计数窗口（毫秒）；也用于 `Retry-After` |
| `max` | `number` | `10` | 窗口内最大请求数 |
| `errorResponse` | `string \| Response \| Error` | `'rate-limit reached'` | 超限响应，见上节三种形态 |
| `countFailedRequest` | `boolean` | `false` | `false` 时下游 **抛错** 会 `decrement` 退还计数 |
| `generator` | `(req, server, derived) => string \| Promise<string>` | `defaultKeyGenerator` | 限流 key |
| `context` | `Context` | `new DefaultContext()` | 计数存储 |
| `skip` | `(req, key?) => boolean \| Promise<boolean>` | `() => false` | 返回 **`true` 跳过**限流 |
| `headers` | `boolean` | `true` | 是否写 `RateLimit-*` / `Retry-After` |
| `injectServer` | `() => any` | — | 传给 `generator` 的 server；一般不需要 |
| `scoping` | `'global' \| 'scoped'` | `'global'` | **兼容字段，当前实现未使用** |

### 默认 `generator` 请求头顺序

`defaultKeyGenerator` 按以下顺序取客户端地址，**命中即返回**：

1. `x-real-ip`
2. `x-forwarded-for`（取逗号分隔的 **第一个**，并 `trim`）
3. `cf-connecting-ip`
4. `x-client-ip`

若全部缺失：回退为 `ua:${user-agent || 'unknown'}`，并 `console.warn`。

`request` 为 `undefined` 时返回空字符串并告警。

### 响应头（`headers: true`）

| 头 | 说明 |
|----|------|
| `RateLimit-Limit` | 窗口上限（`max`） |
| `RateLimit-Remaining` | 剩余次数 |
| `RateLimit-Reset` | 距重置的秒数（向上取整） |
| `Retry-After` | **仅超限时**附加；约为 `ceil(duration / 1000)` 秒 |

### `skip` 与 key 生成时机

- `skip.length < 2`：先调用 `skip(req)`，未跳过再生成 key
- `skip.length >= 2`：先生成 key，再调用 `skip(req, key)`

判断条件为 `(await skip(...)) === false` 时才进入计数；其它真值均视为跳过。

## 最佳实践

- 登录、发短信等敏感接口用更小的 `max`，或单独挂路由级限流。
- 反代后务必保证 IP 相关请求头可信，或自定义 `generator`（例如按用户 ID / API Key）。
- 探活、静态资源等用 `skip` 排除（返回 `true`），避免误伤监控。
- 多实例部署时默认内存 `DefaultContext` 不共享；需要全局限流请实现自定义 `Context`。

## 注意事项

- `scoping` 仅为兼容保留，**不会改变行为**。
- `skip` 返回 `true` 才跳过；默认 `() => false` 表示全部计数。
- 超限判定为 `current >= max + 1`（先递增再判断）。
- `countFailedRequest: false` 时，仅对下游 **抛错** 退还计数；正常 4xx/5xx 响应仍会计数。
- 多实例 + 默认内存存储 ≠ 集群统一限流。

## 相关链接

- [IP](/middleware/ip)
- [中间件系统](/middleware)
