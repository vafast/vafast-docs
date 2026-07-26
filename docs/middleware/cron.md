---
title: Cron - Vafast
---

# Cron

`@vafast/cron` 基于 [croner](https://github.com/Hexagon/croner) 提供**进程内定时任务**。

::: warning 不是 HTTP 中间件
它**不是** Vafast 请求中间件，**不要**写 `server.use(cron(...))`。正确用法是在进程启动时调用 `cron({ pattern, name, run })`，与 `serve` 并列运行。返回值是 croner 的 `Cron` 实例，可用于 `stop()` / `resume()` 等。
:::

## 先搞清几个概念（给新用户）

### 和中间件有什么区别？

| | HTTP 中间件 | `@vafast/cron` |
|--|-------------|----------------|
| 触发时机 | 每个请求经过时 | 按日历/时钟到点执行 |
| 挂载方式 | `server.use` / 路由 `middleware` | 进程入口直接 `cron({...})` |
| 典型用途 | 鉴权、压缩、日志 | 清理临时文件、发报表、心跳 |

多实例部署时，每个进程各自调度——若任务不能重复执行，需要外部锁或分布式调度，而不是只靠本包。

### Cron 表达式是什么？

用空格分隔的字段描述「何时跑」。本包（croner）支持可选的**秒**字段：

```plain
┌────────────── second（可选）
│ ┌──────────── minute
│ │ ┌────────── hour
│ │ │ ┌──────── day of month
│ │ │ │ ┌────── month
│ │ │ │ │ ┌──── day of week
│ │ │ │ │ │
* * * * * *
```

示例：

| 表达式 | 含义 |
|--------|------|
| `*/30 * * * * *` | 每 30 秒 |
| `0 */5 * * * *` | 每 5 分钟（秒为 0） |
| `0 0 * * *` | 每天 00:00（5 段，无秒） |
| `0 9 * * 1-5` | 工作日 09:00 |

也可用 `Patterns` 辅助生成，减少手写出错（见下文）。

### `CronConfig` 三个必填字段

```typescript
cron({
  pattern: '...', // 何时跑
  name: '...',    // 任务名（给 run 里的 mock store 当键）
  run: (store) => { /* 到点执行 */ },
  // ...其余选项透传给 croner 的 CronOptions
})
```

注意：参数是**一个配置对象**，不是 `cron(pattern, callback)`。

## 安装

```bash
npm install @vafast/cron
```

## 快速开始

```typescript
import { cron, Patterns } from '@vafast/cron'

const job = cron({
  name: 'cleanup',
  pattern: Patterns.EVERY_HOUR,
  run: async () => {
    await cleanupTempFiles()
  },
})

// 返回 croner 的 Cron 实例（创建后即开始调度）
// job.stop() / job.resume() / job.nextRun()
```

## 用法

### 与 HTTP 服务并列启动

在进程启动时创建任务即可，与 `serve` 无关：

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

### Patterns 辅助

从 `@vafast/cron` 直接导入（**没有** `@vafast/cron/schedule` 子路径）。`Patterns` 合并了三类内容：

1. **常量表达式**（字符串）
2. **工厂函数**（按参数生成表达式）
3. **星期枚举**（`SUNDAY`…`SATURDAY`，值为 0–6）

常用常量：

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
Patterns.EVERY_WEEKDAY         // 工作日 00:00
Patterns.EVERY_WEEKEND
Patterns.EVERY_WEEK
Patterns.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT
Patterns.EVERY_QUARTER
Patterns.EVERY_YEAR
```

常用函数：

```typescript
Patterns.everySenconds(5)              // 注意源码拼写为 Senconds
Patterns.everyMinutes(10)
Patterns.everyHours(2)
Patterns.everyHoursAt(2, 15)           // 每 2 小时的第 15 分
Patterns.everyDayAt('09:30')
Patterns.everyWeekOn(Patterns.MONDAY, '10:00')
Patterns.everyWeekdayAt('08:00')
Patterns.everyWeekendAt('10:00')

// 别名风格
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

也可直接写字符串：`pattern: '0 */5 * * * *'`。

### 透传有用的 CronOptions（croner）

`pattern` / `name` / `run` 之外的字段会 `...options` 传给 `new Cron(pattern, options, callback)`。下列选项在实践中最常用（完整列表见 croner）：

| 选项 | 类型 | 说明 |
|------|------|------|
| `timezone` | `string` | 时区，如 `'Asia/Shanghai'`。按当地日历解释表达式 |
| `utcOffset` | `number` | UTC 偏移（分钟）；与 timezone 二选一场景下按 croner 规则使用 |
| `paused` | `boolean` | `true` 时创建后先不跑，稍后 `resume()` |
| `maxRuns` | `number` | 最多执行次数；默认无限 |
| `protect` | `boolean \| fn` | `true` 时若上次还没跑完则跳过本次，避免重叠 |
| `catch` | `boolean \| fn` | 捕获 `run` 抛错；可为 `true` 或 `(error, job) => void` |
| `interval` | `number` | 两次执行的最小间隔（秒） |
| `startAt` / `stopAt` | `string \| Date` | 调度生效的起止时间 |
| `unref` | `boolean` | `true` 时 timer unref，不阻止 Node 进程退出 |
| `legacyMode` | `boolean` | croner 兼容模式；库默认多为 `true` |
| `context` | `unknown` | croner 会传给其原生 callback 的上下文；**本包包装后的 `run` 收到的是 mock store，不是该 context** |

示例：

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

### 控制任务生命周期

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

`run` 收到的参数形如 `{ cron: { [name]: Cron } }`（类型标注为 `Cron`，实际是该 mock store），便于在回调里拿到当前任务实例。

## API

```typescript
cron(config: CronConfig): Cron
```

### `CronConfig`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pattern` | `string` | 是 | cron 表达式、日期或 ISO 8601 时间；缺省抛错 |
| `name` | `string` | 是 | 任务名（mock store 键）；缺省抛错。该字段会从配置中取出，**不会**再作为 croner `options.name` 传入 |
| `run` | `(store) => any \| Promise<any>` | 是 | 到点执行的函数 |
| `...options` | croner `CronOptions` | 否 | 见上表透传项 |

### 导出

| 导出 | 说明 |
|------|------|
| `cron` / `default` | 创建定时任务 |
| `Patterns` | 常量表达式 + 辅助函数 + 星期枚举 |
| `CronConfig` | 配置类型 |

## 最佳实践

1. 在**进程入口**注册任务，不要放进请求 handler 里反复 `cron()`
2. 优先用 `Patterns.*`，减少手写表达式出错
3. 长任务开启 `protect: true`，并保证业务幂等
4. 多实例部署用外部锁 / 分布式调度，避免重复执行
5. 需要按 HTTP 启停时，把 `Cron` 实例存模块级变量，在路由里 `stop()` / `resume()`
6. 跨时区业务明确设置 `timezone`

## 注意事项

- **不是** `server.use(cron(...))`；挂成中间件无效且语义错误
- 每个进程各自调度；水平扩展会重复跑，除非用外部协调
- `pattern` / `name` 为空会同步抛错
- `Patterns.everySenconds` 的拼写与源码一致（双写 `n` 的 `Senconds`）
- 其余调度细节以 [croner](https://github.com/Hexagon/croner) 为准

## 相关链接

- [部署指南](/patterns/deploy)
- [中间件概述](/middleware/overview)
- [croner](https://github.com/Hexagon/croner)
