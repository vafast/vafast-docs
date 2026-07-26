---
title: Server Timing 中间件 - Vafast
---

# Server Timing

`@vafast/server-timing` 测量请求处理耗时，写入响应头 `Server-Timing`，便于在浏览器 DevTools 中查看。

框架没有细粒度生命周期钩子，因此只提供 **`handle`** / **`total`** 两段计时。

## 安装

```bash
npm install @vafast/server-timing
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(serverTiming())
serve({ fetch: server.fetch, port: 3000 })
```

响应示例：

```http
Server-Timing: handle;dur=1.23,total;dur=1.25
```

## 用法

### 全局启用

```typescript
server.use(serverTiming())
```

### 强制在生产开启

默认生产关闭（`enabled` 默认 `NODE_ENV !== 'production'`）：

```typescript
server.use(
  serverTiming({
    enabled: true,
  }),
)
```

### 仅对部分路径写头

```typescript
server.use(
  serverTiming({
    enabled: true,
    allow: ({ request }) =>
      new URL(request.url).pathname.startsWith('/api'),
    trace: { handle: true, total: true },
  }),
)
```

### 只输出 total

```typescript
server.use(
  serverTiming({
    trace: { handle: false, total: true },
  }),
)
```

## API

### 导出

| 导出 | 说明 |
|------|------|
| `serverTiming(options?)` | 主入口，返回中间件 |
| `default` | 同 `serverTiming` |
| `ServerTimingOptions` | 配置类型 |

### `serverTiming(options?: ServerTimingOptions)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `enabled` | `boolean` | `NODE_ENV !== 'production'` | 是否启用；生产默认关闭 |
| `allow` | `boolean \| ((ctx) => boolean \| Promise<boolean>)` | 允许写入 | 是否写入该次响应的头；函数入参为 `{ request }` |
| `trace.handle` | `boolean` | `true` | 是否输出 `handle` 段 |
| `trace.total` | `boolean` | `true` | 是否输出 `total` 段 |

当前实现**仅支持** `handle` / `total`，没有其它生命周期指标。

## 最佳实践

- 开发环境用默认配置即可；生产默认关闭，避免无意义开销与信息暴露。
- 需要抽样观察时用 `allow` 限制路径或请求比例。
- 真正的生产链路追踪请用 [OpenTelemetry](/middleware/opentelemetry)。

## 注意事项

- 这是开发期性能观察工具，不是 APM。
- 若响应 `Headers` 不可变，`headers.set` 可能静默失败（源码已 `try/catch`）。
- `enabled: false` 时直接 `next()`，不写任何头。

## 相关链接

- [OpenTelemetry](/middleware/opentelemetry)
- [中间件系统](/middleware)
