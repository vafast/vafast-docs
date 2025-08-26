---
title: Cron 中间件 - Vafast
head:
    - - meta
      - property: 'og:title'
        content: Cron 中间件 - Vafast

    - - meta
      - name: 'description'
        content: 为 Vafast 添加运行 cronjob 支持的中间件。首先，通过 "bun add @vafast/cron" 安装该中间件。

    - - meta
      - name: 'og:description'
        content: 为 Vafast 添加运行 cronjob 支持的中间件。首先，通过 "bun add @vafast/cron" 安装该中间件。
---

# Cron 中间件

此中间件为 [Vafast](https://github.com/vafastjs/vafast) 服务器添加了运行 cronjob 的支持。

## 安装

通过以下方式安装：

```bash
bun add @vafast/cron
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { cron } from '@vafast/cron'

// 创建 cron 任务
const heartbeatCron = cron({
    name: 'heartbeat',
    pattern: '*/30 * * * * *', // 每30秒执行一次
    run(store) {
        console.log('Heartbeat - Working')
    }
})

// 定义路由
const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return { message: 'Vafast Cron API' }
        })
    }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
    fetch: (req: Request) => server.fetch(req)
}
```

上述代码将每 30 秒记录一次 `heartbeat`。

## API 参考

### cron

为 Vafast 服务器创建一个 cronjob。

```typescript
cron(config: CronConfig, callback: (store: Cron) => void): Cron
```

### CronConfig

`CronConfig` 接受以下参数：

#### name

注册到 `store` 的作业名称。

这将以指定的名称将 cron 实例注册到 `store`，可供后续过程引用，例如停止作业。

#### pattern

根据下面的 [cron 语法](https://en.wikipedia.org/wiki/Cron) 指定作业运行时间：

```
┌────────────── 秒（可选）
│ ┌──────────── 分钟
│ │ ┌────────── 小时
│ │ │ ┌──────── 每月的日期
│ │ │ │ ┌────── 月
│ │ │ │ │ ┌──── 星期几
│ │ │ │ │ │
* * * * * *
```

可以使用 [Crontab Guru](https://crontab.guru/) 等工具生成。

#### run

在指定时间执行的函数。

```typescript
run: (store: Cron) => any | Promise<any>
```

---

此中间件通过 [croner](https://github.com/hexagon/croner) 扩展了 Vafast 的 cron 方法。

以下是 croner 接受的配置选项：

### timezone

以欧洲/斯德哥尔摩格式表示的时区。

### startAt

作业的调度开始时间。

### stopAt

作业的调度停止时间。

### maxRuns

最大执行次数。

### catch

即使触发的函数抛出未处理错误，也继续执行。

### interval

执行之间的最小间隔（秒）。

## 使用模式

### 1. 基本定时任务

```typescript
import { Server, createRouteHandler } from 'vafast'
import { cron } from '@vafast/cron'

// 创建定时任务
const cleanupCron = cron({
    name: 'cleanup',
    pattern: '0 2 * * *', // 每天凌晨2点执行
    run(store) {
        console.log('执行清理任务:', new Date().toISOString())
        // 执行清理逻辑
        cleanupOldFiles()
        cleanupDatabase()
    }
})

const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return { message: 'Cleanup cron job is running' }
        })
    }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 2. 任务生命周期管理

```typescript
import { Server, createRouteHandler } from 'vafast'
import { cron } from '@vafast/cron'

// 创建可控制的 cron 任务
const loggerCron = cron({
    name: 'logger',
    pattern: '*/1 * * * * *', // 每秒执行一次
    run(store) {
        console.log(new Date().toISOString())
    }
})

const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            // 停止 logger 任务
            loggerCron.stop()
            return { message: 'Logger stopped' }
        })
    },
    {
        method: 'GET',
        path: '/status',
        handler: createRouteHandler(() => {
            return {
                logger: loggerCron.isRunning(),
                nextRun: loggerCron.nextRun()
            }
        })
    },
    {
        method: 'POST',
        path: '/start-logger',
        handler: createRouteHandler(() => {
            loggerCron.resume()
            return { message: 'Logger started' }
        })
    }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 3. 多个定时任务

```typescript
import { Server, createRouteHandler } from 'vafast'
import { cron } from '@vafast/cron'

// 创建多个 cron 任务
const heartbeatCron = cron({
    name: 'heartbeat',
    pattern: '*/30 * * * * *', // 每30秒
    run(store) {
        console.log('Heartbeat check')
        checkSystemHealth()
    }
})

const backupCron = cron({
    name: 'backup',
    pattern: '0 3 * * *', // 每天凌晨3点
    run(store) {
        console.log('Starting backup')
        performBackup()
    }
})

const maintenanceCron = cron({
    name: 'maintenance',
    pattern: '0 4 * * 0', // 每周日凌晨4点
    run(store) {
        console.log('Starting maintenance')
        performMaintenance()
    }
})

const routes = [
    {
        method: 'GET',
        path: '/cron/status',
        handler: createRouteHandler(() => {
            return {
                heartbeat: {
                    running: heartbeatCron.isRunning(),
                    nextRun: heartbeatCron.nextRun()
                },
                backup: {
                    running: backupCron.isRunning(),
                    nextRun: backupCron.nextRun()
                },
                maintenance: {
                    running: maintenanceCron.isRunning(),
                    nextRun: maintenanceCron.nextRun()
                }
            }
        })
    }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 4. 条件执行和错误处理

```typescript
import { Server, createRouteHandler } from 'vafast'
import { cron } from '@vafast/cron'

const dataSyncCron = cron({
    name: 'dataSync',
    pattern: '*/5 * * * *', // 每5分钟
    catch: true, // 即使出错也继续执行
    maxRuns: 1000, // 最大执行1000次
    run(store) {
        try {
            console.log('开始数据同步...')
            
            // 检查系统状态
            if (!isSystemReady()) {
                console.log('系统未就绪，跳过本次同步')
                return
            }
            
            // 执行数据同步
            const result = syncData()
            console.log('数据同步完成:', result)
            
        } catch (error) {
            console.error('数据同步出错:', error)
            // 发送告警
            sendAlert('数据同步失败', error)
        }
    }
})

const routes = [
    {
        method: 'GET',
        path: '/sync/status',
        handler: createRouteHandler(() => {
            return {
                running: dataSyncCron.isRunning(),
                nextRun: dataSyncCron.nextRun(),
                lastRun: dataSyncCron.lastRun()
            }
        })
    }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

## 预定义模式

您可以使用 `@vafast/cron/schedule` 中的预定义模式。

```typescript
import { cron, Patterns } from '@vafast/cron'

// 使用预定义模式
const job = cron({
    name: 'scheduled',
    pattern: Patterns.EVERY_SECOND, // 每秒执行
    run(store) {
        console.log('Scheduled task')
    }
})

// 使用函数模式
const customJob = cron({
    name: 'custom',
    pattern: Patterns.everyMinutes(5), // 每5分钟
    run(store) {
        console.log('Custom scheduled task')
    }
})
```

### 函数模式

| 函数                                   | 描述                                                |
| -------------------------------------- | --------------------------------------------------- |
| `.everySenconds(2)`                    | 每 2 秒运行一次任务                                  |
| `.everyMinutes(5)`                    | 每 5 分钟运行一次任务                                |
| `.everyHours(3)`                      | 每 3 小时运行一次任务                                |
| `.everyHoursAt(3, 15)`                | 每 3 小时在 15 分钟时运行一次任务                   |
| `.everyDayAt('04:19')`                | 每天在 04:19 运行一次任务                            |
| `.everyWeekOn(Patterns.MONDAY, '19:30')` | 每周一在 19:30 运行一次任务                        |
| `.everyWeekdayAt('17:00')`            | 每个工作日的 17:00 运行一次任务                     |
| `.everyWeekendAt('11:00')`            | 每周六和周日在 11:00 运行一次任务                  |

### 函数别名到常量

| 函数              | 常量                           |
| ----------------- | ------------------------------ |
| `.everySecond()`  | EVERY_SECOND                   |
| `.everyMinute()`  | EVERY_MINUTE                   |
| `.hourly()`       | EVERY_HOUR                     |
| `.daily()`        | EVERY_DAY_AT_MIDNIGHT          |
| `.everyWeekday()` | EVERY_WEEKDAY                  |
| `.everyWeekend()` | EVERY_WEEKEND                  |
| `.weekly()`       | EVERY_WEEK                     |
| `.monthly()`      | EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT |
| `.everyQuarter()` | EVERY_QUARTER                  |
| `.yearly()`       | EVERY_YEAR                     |

### 常量模式

| 常量                                    | 模式                    |
| --------------------------------------- | ----------------------- |
| `.EVERY_SECOND`                         | `* * * * * *`           |
| `.EVERY_5_SECONDS`                      | `*/5 * * * * *`         |
| `.EVERY_10_SECONDS`                     | `*/10 * * * * *`        |
| `.EVERY_30_SECONDS`                     | `*/30 * * * * *`        |
| `.EVERY_MINUTE`                         | `*/1 * * * *`           |
| `.EVERY_5_MINUTES`                      | `0 */5 * * * *`         |
| `.EVERY_10_MINUTES`                     | `0 */10 * * * *`        |
| `.EVERY_30_MINUTES`                     | `0 */30 * * * *`        |
| `.EVERY_HOUR`                           | `0 0-23/1 * * *`        |
| `.EVERY_2_HOURS`                        | `0 0-23/2 * * *`        |
| `.EVERY_3_HOURS`                        | `0 0-23/3 * * *`        |
| `.EVERY_4_HOURS`                        | `0 0-23/4 * * *`        |
| `.EVERY_5_HOURS`                        | `0 0-23/5 * * *`        |
| `.EVERY_6_HOURS`                        | `0 0-23/6 * * *`        |
| `.EVERY_7_HOURS`                        | `0 0-23/7 * * *`        |
| `.EVERY_8_HOURS`                        | `0 0-23/8 * * *`        |
| `.EVERY_9_HOURS`                        | `0 0-23/9 * * *`        |
| `.EVERY_10_HOURS`                       | `0 0-23/10 * * *`       |
| `.EVERY_11_HOURS`                       | `0 0-23/11 * * *`       |
| `.EVERY_12_HOURS`                       | `0 0-23/12 * * *`       |
| `.EVERY_DAY_AT_1AM`                     | `0 01 * * *`            |
| `.EVERY_DAY_AT_2AM`                     | `0 02 * * *`            |
| `.EVERY_DAY_AT_3AM`                     | `0 03 * * *`            |
| `.EVERY_DAY_AT_4AM`                     | `0 04 * * *`            |
| `.EVERY_DAY_AT_5AM`                     | `0 05 * * *`            |
| `.EVERY_DAY_AT_6AM`                     | `0 06 * * *`            |
| `.EVERY_DAY_AT_7AM`                     | `0 07 * * *`            |
| `.EVERY_DAY_AT_8AM`                     | `0 08 * * *`            |
| `.EVERY_DAY_AT_9AM`                     | `0 09 * * *`            |
| `.EVERY_DAY_AT_10AM`                    | `0 10 * * *`            |
| `.EVERY_DAY_AT_11AM`                    | `0 11 * * *`            |
| `.EVERY_DAY_AT_NOON`                    | `0 12 * * *`            |
| `.EVERY_DAY_AT_1PM`                     | `0 13 * * *`            |
| `.EVERY_DAY_AT_2PM`                     | `0 14 * * *`            |
| `.EVERY_DAY_AT_3PM`                     | `0 15 * * *`            |
| `.EVERY_DAY_AT_4PM`                     | `0 16 * * *`            |
| `.EVERY_DAY_AT_5PM`                     | `0 17 * * *`            |
| `.EVERY_DAY_AT_6PM`                     | `0 18 * * *`            |
| `.EVERY_DAY_AT_7PM`                     | `0 19 * * *`            |
| `.EVERY_DAY_AT_8PM`                     | `0 20 * * *`            |
| `.EVERY_DAY_AT_9PM`                     | `0 21 * * *`            |
| `.EVERY_DAY_AT_10PM`                    | `0 22 * * *`            |
| `.EVERY_DAY_AT_11PM`                    | `0 23 * * *`            |
| `.EVERY_DAY_AT_MIDNIGHT`                | `0 0 * * *`             |
| `.EVERY_WEEK`                           | `0 0 * * 0`             |
| `.EVERY_WEEKDAY`                        | `0 0 * * 1-5`           |
| `.EVERY_WEEKEND`                        | `0 0 * * 6,0`           |
| `.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT`   | `0 0 1 * *`             |
| `.EVERY_1ST_DAY_OF_MONTH_AT_NOON`       | `0 12 1 * *`            |
| `.EVERY_2ND_HOUR`                       | `0 */2 * * *`           |
| `.EVERY_2ND_HOUR_FROM_1AM_THROUGH_11PM` | `0 1-23/2 * * *`        |
| `.EVERY_2ND_MONTH`                      | `0 0 1 */2 *`           |
| `.EVERY_QUARTER`                        | `0 0 1 */3 *`           |
| `.EVERY_6_MONTHS`                       | `0 0 1 */6 *`           |
| `.EVERY_YEAR`                           | `0 0 1 1 *`             |
| `.EVERY_30_MINUTES_BETWEEN_9AM_AND_5PM` | `0 */30 9-17 * * *`     |
| `.EVERY_30_MINUTES_BETWEEN_9AM_AND_6PM` | `0 */30 9-18 * * *`     |
| `.EVERY_30_MINUTES_BETWEEN_10AM_AND_7PM`| `0 */30 10-19 * * *`    |

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { cron, Patterns } from '@vafast/cron'

// 模拟业务函数
const checkSystemHealth = () => {
    const health = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        timestamp: new Date().toISOString()
    }
    
    if (health.cpu > 80 || health.memory > 80 || health.disk > 80) {
        console.warn('系统资源使用率过高:', health)
        sendAlert('系统告警', health)
    }
    
    return health
}

const performBackup = async () => {
    console.log('开始数据库备份...')
    try {
        // 模拟备份过程
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log('数据库备份完成')
        return { success: true, timestamp: new Date().toISOString() }
    } catch (error) {
        console.error('备份失败:', error)
        return { success: false, error: error.message }
    }
}

const cleanupOldFiles = () => {
    console.log('清理旧文件...')
    // 清理逻辑
    return { cleaned: Math.floor(Math.random() * 100) }
}

const sendAlert = (title: string, data: any) => {
    console.log(`告警: ${title}`, data)
    // 发送告警逻辑
}

// 创建多个 cron 任务
const healthCheckCron = cron({
    name: 'healthCheck',
    pattern: '*/30 * * * * *', // 每30秒
    run(store) {
        console.log('执行健康检查...')
        const health = checkSystemHealth()
        console.log('健康检查结果:', health)
    }
})

const backupCron = cron({
    name: 'backup',
    pattern: '0 2 * * *', // 每天凌晨2点
    run(store) {
        console.log('开始定时备份...')
        performBackup()
    }
})

const cleanupCron = cron({
    name: 'cleanup',
    pattern: '0 3 * * *', // 每天凌晨3点
    run(store) {
        console.log('开始清理任务...')
        const result = cleanupOldFiles()
        console.log('清理完成:', result)
    }
})

const maintenanceCron = cron({
    name: 'maintenance',
    pattern: '0 4 * * 0', // 每周日凌晨4点
    run(store) {
        console.log('开始系统维护...')
        // 维护逻辑
        console.log('系统维护完成')
    }
})

// 定义路由
const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return { 
                message: 'Vafast Cron Management API',
                endpoints: [
                    '/cron/status - 查看所有任务状态',
                    '/cron/health - 手动执行健康检查',
                    '/cron/backup - 手动执行备份',
                    '/cron/cleanup - 手动执行清理',
                    '/cron/stop/:name - 停止指定任务',
                    '/cron/start/:name - 启动指定任务'
                ]
            }
        })
    },
    {
        method: 'GET',
        path: '/cron/status',
        handler: createRouteHandler(() => {
            return {
                healthCheck: {
                    name: 'healthCheck',
                    running: healthCheckCron.isRunning(),
                    nextRun: healthCheckCron.nextRun(),
                    lastRun: healthCheckCron.lastRun()
                },
                backup: {
                    name: 'backup',
                    running: backupCron.isRunning(),
                    nextRun: backupCron.nextRun(),
                    lastRun: backupCron.lastRun()
                },
                cleanup: {
                    name: 'cleanup',
                    running: cleanupCron.isRunning(),
                    nextRun: cleanupCron.nextRun(),
                    lastRun: cleanupCron.lastRun()
                },
                maintenance: {
                    name: 'maintenance',
                    running: maintenanceCron.isRunning(),
                    nextRun: maintenanceCron.nextRun(),
                    lastRun: maintenanceCron.lastRun()
                }
            }
        })
    },
    {
        method: 'POST',
        path: '/cron/health',
        handler: createRouteHandler(() => {
            const health = checkSystemHealth()
            return { 
                message: '手动健康检查完成',
                result: health
            }
        })
    },
    {
        method: 'POST',
        path: '/cron/backup',
        handler: createRouteHandler(async () => {
            const result = await performBackup()
            return { 
                message: '手动备份完成',
                result
            }
        })
    },
    {
        method: 'POST',
        path: '/cron/cleanup',
        handler: createRouteHandler(() => {
            const result = cleanupOldFiles()
            return { 
                message: '手动清理完成',
                result
            }
        })
    },
    {
        method: 'POST',
        path: '/cron/stop/:name',
        handler: createRouteHandler((req: Request) => {
            const url = new URL(req.url)
            const name = url.pathname.split('/').pop()
            
            let cronJob: any
            switch (name) {
                case 'healthCheck':
                    cronJob = healthCheckCron
                    break
                case 'backup':
                    cronJob = backupCron
                    break
                case 'cleanup':
                    cronJob = cleanupCron
                    break
                case 'maintenance':
                    cronJob = maintenanceCron
                    break
                default:
                    return { error: '未知的任务名称' }
            }
            
            if (cronJob.isRunning()) {
                cronJob.stop()
                return { message: `任务 ${name} 已停止` }
            } else {
                return { message: `任务 ${name} 已经停止` }
            }
        })
    },
    {
        method: 'POST',
        path: '/cron/start/:name',
        handler: createRouteHandler((req: Request) => {
            const url = new URL(req.url)
            const name = url.pathname.split('/').pop()
            
            let cronJob: any
            switch (name) {
                case 'healthCheck':
                    cronJob = healthCheckCron
                    break
                case 'backup':
                    cronJob = backupCron
                    break
                case 'cleanup':
                    cronJob = cleanupCron
                    break
                case 'maintenance':
                    cronJob = maintenanceCron
                    break
                default:
                    return { error: '未知的任务名称' }
            }
            
            if (!cronJob.isRunning()) {
                cronJob.resume()
                return { message: `任务 ${name} 已启动` }
            } else {
                return { message: `任务 ${name} 已经在运行` }
            }
        })
    }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
    fetch: (req: Request) => server.fetch(req)
}

