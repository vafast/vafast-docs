---
title: OpenTelemetry 中间件 - Vafast
---

# OpenTelemetry

`@vafast/opentelemetry` 为 Vafast 提供 **OpenTelemetry 追踪（tracing）**：给每个 HTTP 请求建根 span，并导出在业务代码里嵌套 span 的辅助函数。

本包以 **trace / span** 为主。NodeSDK 虽也可接 metrics / logs 相关选项，**不等于**本包已经提供现成的指标或日志中间件——完整可观测管线需你自行配置导出器与后端。

## 先搞清几个概念（给新用户）

### Trace 与 Span

| 名词 | 白话 |
|------|------|
| **Trace（追踪）** | 一次完整请求链路的「故事」：从入口 HTTP 到数据库、下游 HTTP 等，用同一个 `traceId` 串起来 |
| **Span（跨度）** | 故事里的一章：一段有起止时间的操作，例如整次 HTTP 请求、一次 SQL、一次缓存读取 |
| **属性（Attributes）** | 贴在 span 上的键值信息，如 `http.request.method`、`url.path`、业务自定义字段 |
| **上下文传播（Propagation）** | 跨进程传递 trace：入站从 Headers 提取，出站再注入，才能把微服务画进同一条 trace |

本中间件会为每个请求创建 `SpanKind.SERVER` 的根 span，名称最终更新为 `` `${method} ${pathname}` ``，并写入 method、path、status、部分请求/响应头等属性。

### Preload SDK vs 中间件内启动

| 方式 | 做什么 | 适合 |
|------|--------|------|
| **Preload（推荐）** | 进程入口先 `new NodeSDK(...).start()`，再挂 `opentelemetry()` | 生产：OTLP 导出、采样、自动 instrumentation |
| **仅中间件** | 若全局仍是 `ProxyTracer`，`opentelemetry()` 会用传入选项就地 `new NodeSDK(...).start()` | 本地快速试跑 |

已预加载且 tracer 不再是 `ProxyTracer` 时，中间件**通常不会**再启动一套 SDK，主要负责 HTTP 根 span 与属性。

### `instrumentations` 是什么？

传给 NodeSDK 的**自动埋点插件列表**。例如 `@opentelemetry/auto-instrumentations-node` 可自动给 `http`、`fs`、部分数据库客户端等打 span，而不用你手写每一处。

```typescript
instrumentations: [getNodeAutoInstrumentations()]
```

传 `[]` 或省略时：不会装这些自动插件；你仍能靠本中间件拿到 HTTP 根 span，并用 `startActiveSpan` 手写业务 span。

## 安装

```bash
npm install @vafast/opentelemetry
```

按需再装导出器 / 自动埋点等（示例）：

```bash
npm install @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-proto \
  @opentelemetry/sdk-trace-node \
  @opentelemetry/auto-instrumentations-node
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello, Vafast with OpenTelemetry!',
  }),
])

const server = new Server(routes)
server.use(
  opentelemetry({
    serviceName: 'example-app',
    instrumentations: [],
  }),
)

serve({ fetch: server.fetch, port: 3000 })
```

未预加载时，上述调用会在检测到 `ProxyTracer` 后启动 NodeSDK（`serviceName` + `instrumentations` + 其余透传选项）。

## 用法

### 推荐：预加载 SDK，再挂中间件

```typescript
// preload.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const sdk = new NodeSDK({
  serviceName: 'your-service',
  instrumentations: [getNodeAutoInstrumentations()],
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter()),
  ],
})

sdk.start()
```

```typescript
import './preload'
import { Server, defineRoutes } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(defineRoutes([/* ... */]))
server.use(opentelemetry({ serviceName: 'your-service' }))
```

### 业务内嵌 span

```typescript
import {
  startActiveSpan,
  setAttributes,
  getCurrentSpan,
} from '@vafast/opentelemetry'

handler: async () => {
  return startActiveSpan('db.query-users', async (span) => {
    const rows = await db.query('select ...')
    span.setAttributes({ 'db.row_count': rows.length })
    setAttributes({ 'cache.hit': false }) // 写到当前活跃 span
    return { rows }
  })
}
```

