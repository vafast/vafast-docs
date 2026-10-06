---
title: 'Vafast Middleware Ecosystem: JWT, CORS, Rate Limit, Swagger and Other Official Plugins'
description: 'All official Vafast middleware and plugins: JWT, Bearer, CORS, Cookie, Compress, Helmet, Rate Limit, Swagger, OpenTelemetry, Static and more. Install what you need and enable it with a single server.use call.'
---

# Vafast Middleware Overview

Official Vafast plugins are installed as needed. Most are `server.use(...)` middleware; a few are utility libraries (see the description column).

## Official Plugins

| Name | Description | Install |
|------|------|------|
| [Auth Middleware](/en/middleware/auth-middleware) | JWT / API key / app hard auth against an auth-server | `npm i @vafast/auth-middleware` |
| [Bearer](/en/middleware/bearer) | Extract the Bearer token (no signature verification) | `npm i @vafast/bearer` |
| [Compress](/en/middleware/compress) | Brotli / gzip / deflate response compression | `npm i @vafast/compress` |
| [Cookie](/en/middleware/cookie) | Cookie parsing, signing and Set-Cookie | `npm i @vafast/cookie` |
| [CORS](/en/middleware/cors) | Cross-origin resource sharing | `npm i @vafast/cors` |
| [Cron](/en/middleware/cron) | Scheduled jobs (**not** HTTP middleware) | `npm i @vafast/cron` |
| [Helmet](/en/middleware/helmet) | Security-related response headers | `npm i @vafast/helmet` |
| [HTML](/en/middleware/html) | HTML / JSX response helpers | `npm i @vafast/html` |
| [IP](/en/middleware/ip) | Client IP extraction | `npm i @vafast/ip` |
| [JWT](/en/middleware/jwt) | JWT signing / verification utilities | `npm i @vafast/jwt` |
| [Logger](/en/middleware/logger) | Pino logger factory (not request middleware) | `npm i @vafast/logger` |
| [OpenTelemetry](/en/middleware/opentelemetry) | Distributed tracing | `npm i @vafast/opentelemetry` |
| [Permission](/en/middleware/permission) | Declarative permissions / RBAC (pluggable resolver) | `npm i @vafast/permission` |
| [Rate Limit](/en/middleware/rate-limit) | Rate limiting | `npm i @vafast/rate-limit` |
| [Request ID](/en/middleware/request-id) | Request ID generation and propagation | `npm i @vafast/request-id` |
| [Request Logger](/en/middleware/request-logger) | HTTP access log middleware | `npm i @vafast/request-logger` |
| [Server Timing](/en/middleware/server-timing) | Server-Timing performance header | `npm i @vafast/server-timing` |
| [Static](/en/middleware/static) | Static file routes | `npm i @vafast/static` |
| [Swagger](/en/middleware/swagger) | OpenAPI UI (hand-written spec) | `npm i @vafast/swagger` |
| [Webhook](/en/middleware/webhook) | Declarative webhook dispatch | `npm i @vafast/webhook` |
| [API Client](/en/api-client/overview) | Type-safe API client | `npm i @vafast/api-client` |

## Quick Example

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

## Related Links

- [Middleware System](/en/middleware) — how `defineMiddleware` works  
- [Best Practices](/en/essential/best-practice)  
- [GitHub](https://github.com/vafast) · [npm](https://www.npmjs.com/org/vafast)