console.log('🚀 Vafast Cron Management API 服务器启动成功！')
console.log('📊 健康检查: 每30秒执行一次')
console.log('💾 数据备份: 每天凌晨2点执行')
console.log('🧹 文件清理: 每天凌晨3点执行')
console.log('🔧 系统维护: 每周日凌晨4点执行')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { cron } from '@vafast/cron'
import { Patterns } from '@vafast/cron/schedule'

describe('Vafast Cron API', () => {
    it('should create cron job', () => {
        let executed = false
        
        const job = cron({
            pattern: '*/1 * * * * *',
            name: 'test',
            run() {
                executed = true
            }
        })
        
        expect(job).toBeDefined()
        expect(typeof job.isRunning).toBe('function')
        expect(typeof job.stop).toBe('function')
        expect(typeof job.resume).toBe('function')
    })
    
    it('should use predefined patterns', () => {
        const job = cron({
            pattern: Patterns.EVERY_SECOND,
            name: 'test',
            run() {
                // 测试函数
            }
        })
        
        expect(job).toBeDefined()
        expect(job.isRunning()).toBe(true)
    })
    
    it('should use function patterns', () => {
        const job = cron({
            pattern: Patterns.everyMinutes(5),
            name: 'test',
            run() {
                // 测试函数
            }
        })
        
        expect(job).toBeDefined()
    })
    
    it('should handle cron job lifecycle', async () => {
        const job = cron({
            pattern: '*/1 * * * * *',
            name: 'test',
            run() {
                // 测试函数
            }
        })
        
        expect(job.isRunning()).toBe(true)
        
        // 测试停止功能
        job.stop()
        expect(job.isRunning()).toBe(false)
        
        // 测试恢复功能
        job.resume()
        // 注意：resume() 可能不会立即设置 isRunning 为 true
        // 这是 croner 的预期行为
    })
    
    it('should handle cron job with options', () => {
        const job = cron({
            pattern: '*/1 * * * * *',
            name: 'test',
            maxRuns: 5,
            catch: true,
            run() {
                // 测试函数
            }
        })
        
        expect(job).toBeDefined()
        expect(job.isRunning()).toBe(true)
    })
})
```

## 特性

- ✅ **灵活调度**: 支持标准的 cron 语法和预定义模式
- ✅ **任务管理**: 提供启动、停止、恢复等生命周期管理
- ✅ **错误处理**: 支持错误捕获和最大执行次数限制
- ✅ **时区支持**: 支持自定义时区设置
- ✅ **性能优化**: 基于 croner 的高性能实现
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **易于集成**: 无缝集成到 Vafast 应用

## 最佳实践

### 1. 任务命名

```typescript
// 使用描述性的名称
const healthCheckCron = cron({
    name: 'system-health-check', // 清晰的名称
    pattern: '*/30 * * * * *',
    run(store) {
        checkSystemHealth()
    }
})
```

### 2. 错误处理

```typescript
const criticalCron = cron({
    name: 'critical-task',
    pattern: '0 * * * *',
    catch: true, // 捕获错误
    run(store) {
        try {
            performCriticalTask()
        } catch (error) {
            console.error('关键任务执行失败:', error)
            // 发送告警
            sendAlert('关键任务失败', error)
        }
    }
})
```

### 3. 资源管理

```typescript
const resourceIntensiveCron = cron({
    name: 'resource-task',
    pattern: '0 2 * * *', // 在低峰期执行
    interval: 300, // 最小间隔5分钟
    run(store) {
        // 检查系统负载
        if (getSystemLoad() > 0.8) {
            console.log('系统负载过高，跳过本次执行')
            return
        }
        
        performResourceIntensiveTask()
    }
})
```

### 4. 监控和日志

```typescript
const monitoredCron = cron({
    name: 'monitored-task',
    pattern: '*/5 * * * *',
    run(store) {
        const startTime = Date.now()
        
        try {
            console.log('开始执行监控任务...')
            performTask()
            
            const duration = Date.now() - startTime
            console.log(`监控任务完成，耗时: ${duration}ms`)
            
            // 记录指标
            recordMetrics('monitored-task', { duration, success: true })
            
        } catch (error) {
            const duration = Date.now() - startTime
            console.error(`监控任务失败，耗时: ${duration}ms`, error)
            
            // 记录错误指标
            recordMetrics('monitored-task', { duration, success: false, error: error.message })
        }
    }
})
```

## 注意事项

1. **任务执行**: cron 任务会在后台自动执行，无需手动启动
2. **错误处理**: 建议在 `run` 函数中添加适当的错误处理逻辑
3. **资源管理**: 长时间运行的任务应该检查系统资源状态
4. **时区设置**: 在生产环境中，建议明确设置时区
5. **任务依赖**: 复杂的任务依赖关系应该通过任务队列或工作流引擎处理

## 相关链接

- [Cron 语法 - Wikipedia](https://en.wikipedia.org/wiki/Cron)
- [Crontab Guru](https://crontab.guru/) - 在线 cron 表达式生成器
- [Croner 文档](https://github.com/hexagon/croner) - 底层 cron 库
- [Vafast 官方文档](https://vafast.dev)
