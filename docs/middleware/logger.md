---
title: Logger - Vafast
---

# Logger

`@vafast/logger` 基于 [Pino](https://getpino.io/) 的**日志工厂**：导出 `createLogger` / `createLoggerSet` / `logError`。

::: warning 不是 HTTP 中间件
本包**没有** `logger()` 请求中间件，也不会自动记录 HTTP 访问日志。  
入站 / 出站请求日志请用 [@vafast/request-logger](/middleware/request-logger)。
:::

## 安装

```bash
npm install @vafast/logger
```

开发环境美化输出依赖 `pino-pretty`（本包已声明依赖；也可在项目中显式安装）：

```bash
npm install -D pino-pretty
```

## 快速开始

推荐在 `src/utils/logger.ts` 建单例，再到处引用：

```typescript
// src/utils/logger.ts
import { createLogger } from '@vafast/logger'

export const logger = createLogger({ name: 'my-app' })
```

```typescript
import { logger } from '~/utils/logger'

logger.info('Server started')
logger.error({ err, module: 'db' }, 'Query failed')
logger.debug({ userId: 'u_1' }, 'User logged in')
```

## 用法

### `createLogger`（推荐）

单个 Pino 实例，适合大多数场景。需要模块区分时，在日志对象里加 `module` 字段即可：

```typescript
import { createLogger } from '@vafast/logger'

const logger = createLogger({
  name: 'my-app',
  level: 'debug',
  production: process.env.NODE_ENV === 'production',
})

logger.info('ok')
logger.warn({ module: 'auth' }, 'token expired')
```

### `createLoggerSet`（按模块）

为大型应用预建带 `module` 字段的子 logger：

```typescript
import { createLoggerSet } from '@vafast/logger'

const loggers = createLoggerSet({ name: 'my-app' })

loggers.app.info('Server started')
loggers.db.info('Query')       // 自动 { module: 'db' }
loggers.auth.info('Login')     // 自动 { module: 'auth' }
loggers.route.info('GET /')
loggers.middleware.debug('CORS')
loggers.external.info('HTTP call')
```

集合字段：`app` / `route` / `db` / `middleware` / `auth` / `external`。

### `logError`

结构化记录 `Error`（含 `message` / `name` / `stack`）：

```typescript
import { createLogger, logError } from '@vafast/logger'

const logger = createLogger({ name: 'my-app' })

try {
  await doWork()
} catch (error) {
  if (error instanceof Error) {
    logError(logger, error, 'doWork failed', { userId: 'u_1' })
  }
}
```

### 与 Request ID 一起用

```typescript
import { createLogger } from '@vafast/logger'

const logger = createLogger({ name: 'my-app' })

defineRoute({
  method: 'GET',
  path: '/work',
  handler: ({ requestId: id }) => {
    logger.info({ requestId: id }, 'work start')
    return { ok: true }
  },
})
```

## API完整参数

### `createLogger(config?)`

```typescript
createLogger(config?: LoggerConfig): Logger
```

返回 [Pino `Logger`](https://getpino.io/#/docs/api?id=logger)。

### `createLoggerSet(config?)`

```typescript
createLoggerSet(config?: LoggerConfig): LoggerSet
```

基于同一个根 logger 创建 `child({ module })`。

### `LoggerConfig`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `name` | `string` | — | 应用名，写入 Pino `name` |
| `level` | `'trace' \| 'debug' \| 'info' \| 'warn' \| 'error' \| 'fatal' \| 'silent'` | `'info'` | 非生产环境使用的级别 |
| `production` | `boolean` | `process.env.NODE_ENV === 'production'` | 生产时级别固定为 `info`，且关闭 pretty |
| `pretty` | `boolean` | `true` | 非生产且为 `true` 时启用 `pino-pretty` transport |
| `pinoOptions` | `LoggerOptions` | `{}` | 透传给 Pino，可覆盖上述选项 |

生产行为要点：

- `production === true` → `level` 强制 `'info'`，不挂 `pino-pretty`
- 非生产且 `pretty` → `transport.target = 'pino-pretty'`（`colorize`、`translateTime: 'SYS:standard'`、`ignore: 'pid,hostname'`）

### `logError(logger, error, message?, context?)`

```typescript
logError(
  logger: Logger,
  error: Error,
  message?: string,
  context?: Record<string, unknown>,
): void
```

等价于：

```typescript
logger.error(
  { err: { message, name, stack }, ...context },
  message ?? error.message,
)
```

### `LoggerSet`

| 字段 | 说明 |
|------|------|
| `app` | 根 logger |
| `route` | `child({ module: 'route' })` |
| `db` | `child({ module: 'db' })` |
| `middleware` | `child({ module: 'middleware' })` |
| `auth` | `child({ module: 'auth' })` |
| `external` | `child({ module: 'external' })` |

### 再导出

```typescript
import { pino, type Logger, type LoggerOptions } from '@vafast/logger'
```

## 最佳实践

- **一个应用一个单例** `createLogger`，通过模块路径复用，避免到处 `new`
- 业务错误用 `logError`，保证 stack 结构一致
- HTTP 访问日志交给 `request-logger`；本包只记业务 / 系统事件
- 需要按模块过滤时用 `createLoggerSet`，或手动 `{ module: '...' }`
- 生产依赖 JSON 行日志（关闭 pretty），交给采集侧解析

## 注意事项

- **没有** `app.use(logger())`、**没有** `logRequest` 等 HTTP 中间件 API  
- `production: true` 会忽略你传入的 `level`（固定 `info`）  
- pretty 依赖 `pino-pretty`；缺失时开发环境 transport 可能报错  
- 本包不感知 `requestId`；关联追踪请自行写入日志字段

## 相关链接

- [Request Logger](/middleware/request-logger)
- [Request ID](/middleware/request-id)
- [最佳实践](/essential/best-practice)
