---
title: Compress 中间件 - Vafast
---

# Compress

`@vafast/compress` 根据客户端请求头 `Accept-Encoding`，在响应返回前压缩响应体，从而减小传输体积。支持 **Brotli（`br`）/ gzip / deflate**。

导出名是 **`compression`**（不是 `compress`）：

```typescript
import { compression } from '@vafast/compress'
// 也可用 default：import compression from '@vafast/compress'
```

## 先搞清几个概念（给新用户）

### 响应压缩是做什么的？

浏览器或 HTTP 客户端在请求里声明「我能解压哪些格式」，服务端若同意，就把响应体压小后再发送，并在响应头里写上实际用了哪种算法。常见效果：JSON / HTML / 文本体积明显变小，带宽与加载时间下降。

### `Accept-Encoding` 协商（本包如何选算法）

1. 客户端例如发送：`Accept-Encoding: br, gzip, deflate`
2. 中间件读取该头，按 **逗号+空格**（`, `）拆成列表
3. 用你配置的 `encodings`（默认 `['br', 'gzip', 'deflate']`）去过滤：只保留**同时出现在客户端列表里**的项
4. 过滤后的列表**保留 `encodings` 的顺序**，取**第一个**作为最终算法

因此：**服务端数组顺序 = 优先级**。默认优先 Brotli，其次 gzip，再次 deflate。

注意（与完整 HTTP 协商的差异，以源码为准）：

- 匹配是「字符串是否在拆分后的列表中」，**不会**解析 `q` 权重（如 `gzip;q=0.8`）
- 若客户端写成 `br,gzip`（逗号后无空格），拆分结果可能对不上，导致不压缩
- 没有 `Accept-Encoding`，或与 `encodings` **无交集** → **不压缩**

### `threshold`（阈值）是什么？

对**已经读成一整块缓冲区**的响应：若 `byteLength < threshold`（默认 **1024** 字节），跳过压缩。

原因：很小的响应压完可能差不多大，还浪费 CPU。流式路径（见下）不走这个字节数判断。

### zlib `level` / Brotli `quality` 白话

| 选项 | 作用 | 默认（本包） |
|------|------|----------------|
| `zlibOptions.level` | gzip / deflate 的压缩级别，大致 **0–9**：越高越省体积、越费 CPU | **`6`** |
| `brotliOptions.params[BROTLI_PARAM_QUALITY]` | Brotli 质量，大致 **0–11**：越高越省体积、越费 CPU | Node 的 **`BROTLI_DEFAULT_QUALITY`**（通常为 11） |

调优经验：API JSON 常用默认或略降 quality；CPU 紧张时可把 Brotli quality 降到 4–6，或干脆只用 gzip。

### `compressStream`：类型注释 vs 运行时默认

| 来源 | 默认值 |
|------|--------|
| `types.ts` 的 JSDoc（`@default false`） | 写的是 `false` |
| **运行时** `options?.compressStream ?? true` | **`true`** |

以**运行时为准：默认会压缩 `ReadableStream` body**。SSE（`text/event-stream`）等长连接建议显式设 `compressStream: false`。

## 安装

```bash
npm install @vafast/compress
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { compression } from '@vafast/compress'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ message: 'Hello '.repeat(200) }),
  }),
])

const server = new Server(routes)
server.use(compression())
serve({ fetch: server.fetch, port: 3000 })
```

用支持压缩的客户端访问时，响应会带上 `Content-Encoding`（如 `br`）以及 `Vary: accept-encoding`。

## 用法

### 基础用法

推荐**全局挂载**：中间件先 `await next()`，再按需改写 body / 响应头。

```typescript
server.use(compression())
```

客户端需带可协商编码，例如：

```http
Accept-Encoding: br, gzip, deflate
```

### 常见场景

#### 1. 只启用 gzip / deflate，并提高阈值

```typescript
server.use(
  compression({
    encodings: ['gzip', 'deflate'],
    threshold: 2048,
  }),
)
```

#### 2. SSE / 流式响应：关闭流压缩

```typescript
server.use(
  compression({
    compressStream: false,
  }),
)
```

