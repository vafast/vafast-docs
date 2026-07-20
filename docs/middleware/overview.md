---
title: 中间件概述 - Vafast
---

# 概述

Vafast 旨在实现模块化和轻量化。

遵循与 Arch Linux 相同的理念（顺便说一句，我使用 Arch）：

> 设计决策通过开发者共识逐案作出

这确保了开发者最终得到他们所希望创建的高性能 Web 服务器。由此，Vafast 包含了预构建的常见模式中间件，以方便开发者使用：

## 官方中间件

| 中间件 | 说明 | 安装 |
|--------|------|------|
| [API Client](/api-client/overview) | 现代化、类型安全的 API 客户端 | `npm i @vafast/api-client` |
| [Auth Middleware](/middleware/auth-middleware) | JWT/API Key + app 认证（对接独立认证服务） | `npm i @vafast/auth-middleware` |
| [Bearer](/middleware/bearer) | 自动获取 Bearer 令牌 | `npm i @vafast/bearer` |
| [Compress](/middleware/compress) | Brotli、GZIP、Deflate 压缩 | `npm i @vafast/compress` |
| [Cookie](/middleware/cookie) | Cookie 解析和签名 | `npm i @vafast/cookie` |
| [CORS](/middleware/cors) | 跨域资源共享 | `npm i @vafast/cors` |
| [Cron](/middleware/cron) | 定时任务调度 | `npm i @vafast/cron` |
| [Helmet](/middleware/helmet) | HTTP 安全头部 | `npm i @vafast/helmet` |
| [HTML](/middleware/html) | HTML 响应处理 | `npm i @vafast/html` |
| [IP](/middleware/ip) | 客户端 IP 提取 | `npm i @vafast/ip` |
| [JWT](/middleware/jwt) | JWT 身份验证 | `npm i @vafast/jwt` |
| [Logger](/middleware/logger) | 请求日志记录 | `npm i @vafast/logger` |
| [OpenTelemetry](/middleware/opentelemetry) | 分布式追踪 | `npm i @vafast/opentelemetry` |
| [Rate Limit](/middleware/rate-limit) | 速率限制 | `npm i @vafast/rate-limit` |
| [Request ID](/middleware/request-id) | 请求 ID 生成 | `npm i @vafast/request-id` |
| [Request Logger](/middleware/request-logger) | 请求日志中间件 | `npm i @vafast/request-logger` |
| [Server Timing](/middleware/server-timing) | 性能分析 | `npm i @vafast/server-timing` |
| [Static](/middleware/static) | 静态文件服务 | `npm i @vafast/static` |
| [Swagger](/middleware/swagger) | OpenAPI 文档生成 | `npm i @vafast/swagger` |
| [Webhook](/middleware/webhook) | Webhook 事件分发 | `npm i @vafast/webhook` |

## 快速示例

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    handler: () => ({ users: [] })
  })
])

const server = new Server(routes)
server.use(cors())

export default { fetch: server.fetch }
```

## 相关链接

- [GitHub 组织](https://github.com/vafast) - 所有官方中间件源码
- [npm 包](https://www.npmjs.com/org/vafast) - npm 发布的包

---

如果您为 Vafast 编写了一个中间件，欢迎通过 **点击下面的 "在 GitHub 上编辑此页面"** 将您的中间件添加到列表中 👇