`getTracer().startActiveSpan` / `startActiveSpan` / `record`（`startActiveSpan` 别名）会在 Promise settle 或同步返回后自动 `end()`；抛错时设置 `ERROR` 并 `recordException`。

### 上下文传播

中间件用 `propagation.extract` 从入站 Headers 提取上游 trace context，便于跨服务串联。出站 HTTP/gRPC 需自行注入，或依赖 auto-instrumentations。

## API

### `opentelemetry(options?)`

```typescript
opentelemetry(options?: VafastOpenTelemetryOptions): Middleware
```

`VafastOpenTelemetryOptions` = **NodeSDK 构造参数** + 本包补充字段。下面列出初学者最常碰到的选项（其余以 [@opentelemetry/sdk-node](https://www.npmjs.com/package/@opentelemetry/sdk-node) 为准）：

| 参数 | 说明 |
|------|------|
| `serviceName` | 服务名；本包默认 `'@vafast/vafast'`。用于 tracer / SDK 标识 |
| `instrumentations` | 自动埋点插件数组；见上文 |
| `traceExporter` | 简易导出器（如 OTLP）。与 `spanProcessors` 二选一思路时，优先搞清 SDK 文档推荐写法 |
| `spanProcessors` | Span 处理器列表，常用 `BatchSpanProcessor(exporter)` 批量上报 |
| `sampler` | 采样器：控制上报比例，高流量务必配置，避免成本爆炸 |
| `resource` | 资源属性（服务名、环境、版本等）。部分项目用 Resource + semantic conventions 代替/补充 `serviceName` |
| `resourceDetectors` | 自动探测资源的 detector 列表 |
| `contextManager` | 本包额外字段：若全局尚无 ContextManager，则 `enable()` 并 `setGlobalContextManager` |
| `textMapPropagator` | 传播格式（如 W3C TraceContext）；影响跨服务 Header |
| `spanLimits` | 单 span 属性/事件数量等上限 |
| `metricReader` / `views` / `logRecordProcessors` 等 | NodeSDK 支持，但**本中间件主路径仍是 tracing** |

当 `trace.getTracer(serviceName)` 仍是 `ProxyTracer` 时，才会：

```typescript
new NodeSDK({ ...options, serviceName, instrumentations }).start()
```

### 其它导出

| 导出 | 说明 |
|------|------|
| `getTracer()` | 包装后的 tracer（`startActiveSpan` 自动 end / 记错） |
| `startActiveSpan` / `record` | 在当前上下文创建活跃 span |
| `getCurrentSpan()` | 读当前 span（若有） |
| `setAttributes(attrs)` | 给当前 span 设属性；返回是否设置成功 |
| `contextKeySpan` | OTel 内部 span context key（`Symbol`） |
| `Tracer` / `StartSpan` / `StartActiveSpan` / `ActiveSpanArgs` / `VafastOpenTelemetryOptions` | 类型 |

## 最佳实践

1. 生产用 **preload** 初始化 SDK；中间件只负责 HTTP 根 span
2. Span 名用稳定业务语义（`db.get-user`、`api.create-order`），避免把用户 ID 等高基数动态值塞进名字
3. 高流量配置 `sampler`，控制导出量与成本
4. 属性里不要写密码、token、完整请求体等敏感数据
5. 子操作用 `startActiveSpan`；不要为每个循环迭代开 span
6. 跨服务依赖传播时，优先统一 propagator，并配合 auto-instrumentations

## 注意事项

- 成功路径会 `clone` 响应用于估算 body size，大响应有额外开销
- `User-Agent` 不会写入 `http.request.header.*`
- 未预加载且首次调用时会启动 NodeSDK；与其它库抢全局 OTel 时注意初始化顺序
- `getCurrentSpan` 依赖内部 context key，跨库混用时可能拿不到 span
- 本包不替代完整的 metrics / logs 方案

## 相关链接

- [中间件概述](/middleware/overview)
- [OpenTelemetry 文档](https://opentelemetry.io/docs/)
- [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/)
- [NodeSDK](https://www.npmjs.com/package/@opentelemetry/sdk-node)