说明：当 `compressStream === true` 且 `response.body instanceof ReadableStream` 时，走 `pipeThrough(CompressionStream(...))`，**不检查** `threshold` / Content-Type 正则。SSE 请关掉流压缩。

#### 3. 客户端跳过压缩

默认 `disableByHeader: true`：请求带任意值的 `x-no-compression` 头时直接透传。

```http
GET /large-json
x-no-compression: 1
```

#### 4. 调优压缩级别与内存缓存

非流式路径会对「算法 + 原文」做 MD5 键的**进程内缓存**（`TTL` 秒，默认 24 小时）。

```typescript
import { constants } from 'node:zlib'
import { compression } from '@vafast/compress'

server.use(
  compression({
    zlibOptions: { level: 6 },
    brotliOptions: {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 4,
      },
    },
    TTL: 3600,
  }),
)
```

## API

### 导出

| 导出 | 说明 |
|------|------|
| `compression` | 中间件工厂（主入口） |
| `default` | 同 `compression` |
| `CompressionStream` | 把 Node zlib Transform 桥成 Web Streams，供流式 `pipeThrough` |
| `CompressionOptions` / `CompressionEncoding` / `LifeCycleOptions` / `CacheOptions` 等 | 类型 |

### 选项 / 参数

```typescript
compression(options?: CompressionOptions & LifeCycleOptions & CacheOptions)
```

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `encodings` | `('br' \| 'gzip' \| 'deflate')[]` | `['br', 'gzip', 'deflate']` | 服务端优先级；与 `Accept-Encoding` 求交后取第一个 |
| `threshold` | `number` | `1024` | 缓冲响应小于该字节数则不压缩 |
| `disableByHeader` | `boolean` | `true` | 为 `true` 时，请求含 `x-no-compression` 则跳过 |
| `compressStream` | `boolean` | **运行时 `true`**（类型 JSDoc 仍写 `false`，以运行为准） | 是否对 `ReadableStream` body 做流式压缩 |
| `brotliOptions` | `BrotliOptions` | 缓冲路径：GENERIC + 默认 quality；流式路径默认 MODE_TEXT + 默认 quality | 传给 `brotliCompressSync` / `createBrotliCompress` |
| `zlibOptions` | `ZlibOptions` | `{ level: 6 }` | 传给 gzip / deflate |
| `TTL` | `number` | `86400`（24h） | 压缩结果内存缓存 TTL（秒）；仅非流式 `getOrCompress` |
| `as` | `'before' \| 'after'` | `'after'` | 类型保留字段；**当前实现读取后未使用**，可忽略 |

### 相关方法

#### `CompressionStream(encoding, options?)`

供流式路径内部 `pipeThrough` 使用。一般业务代码不必直接调用。

## 最佳实践

1. API JSON / HTML 适合全局开压缩；已经是 `.zip` / 图片等二进制时，常因 Content-Type 不被匹配而自动跳过
2. SSE / 长连接流式响应建议 `compressStream: false`
3. 用 `threshold` 避免小响应白耗 CPU
4. `TTL` 缓存适合热点、内容重复的响应；注意进程内存占用，多实例各自一份缓存
5. 调试体积时可让客户端带 `x-no-compression` 对比原文

## 注意事项

- 仅压缩 **`response.ok`**（状态码 200–299）的响应
- 无交集的 `Accept-Encoding`、或缺失该头 → 不压缩
- 缓冲路径下，`Content-Type` 需匹配可压缩类型（大致：非 event-stream 的 `text/*`、`json`、`xml`、`octet-stream` 等）；**无 Content-Type 时按可压缩处理**
- `text/event-stream` 不在默认可压缩 Content-Type 正则内，但若 `compressStream: true` 且 body 是 `ReadableStream`，仍可能走流压缩——SSE 请关 `compressStream`
- 会设置 `Content-Encoding`，并合并 `Vary: accept-encoding`（已有 `Vary: *` 则不追加）
- 依赖 Node `zlib` / `crypto`（非纯 Edge 环境请自行确认兼容性）

## 相关链接

- [SSE](/essential/sse)
- [中间件系统](/middleware/overview)
- [MDN: Accept-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)
- [Node.js zlib](https://nodejs.org/api/zlib.html)
