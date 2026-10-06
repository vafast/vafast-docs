---
title: Logger - Vafast
description: 'Vafast logger: structured, leveled application logging with pretty output in development, JSON in production and request context for TypeScript services.'
---

# Logger

`@vafast/logger` is a **logger factory** based on [Pino](https://getpino.io/) that exports `createLogger` / `createLoggerSet` / `logError`.

::: warning Not HTTP middleware
This package has **no** `logger()` request middleware and does not log HTTP access automatically.  
For inbound / outbound request logs, use [@vafast/request-logger](/en/middleware/request-logger).
:::

## Installation

```bash
npm install @vafast/logger
```

Pretty output in development depends on `pino-pretty` (declared as a dependency of this package; you can also install it explicitly in your project):

```bash
npm install -D pino-pretty
```

## Quick Start

We recommend creating a singleton in `src/utils/logger.ts` and importing it everywhere:

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

## Usage

### `createLogger` (Recommended)

A single Pino instance, suitable for most cases. When you need to distinguish modules, just add a `module` field to the log object:

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

### `createLoggerSet` (Per Module)

Pre-builds child loggers with a `module` field for larger applications:

```typescript
import { createLoggerSet } from '@vafast/logger'

const loggers = createLoggerSet({ name: 'my-app' })

loggers.app.info('Server started')
loggers.db.info('Query')       // automatically { module: 'db' }
loggers.auth.info('Login')     // automatically { module: 'auth' }
loggers.route.info('GET /')
loggers.middleware.debug('CORS')
loggers.external.info('HTTP call')
```

Set fields: `app` / `route` / `db` / `middleware` / `auth` / `external`.

### `logError`

Logs an `Error` in a structured way (including `message` / `name` / `stack`):

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

### Using It with Request ID

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

## Full API Parameters

### `createLogger(config?)`

```typescript
createLogger(config?: LoggerConfig): Logger
```

Returns a [Pino `Logger`](https://getpino.io/#/docs/api?id=logger).

### `createLoggerSet(config?)`

```typescript
createLoggerSet(config?: LoggerConfig): LoggerSet
```

Creates `child({ module })` loggers from the same root logger.

### `LoggerConfig`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `name` | `string` | — | Application name, written to Pino's `name` |
| `level` | `'trace' \| 'debug' \| 'info' \| 'warn' \| 'error' \| 'fatal' \| 'silent'` | `'info'` | Level used outside production |
| `production` | `boolean` | `process.env.NODE_ENV === 'production'` | In production the level is fixed at `info` and pretty is disabled |
| `pretty` | `boolean` | `true` | Enables the `pino-pretty` transport when not in production and `true` |
| `pinoOptions` | `LoggerOptions` | `{}` | Passed through to Pino; can override the options above |

Production behavior:

- `production === true` → `level` forced to `'info'`, no `pino-pretty`
- Not production and `pretty` → `transport.target = 'pino-pretty'` (`colorize`, `translateTime: 'SYS:standard'`, `ignore: 'pid,hostname'`)

### `logError(logger, error, message?, context?)`

```typescript
logError(
  logger: Logger,
  error: Error,
  message?: string,
  context?: Record<string, unknown>,
): void
```

Equivalent to:

```typescript
logger.error(
  { err: { message, name, stack }, ...context },
  message ?? error.message,
)
```

### `LoggerSet`

| Field | Description |
|------|------|
| `app` | Root logger |
| `route` | `child({ module: 'route' })` |
| `db` | `child({ module: 'db' })` |
| `middleware` | `child({ module: 'middleware' })` |
| `auth` | `child({ module: 'auth' })` |
| `external` | `child({ module: 'external' })` |

### Re-exports

```typescript
import { pino, type Logger, type LoggerOptions } from '@vafast/logger'
```

## Best Practices

- **One `createLogger` singleton per app**, reused via its module path instead of creating new ones everywhere
- Use `logError` for business errors to keep stack structure consistent
- Leave HTTP access logs to `request-logger`; this package only records business / system events
- Use `createLoggerSet`, or a manual `{ module: '...' }`, when you need per-module filtering
- In production, rely on JSON line logs (pretty off) for your log collector to parse

## Notes

- There is **no** `app.use(logger())` and **no** HTTP middleware API like `logRequest`  
- `production: true` ignores the `level` you pass (fixed at `info`)  
- pretty depends on `pino-pretty`; if it's missing, the development transport may throw  
- This package isn't aware of `requestId`; write it into log fields yourself for correlation

## Related Links

- [Request Logger](/en/middleware/request-logger)
- [Request ID](/en/middleware/request-id)
- [Best Practices](/en/essential/best-practice)
