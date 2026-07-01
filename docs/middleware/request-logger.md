---
title: Request Logger 中间件 - Vafast
---

# Request Logger 中间件

功能完整的请求日志中间件，支持自定义格式和多种输出方式。

## 安装

```bash
npm install @vafast/request-logger
```

## 使用

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { requestLogger } from '@vafast/request-logger'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  })
])

const server = new Server(routes)
server.use(requestLogger())

export default { fetch: server.fetch }
```

## 配置项

```typescript
requestLogger({
  // 日志级别
  level: 'info',
  
  // 是否记录请求体
  logBody: false,
  
  // 是否记录响应体
  logResponse: false,
  
  // 敏感字段过滤
  redact: ['password', 'token', 'authorization'],
  
  // 自定义日志器
  logger: console
})
```

### level

日志级别：`'debug'`, `'info'`, `'warn'`, `'error'`

### logBody

是否记录请求体。默认 `false`（出于隐私和性能考虑）。

### logResponse

是否记录响应体。默认 `false`。

### redact

需要脱敏的字段列表。匹配的字段值会被替换为 `[REDACTED]`。

### logger

自定义日志器，默认使用 `console`。

## 与 Pino 集成

```typescript
import pino from 'pino'
import { requestLogger } from '@vafast/request-logger'

const pinoLogger = pino({
  transport: {
    target: 'pino-pretty'
  }
})

server.use(requestLogger({
  logger: pinoLogger
}))
```

## 输出示例

```json
{
  "level": "info",
  "time": 1704067200000,
  "method": "POST",
  "path": "/api/users",
  "status": 201,
  "duration": 45,
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

## 相关链接

- [GitHub](https://github.com/vafast/vafast-request-logger)
- [npm](https://www.npmjs.com/package/@vafast/request-logger)

