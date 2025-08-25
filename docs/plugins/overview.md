---
title: 插件概述 - Vafast
head:
    - - meta
      - property: 'og:title'
        content: 插件概述 - Vafast

    - - meta
      - name: 'description'
        content: Vafast 旨在实现模块化和轻量化，这就是为什么 Vafast 包含了涉及常见模式的预构建插件，以方便开发者使用。Vafast 通过社区插件进一步增强，使其更加个性化。

    - - meta
      - name: 'og:description'
        content: Vafast 旨在实现模块化和轻量化，这就是为什么 Vafast 包含了涉及常见模式的预构建插件，以方便开发者使用。Vafast 通过社区插件进一步增强，使其更加个性化。
---

# 概述

Vafast 旨在实现模块化和轻量化。

遵循与 Arch Linux 相同的理念（顺便说一句，我使用 Arch）：

> 设计决策通过开发者共识逐案作出

这确保了开发者最终得到他们所希望创建的高性能 Web 服务器。由此，Vafast 包含了预构建的常见模式插件，以方便开发者使用：

## 官方插件：

-   [API Client](/plugins/api-client) - 现代化、类型安全的 API 客户端
-   [Bearer](/plugins/bearer) - 自动获取 [Bearer](https://swagger.io/docs/specification/authentication/bearer-authentication/) 令牌
-   [Compress](/plugins/compress) - 支持 Brotli、GZIP 和 Deflate 压缩算法
-   [Helmet](/plugins/helmet) - 通过添加各种 HTTP 安全头部来增强 Web 应用的安全性
-   [IP](/plugins/ip) - 支持从各种代理头部中提取真实的客户端 IP 地址
-   [Rate Limit](/plugins/rate-limit) - 提供灵活的速率限制功能，保护 API 免受滥用
-   [CORS](/plugins/cors) - 设置 [跨域资源共享 (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
-   [Cron](/plugins/cron) - 设置 [cron](https://en.wikipedia.org/wiki/Cron) 任务
-   [GraphQL Apollo](/plugins/graphql-apollo) - 在 Vafast 上运行 [Apollo GraphQL](https://www.apollographql.com/)
-   [GraphQL Yoga](/plugins/graphql-yoga) - 在 Vafast 上运行 [GraphQL Yoga](https://github.com/dotansimha/graphql-yoga)
-   [HTML](/plugins/html) - 处理 HTML 响应
-   [JWT](/plugins/jwt) - 使用 [JWT](https://jwt.io/) 进行身份验证
-   [OpenTelemetry](/plugins/opentelemetry) - 添加对 OpenTelemetry 的支持
-   [Rate Limit](/plugins/rate-limit) - 简单轻量的速率限制器
-   [Server Timing](/plugins/server-timing) - 使用 [Server-Timing API](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing) 审计性能瓶颈
-   [Static](/plugins/static) - 提供静态文件/文件夹服务
-   [Stream](/plugins/stream) - 集成响应流和 [服务器发送事件 (SSEs)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
-   [Swagger](/plugins/swagger) - 生成 [Swagger](https://swagger.io/) 文档
-   [WebSocket](/patterns/websocket) - 支持 [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 社区插件：

-   [Vafast Helmet](https://github.com/vafastjs/vafast-helmet) - 通过各种 HTTP 头增强 Vafast 应用安全
-   [Vafast Compression](https://github.com/vafastjs/vafast-compression) - 压缩响应
-   [Vafast IP](https://github.com/vafastjs/vafast-ip) - 获取客户端 IP 地址
-   [Vafast Rate Limit](https://github.com/vafastjs/vafast-rate-limit) - 简单轻量的速率限制器
-   [Vafast Server Timing](https://github.com/vafastjs/vafast-server-timing) - 使用 Server-Timing API 审计性能瓶颈
-   [Vafast Static](https://github.com/vafastjs/vafast-static) - 提供静态文件/文件夹服务
-   [Vafast Swagger](https://github.com/vafastjs/vafast-swagger) - 生成 Swagger/OpenAPI 文档
-   [Vafast Bearer](https://github.com/vafastjs/vafast-bearer) - 自动获取 Bearer 令牌
-   [Vafast CORS](https://github.com/vafastjs/vafast-cors) - 设置跨域资源共享 (CORS)
-   [Vafast Cron](https://github.com/vafastjs/vafast-cron) - 设置 cron 任务
-   [Vafast JWT](https://github.com/vafastjs/vafast-jwt) - 使用 JWT 进行身份验证
-   [Vafast OpenTelemetry](https://github.com/vafastjs/vafast-opentelemetry) - 添加对 OpenTelemetry 的支持

## 开发中的插件：

-   [Vafast GraphQL](https://github.com/vafastjs/vafast-graphql) - GraphQL 支持
-   [Vafast WebSocket](https://github.com/vafastjs/vafast-websocket) - WebSocket 支持
-   [Vafast Stream](https://github.com/vafastjs/vafast-stream) - 响应流和服务器发送事件支持

## 相关项目：

-   [Vafast Ecosystem](https://github.com/vafastjs) - Vafast 官方插件生态系统

---

如果您为 Vafast 编写了一个插件，请随时通过 **点击下面的 <i>在 GitHub 上编辑此页面</i>** 将您的插件添加到列表中 👇