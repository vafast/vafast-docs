---
title: IP 中间件 - Vafast
---

# IP

`@vafast/ip` 从请求头解析客户端 IP，通过 `next({ ip })` 注入到 handler 上下文。不要依赖 `req.ip`（Node/undici 的 `Request` 上 `ip` 可能是只读 getter，写入会失败）。

## 安装

```bash
npm install @vafast/ip
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { ip } from '@vafast/ip'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/whoami',
    middleware: [ip()],
    handler: ({ ip: clientIp }) => json({ ip: clientIp }),
  }),
])

const server = new Server(routes)
serve({
  fetch: server.fetch,
  port: 3000,
  trustProxy: true,
})
```

优先使用 handler 参数里的 `ip`，不必 `(req as any).ip`。

## 用法

### 全局挂载

```typescript
const server = new Server(routes)
server.use(ip())
```

```typescript
defineRoute({
  method: 'GET',
  path: '/',
  handler: ({ ip: clientIp }) => json({ ip: clientIp }),
})
```

### 自定义检查的头

```typescript
server.use(
  ip({
    checkHeaders: ['x-forwarded-for', 'x-real-ip'],
  }),
)
```

### 与限流配合

限流的 `generator` 拿不到同请求里后续中间件注入的上下文，请直接读可信头，或复用 `getIP`：

```typescript
import { rateLimit } from '@vafast/rate-limit'
import { getIP } from '@vafast/ip'

server.use(
  rateLimit({
    max: 60,
    duration: 60_000,
    generator: (req) => getIP(req.headers) || 'unknown',
  }),
)
```

## API

### 导出

| 导出 | 说明 |
|------|------|
| `ip(options?)` | 主入口，返回中间件 |
| `getIP(headers, checkHeaders?)` | 仅从 `Headers` 解析 IP 的工具函数 |
| `defaultOptions` / `headersToCheck` | 默认配置与默认头列表 |
| `Options` / `IPHeaders` / `InjectServer` | 相关类型 |

### `ip(options?: Partial<Options>)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `checkHeaders` | `IPHeaders[]` | 见下方默认列表 | 按顺序检查的请求头 |
| `headersOnly` | `boolean` | `false` | **类型保留，当前插件实现未使用** |
| `injectServer` | `(app) => any \| null` | `() => null` | **类型保留，当前插件实现未使用** |

当前插件逻辑：调用 `getIP(request.headers, options.checkHeaders)`，再 `next({ ip })`。

### 默认 `headersToCheck`

1. `x-real-ip`
2. `x-client-ip`
3. `cf-connecting-ip`
4. `fastly-client-ip`
5. `x-cluster-client-ip`
6. `x-forwarded`
7. `forwarded-for`
8. `forwarded`
9. `appengine-user-ip`
10. `true-client-ip`
11. `cf-pseudo-ipv4`
12. `fly-client-ip`

使用**默认**头列表时，`getIP` 会优先尝试 `x-forwarded-for`（取第一个），再按上表顺序查找。

## 最佳实践

- 反代 / CDN 后配置正确的转发头，并在 `serve({ trustProxy: true })` 下使用。
- handler 用 `({ ip })` 取 IP，保持类型清晰。
- 只信任你自己基础设施写入的头；不要在公网直接信任任意客户端伪造的 `X-Forwarded-For`。

## 注意事项

- 只通过 `next({ ip })` 注入上下文，**不会**也不会再写入 `req.ip`。
- `headersOnly` / `injectServer` 虽出现在类型与默认配置中，**插件本体未读取它们**；有效选项是 `checkHeaders`。
- 解析失败时 `ip` 可能是空字符串 `''`。
- 调试可设置环境变量 `NODE_DEBUG=* ` 或 `NODE_DEBUG=@vafast/ip`。

## 相关链接

- [Rate Limit](/middleware/rate-limit)
- [API · serve](/api)
- [最佳实践](/essential/best-practice)
