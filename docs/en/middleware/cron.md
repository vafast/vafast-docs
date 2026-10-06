---
title: Cron - Vafast
description: 'Vafast cron middleware: schedule recurring background jobs with cron expressions, control timezones, start and stop tasks, and run them alongside your web server.'
---

# Cron

`@vafast/cron` provides **in-process scheduled jobs** based on [croner](https://github.com/Hexagon/croner).

::: warning Not HTTP middleware
It is **not** Vafast request middleware; **don't** write `server.use(cron(...))`. The correct usage is to call `cron({ pattern, name, run })` at process startup, running alongside `serve`. It returns a croner `Cron` instance that you can `stop()` / `resume()` and so on.
:::

## Key Concepts (for New Users)

### How Is It Different from Middleware?

| | HTTP middleware | `@vafast/cron` |
|--|-------------|----------------|
| Triggered | Whenever a request passes through | When the calendar/clock time arrives |
| Mounted via | `server.use` / route `middleware` | Call `cron({...})` directly in the process entry |
| Typical use | Auth, compression, logging | Cleaning temp files, sending reports, heartbeats |

In multi-instance deployments, each process schedules independently. If a job must not run more than once, you need an external lock or distributed scheduler, not just this package.

### What Is a Cron Expression?

Space-separated fields that describe "when to run". This package (croner) supports an optional **seconds** field:

```plain
┌────────────── second (optional)
│ ┌──────────── minute
│ │ ┌────────── hour
│ │ │ ┌──────── day of month
│ │ │ │ ┌────── month
│ │ │ │ │ ┌──── day of week
│ │ │ │ │ │
* * * * * *
```

Examples:

| Expression | Meaning |
|--------|------|
| `*/30 * * * * *` | Every 30 seconds |
| `0 */5 * * * *` | Every 5 minutes (at second 0) |
| `0 0 * * *` | Every day at 00:00 (5 fields, no seconds) |
| `0 9 * * 1-5` | Weekdays at 09:00 |

You can also generate expressions with the `Patterns` helpers to avoid mistakes (see below).

### The Three Required `CronConfig` Fields

```typescript
cron({
  pattern: '...', // when to run
  name: '...',    // job name (the key in the mock store passed to run)
  run: (store) => { /* runs on schedule */ },
  // ...other options are passed through to croner's CronOptions
})
```

Note: the argument is **a single config object**, not `cron(pattern, callback)`.

## Installation

```bash
npm install @vafast/cron
```

## Quick Start

```typescript
import { cron, Patterns } from '@vafast/cron'

const job = cron({
  name: 'cleanup',
  pattern: Patterns.EVERY_HOUR,
  run: async () => {
    await cleanupTempFiles()
  },
})

// returns a croner Cron instance (scheduling starts immediately)
// job.stop() / job.resume() / job.nextRun()
```

## Usage

### Starting Alongside the HTTP Server

Just create the job at process startup; it's independent of `serve`:

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { cron, Patterns } from '@vafast/cron'

cron({
  name: 'hourly-report',
  pattern: Patterns.EVERY_HOUR,
  run: () => sendReport(),
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/health',
    handler: () => ({ ok: true }),
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

### Patterns Helpers

Import directly from `@vafast/cron` (there is **no** `@vafast/cron/schedule` subpath). `Patterns` combines three kinds of things:

1. **Constant expressions** (strings)
2. **Factory functions** (generate expressions from arguments)
3. **Weekday enum** (`SUNDAY`…`SATURDAY`, values 0–6)

Common constants:

```typescript
import { Patterns } from '@vafast/cron'

Patterns.EVERY_SECOND          // '* * * * * *'
Patterns.EVERY_5_SECONDS
Patterns.EVERY_30_SECONDS
Patterns.EVERY_MINUTE
Patterns.EVERY_5_MINUTES
Patterns.EVERY_HOUR
Patterns.EVERY_DAY_AT_MIDNIGHT
Patterns.EVERY_DAY_AT_9AM
Patterns.EVERY_WEEKDAY         // weekdays at 00:00
Patterns.EVERY_WEEKEND
Patterns.EVERY_WEEK
Patterns.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT
Patterns.EVERY_QUARTER
Patterns.EVERY_YEAR
```

Common functions:

```typescript
Patterns.everySenconds(5)              // note: the source spells it Senconds
Patterns.everyMinutes(10)
Patterns.everyHours(2)
Patterns.everyHoursAt(2, 15)           // every 2 hours at minute 15
Patterns.everyDayAt('09:30')
Patterns.everyWeekOn(Patterns.MONDAY, '10:00')
Patterns.everyWeekdayAt('08:00')
Patterns.everyWeekendAt('10:00')

// alias style
Patterns.everySecond()
Patterns.everyMinute()
Patterns.hourly()
Patterns.daily()
Patterns.weekly()
Patterns.monthly()
Patterns.everyQuarter()
Patterns.yearly()
Patterns.everyWeekday()
Patterns.everyWeekend()
```

You can also write the string directly: `pattern: '0 */5 * * * *'`.

### Useful Pass-Through CronOptions (croner)

Fields other than `pattern` / `name` / `run` are passed as `...options` to `new Cron(pattern, options, callback)`. These are the most commonly used in practice (see croner for the full list):

| Option | Type | Description |
|------|------|------|
| `timezone` | `string` | Time zone, e.g. `'Asia/Shanghai'`. The expression is interpreted in that local calendar |
| `utcOffset` | `number` | UTC offset (minutes); used per croner's rules when choosing between it and timezone |
| `paused` | `boolean` | When `true`, the job doesn't run after creation until you call `resume()` |
| `maxRuns` | `number` | Maximum number of runs; unlimited by default |
| `protect` | `boolean \| fn` | When `true`, skips a run if the previous one hasn't finished, avoiding overlap |
| `catch` | `boolean \| fn` | Catches errors thrown by `run`; either `true` or `(error, job) => void` |
| `interval` | `number` | Minimum interval between runs (seconds) |
| `startAt` / `stopAt` | `string \| Date` | When scheduling starts and stops |
| `unref` | `boolean` | When `true`, the timer is unref'd and won't keep the Node process alive |
| `legacyMode` | `boolean` | croner compatibility mode; the library mostly defaults to `true` |
| `context` | `unknown` | The context croner passes to its native callback; **the `run` wrapped by this package receives the mock store, not this context** |

Example:

```typescript
const job = cron({
  name: 'shanghai-morning',
  pattern: Patterns.everyDayAt('09:00'),
  timezone: 'Asia/Shanghai',
  protect: true,
  catch: (error) => console.error('cron failed', error),
  maxRuns: 100,
  run: async () => {
    await sendMorningDigest()
  },
})
```

### Controlling the Job Lifecycle

```typescript
const job = cron({
  name: 'logger',
  pattern: Patterns.EVERY_30_SECONDS,
  run: () => console.log(new Date().toISOString()),
})

job.stop()
job.resume()
job.isRunning()
job.nextRun()
```

`run` receives an argument shaped like `{ cron: { [name]: Cron } }` (typed as `Cron`, but actually the mock store), so you can access the current job instance inside the callback.

## API

```typescript
cron(config: CronConfig): Cron
```

### `CronConfig`

| Parameter | Type | Required | Description |
|------|------|------|------|
| `pattern` | `string` | Yes | Cron expression, date or ISO 8601 time; throws if missing |
| `name` | `string` | Yes | Job name (mock store key); throws if missing. This field is extracted from the config and is **not** passed on as croner's `options.name` |
| `run` | `(store) => any \| Promise<any>` | Yes | The function to run on schedule |
| `...options` | croner `CronOptions` | No | See the pass-through options above |

### Exports

| Export | Description |
|------|------|
| `cron` / `default` | Create a scheduled job |
| `Patterns` | Constant expressions + helper functions + weekday enum |
| `CronConfig` | Config type |

## Best Practices

1. Register jobs in the **process entry**; don't call `cron()` repeatedly inside request handlers
2. Prefer `Patterns.*` to avoid mistakes in hand-written expressions
3. Enable `protect: true` for long jobs and keep the business logic idempotent
4. In multi-instance deployments, use external locks / distributed scheduling to avoid duplicate runs
5. To start/stop via HTTP, keep the `Cron` instance in a module-level variable and call `stop()` / `resume()` from a route
6. Set `timezone` explicitly for cross-time-zone business logic

## Notes

- It is **not** `server.use(cron(...))`; mounting it as middleware does nothing and is semantically wrong
- Each process schedules independently; horizontal scaling leads to duplicate runs unless coordinated externally
- An empty `pattern` / `name` throws synchronously
- The spelling of `Patterns.everySenconds` matches the source (`Senconds` with a doubled `n`)
- For other scheduling details, [croner](https://github.com/Hexagon/croner) is authoritative

## Related Links

- [Deployment Guide](/en/patterns/deploy)
- [Middleware Overview](/en/middleware/overview)
- [croner](https://github.com/Hexagon/croner)
