---
title: 中间件概述 - Vafast
---

# 概述

Vafast 官方插件按需安装。多数是 `server.use(...)` 中间件；少数是工具库（见说明列）。

## 官方插件

| 名称 | 说明 | 安装 |
|------|------|------|
| [Auth Middleware](/middleware/auth-middleware) | 对接 auth-server 的 JWT / API Key / app 硬认证 | `npm i @vafast/auth-middleware` |
| [Bearer](/middleware/bearer) | 提取 Bearer token（不验签） | `npm i @vafast/bearer` |
| [Compress](/middleware/compress) | Brotli / gzip / deflate 响应压缩 | `npm i @vafast/compress` |
| [Cookie](/middleware/cookie) | Cookie 解析、签名与 Set-Cookie | `npm i @vafast/cookie` |
| [CORS](/middleware/cors) | 跨域资源共享 | `npm i @vafast/cors` |
| [Cron](/middleware/cron) | 定时任务（**非** HTTP 中间件） | `npm i @vafast/cron` |
| [Helmet](/middleware/helmet) | 安全相关响应头 | `npm i @vafast/helmet` |
| [HTML](/middleware/html) | HTML / JSX 响应辅助 | `npm i @vafast/html` |
| [IP](/middleware/ip) | 客户端 IP 提取 | `npm i @vafast/ip` |
| [JWT](/middleware/jwt) | JWT 签发 / 校验工具 | `npm i @vafast/jwt` |
| [Logger](/middleware/logger) | Pino 日志工厂（非请求中间件） | `npm i @vafast/logger` |
| [OpenTelemetry](/middleware/opentelemetry) | 分布式追踪（tracing） | `npm i @vafast/opentelemetry` |
| [Permission](/middleware/permission) | 声明式权限 / RBAC（可插拔 Resolver） | `npm i @vafast/permission` |
| [Rate Limit](/middleware/rate-limit) | 速率限制 | `npm i @vafast/rate-limit` |
| [Request ID](/middleware/request-id) | 请求 ID 生成与透传 | `npm i @vafast/request-id` |
| [Request Logger](/middleware/request-logger) | HTTP 访问日志中间件 | `npm i @vafast/request-logger` |
| [Server Timing](/middleware/server-timing) | Server-Timing 性能头 | `npm i @vafast/server-timing` |
| [Static](/middleware/static) | 静态文件路由 | `npm i @vafast/static` |
| [Swagger](/middleware/swagger) | OpenAPI UI（手写 spec） | `npm i @vafast/swagger` |
| [Webhook](/middleware/webhook) | 声明式 Webhook 分发 | `npm i @vafast/webhook` |
| [API Client](/api-client/overview) | 类型安全 API 客户端 | `npm i @vafast/api-client` |

## 快速示例

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { cors } from '@vafast/cors'
import { requestId } from '@vafast/request-id'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => ({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(cors())
server.use(requestId())

serve({ fetch: server.fetch, port: 3000 })
```

## 相关链接

- [中间件系统](/middleware) — `defineMiddleware` 原理  
- [最佳实践](/essential/best-practice)  
- [GitHub](https://github.com/vafast) · [npm](https://www.npmjs.com/org/vafast)
