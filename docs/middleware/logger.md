---
title: Logger 中间件 - Vafast
---

# Logger 中间件

轻量级请求日志中间件。

## 安装

```bash
npm install @vafast/logger
```

## 使用

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'
import { logger } from '@vafast/logger'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello World')
  }
])

const server = new Server(routes)
server.use(logger())

export default { fetch: server.fetch }
```

输出示例：

```
[2024-01-01 12:00:00] GET / 200 12ms
[2024-01-01 12:00:01] POST /users 201 45ms
[2024-01-01 12:00:02] GET /users/123 404 3ms
```

## 配置项

```typescript
logger({
  // 自定义日志格式
  format: ({ method, path, status, duration }) => {
    return `${method} ${path} - ${status} (${duration}ms)`
  },
  
  // 跳过特定路径
  skip: (req) => req.url.includes('/health'),
  
  // 自定义输出
  output: console.log
})
```

### format

自定义日志格式函数。

参数：
- `method` - HTTP 方法
- `path` - 请求路径
- `status` - 响应状态码
- `duration` - 响应时间（毫秒）
- `req` - 原始 Request 对象

### skip

跳过日志记录的条件函数。

### output

自定义输出函数，默认为 `console.log`。

## 与 Pino 集成

```typescript
import pino from 'pino'
import { logger } from '@vafast/logger'

const pinoLogger = pino()

server.use(logger({
  output: (message) => pinoLogger.info(message)
}))
```

## 相关链接

- [GitHub](https://github.com/vafast/vafast-logger)
- [npm](https://www.npmjs.com/package/@vafast/logger)

