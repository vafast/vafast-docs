---
title: 性能监控 - Vafast
---

# 性能监控

Vafast 提供了**零外部依赖**的内置监控系统，帮助您追踪请求性能、识别瓶颈。

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { withMonitoring } from 'vafast/monitoring'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  })
])

const server = new Server(routes)

// 添加监控
const monitored = withMonitoring(server)

serve({ fetch: monitored.fetch, port: 3000 })
```

启动后控制台会显示：

```
✅ Monitoring enabled
Config: { slowThreshold: '1000ms', maxRecords: 1000, samplingRate: 1, excludePaths: [] }
```

每个请求都会记录：

```
✅ GET / - 200 (0.52ms)
✅ GET /users - 200 (12.34ms)
❌ GET /not-found - 404 (0.31ms)
⚠️ POST /slow - 200 (🐌 1523.45ms)  // 超过阈值显示慢请求
```

## 配置选项

```typescript
const monitored = withMonitoring(server, {
  // 是否启用监控，默认 true
  enabled: true,
  
  // 是否输出到控制台，默认 true
  console: true,
  
  // 慢请求阈值（毫秒），超过会显示 🐌，默认 1000
  slowThreshold: 500,
  
  // 最大记录数（环形缓冲区），默认 1000
  maxRecords: 5000,
  
  // 采样率 0-1，默认 1（全部记录）
  // 高流量场景可设置 0.1 只记录 10%
  samplingRate: 1,
  
  // 排除的路径（不记录）
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  
  // 自定义标签
  tags: { service: 'api', env: 'production' },
  
  // 请求完成回调
  onRequest: (metrics) => {
    // 发送到外部监控系统
    sendToPrometheus(metrics)
  },
  
  // 慢请求回调
  onSlowRequest: (metrics) => {
    console.warn(`⚠️ 慢请求: ${metrics.path} (${metrics.totalTime}ms)`)
    alertSlack(`慢请求警告: ${metrics.path}`)
  }
})
```

## 获取监控状态

### 完整状态

```typescript
const status = monitored.getMonitoringStatus()

console.log(status)
// {
//   enabled: true,
//   uptime: 3600000,              // 服务运行时间（毫秒）
//   totalRequests: 15000,
//   successfulRequests: 14500,
//   failedRequests: 500,
//   errorRate: 0.0333,
//   avgResponseTime: 12.45,       // 平均响应时间
//   p50: 8.2,                     // 50% 请求在此时间内完成
//   p95: 45.6,                    // 95% 请求在此时间内完成
//   p99: 120.3,                   // 99% 请求在此时间内完成
//   minTime: 0.5,
//   maxTime: 2500.8,
//   rps: 15.2,                    // 当前每秒请求数
//   statusCodes: {
//     '2xx': 14000,
//     '3xx': 200,
//     '4xx': 300,
//     '5xx': 500,
//     detail: { 200: 13500, 201: 500, 404: 250, 500: 500 }
//   },
//   timeWindows: {
//     last1min: { requests: 150, successful: 145, failed: 5, errorRate: 0.033, avgTime: 10.2, rps: 2.5 },
//     last5min: { requests: 750, successful: 720, failed: 30, errorRate: 0.04, avgTime: 11.5, rps: 2.5 },
//     last1hour: { requests: 9000, successful: 8700, failed: 300, errorRate: 0.033, avgTime: 12.1, rps: 2.5 }
//   },
//   byPath: {
//     '/': { count: 5000, avgTime: 5.2, minTime: 0.5, maxTime: 50.3, errorCount: 0 },
//     '/users': { count: 3000, avgTime: 15.8, minTime: 2.1, maxTime: 200.5, errorCount: 100 },
//     '/posts': { count: 2000, avgTime: 25.3, minTime: 5.2, maxTime: 500.8, errorCount: 50 }
//   },
//   memoryUsage: { heapUsed: '45.23MB', heapTotal: '100.50MB' },
//   recentRequests: [ ... ]       // 最近 5 条请求
// }
```

### 时间窗口统计

```typescript
// 预设时间窗口
const { last1min, last5min, last1hour } = status.timeWindows

console.log(`最近 1 分钟: ${last1min.requests} 请求, 错误率 ${(last1min.errorRate * 100).toFixed(1)}%`)
console.log(`最近 5 分钟: ${last5min.requests} 请求, 平均 ${last5min.avgTime}ms`)
console.log(`最近 1 小时: ${last1hour.requests} 请求, RPS ${last1hour.rps}`)

// 自定义时间窗口
const last30sec = monitored.getTimeWindowStats(30000)  // 最近 30 秒
const last10min = monitored.getTimeWindowStats(600000) // 最近 10 分钟

console.log(`最近 30 秒: ${last30sec.requests} 请求`)
```

### RPS（每秒请求数）

```typescript
// 当前 RPS（基于最近 10 秒）
const rps = monitored.getRPS()
console.log(`当前 RPS: ${rps}`)

// 也可从状态获取
console.log(`当前 RPS: ${status.rps}`)
```

### 状态码分布

```typescript
const dist = monitored.getStatusCodeDistribution()

console.log(`成功 (2xx): ${dist['2xx']}`)
console.log(`重定向 (3xx): ${dist['3xx']}`)
console.log(`客户端错误 (4xx): ${dist['4xx']}`)
console.log(`服务器错误 (5xx): ${dist['5xx']}`)

// 详细分布
console.log(`200 OK: ${dist.detail[200]}`)
console.log(`201 Created: ${dist.detail[201]}`)
console.log(`404 Not Found: ${dist.detail[404]}`)
console.log(`500 Internal Error: ${dist.detail[500]}`)
```

### 按路径统计

```typescript
// 获取单个路径统计
const userStats = monitored.getPathStats('/users')

if (userStats) {
  console.log(`/users 路径:`)
  console.log(`  请求数: ${userStats.count}`)
  console.log(`  平均时间: ${userStats.avgTime.toFixed(2)}ms`)
  console.log(`  最小时间: ${userStats.minTime.toFixed(2)}ms`)
  console.log(`  最大时间: ${userStats.maxTime.toFixed(2)}ms`)
  console.log(`  错误数: ${userStats.errorCount}`)
}

// 获取所有路径统计
const { byPath } = status
Object.entries(byPath).forEach(([path, stats]) => {
  console.log(`${path}: ${stats.count} 请求, 平均 ${stats.avgTime}ms`)
})
```

### 百分位数

```typescript
const { p50, p95, p99 } = status

console.log(`P50: ${p50}ms`)  // 50% 请求在此时间内完成
console.log(`P95: ${p95}ms`)  // 95% 请求在此时间内完成  
console.log(`P99: ${p99}ms`)  // 99% 请求在此时间内完成

// P99 是衡量服务质量的关键指标
// 如果 P99 > 阈值，说明有 1% 的请求体验较差
```

## 暴露监控端点

```typescript
import { Server, defineRoute, defineRoutes, serve, err } from 'vafast'
import { withMonitoring, type MonitoredServer } from 'vafast/monitoring'

// 创建监控端点路由
function createMetricsRoutes(getServer: () => MonitoredServer) {
  return defineRoutes([
    defineRoute({
      method: 'GET',
      path: '/metrics',
      handler: () => getServer().getMonitoringStatus()
    }),
    defineRoute({
      method: 'GET',
      path: '/metrics/rps',
      handler: () => ({ rps: getServer().getRPS() })
    }),
    defineRoute({
      method: 'GET',
      path: '/metrics/status-codes',
      handler: () => getServer().getStatusCodeDistribution()
    }),
    defineRoute({
      method: 'GET',
      path: '/metrics/path/:path',
      handler: ({ params }) => {
        const stats = getServer().getPathStats(`/${params.path}`)
        if (!stats) {
          throw err.notFound('路径未找到')
        }
        return stats
      }
    }),
    defineRoute({
      method: 'POST',
      path: '/metrics/reset',
      handler: () => {
        getServer().resetMonitoring()
        return { message: '监控数据已重置' }
      }
    })
  ])
}

// 主应用路由
const appRoutes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  }),
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => [{ id: 1, name: 'Alice' }]
  })
])

// 延迟获取 monitoredServer 的引用
let monitoredServer: MonitoredServer

const allRoutes = [
  ...appRoutes,
  ...createMetricsRoutes(() => monitoredServer)
]

const server = new Server(allRoutes)
monitoredServer = withMonitoring(server, {
  excludePaths: ['/metrics', '/health']  // 排除监控端点自身
})

serve({ fetch: monitoredServer.fetch, port: 3000 })
```

访问：

- `GET /metrics` - 完整监控状态
- `GET /metrics/rps` - 当前 RPS
- `GET /metrics/status-codes` - 状态码分布
- `GET /metrics/path/users` - `/users` 路径统计
- `POST /metrics/reset` - 重置监控数据

## 高级用法

### 采样率控制

高流量场景下，记录所有请求可能影响性能。使用采样率：

```typescript
const monitored = withMonitoring(server, {
  // 只记录 10% 的请求
  samplingRate: 0.1
})
```

### 慢请求告警

```typescript
const monitored = withMonitoring(server, {
  slowThreshold: 500,  // 500ms 以上视为慢请求
  
  onSlowRequest: async (metrics) => {
    // 记录日志
    console.error(`[SLOW] ${metrics.method} ${metrics.path} - ${metrics.totalTime.toFixed(2)}ms`)
    
    // 发送告警
    await fetch('https://hooks.slack.com/services/xxx', {
      method: 'POST',
      body: JSON.stringify({
        text: `⚠️ 慢请求告警: ${metrics.path} (${metrics.totalTime.toFixed(0)}ms)`
      })
    })
  }
})
```

### 发送到外部监控

```typescript
const monitored = withMonitoring(server, {
  onRequest: (metrics) => {
    // 发送到 Prometheus Pushgateway
    fetch('http://prometheus:9091/metrics/job/vafast', {
      method: 'POST',
      body: `http_request_duration_ms{method="${metrics.method}",path="${metrics.path}",status="${metrics.statusCode}"} ${metrics.totalTime}`
    })
    
    // 或发送到 InfluxDB
    fetch('http://influxdb:8086/write?db=metrics', {
      method: 'POST',
      body: `requests,method=${metrics.method},path=${metrics.path},status=${metrics.statusCode} duration=${metrics.totalTime}`
    })
  }
})
```

### 便捷创建函数

```typescript
import { Server } from 'vafast'
import { createMonitoredServer } from 'vafast/monitoring'

// 一步创建带监控的 Server
const monitored = createMonitoredServer(Server, routes, {
  slowThreshold: 500,
  excludePaths: ['/health']
})

serve({ fetch: monitored.fetch, port: 3000 })
```

## 监控仪表盘示例

```typescript
import { Server, defineRoute, defineRoutes, serve, html } from 'vafast'
import { withMonitoring, type MonitoredServer } from 'vafast/monitoring'

let monitoredServer: MonitoredServer

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  }),
  defineRoute({
    method: 'GET',
    path: '/dashboard',
    handler: () => {
      const status = monitoredServer.getMonitoringStatus()
      
      return html(`
        <!DOCTYPE html>
        <html>
          <head>
          <title>Vafast 监控仪表盘</title>
            <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
            h1 { color: #38bdf8; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
            .card { background: #1e293b; padding: 20px; border-radius: 12px; }
            .card h3 { margin: 0 0 8px 0; color: #94a3b8; font-size: 14px; }
            .card .value { font-size: 32px; font-weight: bold; color: #f8fafc; }
            .card .unit { font-size: 14px; color: #64748b; }
            .success { color: #22c55e; }
            .warning { color: #eab308; }
            .error { color: #ef4444; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
            th { color: #94a3b8; }
            </style>
          <meta http-equiv="refresh" content="5">
          </head>
          <body>
          <h1>Vafast 监控仪表盘</h1>
          
          <div class="grid">
            <div class="card">
              <h3>总请求数</h3>
              <div class="value">${status.totalRequests.toLocaleString()}</div>
            </div>
            <div class="card">
              <h3>当前 RPS</h3>
              <div class="value">${status.rps} <span class="unit">req/s</span></div>
            </div>
            <div class="card">
              <h3>错误率</h3>
              <div class="value ${status.errorRate > 0.05 ? 'error' : status.errorRate > 0.01 ? 'warning' : 'success'}">
                ${(status.errorRate * 100).toFixed(2)}%
              </div>
            </div>
            <div class="card">
              <h3>平均响应时间</h3>
              <div class="value">${status.avgResponseTime} <span class="unit">ms</span></div>
            </div>
            <div class="card">
              <h3>P95</h3>
              <div class="value ${status.p95 > 500 ? 'warning' : ''}">${status.p95} <span class="unit">ms</span></div>
            </div>
            <div class="card">
              <h3>P99</h3>
              <div class="value ${status.p99 > 1000 ? 'error' : status.p99 > 500 ? 'warning' : ''}">${status.p99} <span class="unit">ms</span></div>
            </div>
          </div>
          
          <h2>时间窗口统计</h2>
          <table>
            <tr>
              <th>时间窗口</th>
              <th>请求数</th>
              <th>成功</th>
              <th>失败</th>
              <th>错误率</th>
              <th>平均时间</th>
              <th>RPS</th>
            </tr>
            <tr>
              <td>最近 1 分钟</td>
              <td>${status.timeWindows.last1min.requests}</td>
              <td class="success">${status.timeWindows.last1min.successful}</td>
              <td class="error">${status.timeWindows.last1min.failed}</td>
              <td>${(status.timeWindows.last1min.errorRate * 100).toFixed(2)}%</td>
              <td>${status.timeWindows.last1min.avgTime}ms</td>
              <td>${status.timeWindows.last1min.rps}</td>
            </tr>
            <tr>
              <td>最近 5 分钟</td>
              <td>${status.timeWindows.last5min.requests}</td>
              <td class="success">${status.timeWindows.last5min.successful}</td>
              <td class="error">${status.timeWindows.last5min.failed}</td>
              <td>${(status.timeWindows.last5min.errorRate * 100).toFixed(2)}%</td>
              <td>${status.timeWindows.last5min.avgTime}ms</td>
              <td>${status.timeWindows.last5min.rps}</td>
            </tr>
            <tr>
              <td>最近 1 小时</td>
              <td>${status.timeWindows.last1hour.requests}</td>
              <td class="success">${status.timeWindows.last1hour.successful}</td>
              <td class="error">${status.timeWindows.last1hour.failed}</td>
              <td>${(status.timeWindows.last1hour.errorRate * 100).toFixed(2)}%</td>
              <td>${status.timeWindows.last1hour.avgTime}ms</td>
              <td>${status.timeWindows.last1hour.rps}</td>
            </tr>
          </table>
          
          <h2>状态码分布</h2>
          <div class="grid">
            <div class="card">
              <h3>2xx 成功</h3>
              <div class="value success">${status.statusCodes['2xx']}</div>
            </div>
            <div class="card">
              <h3>3xx 重定向</h3>
              <div class="value">${status.statusCodes['3xx']}</div>
            </div>
            <div class="card">
              <h3>4xx 客户端错误</h3>
              <div class="value warning">${status.statusCodes['4xx']}</div>
            </div>
            <div class="card">
              <h3>5xx 服务器错误</h3>
              <div class="value error">${status.statusCodes['5xx']}</div>
            </div>
          </div>
          
          <h2>路径统计 (Top 10)</h2>
          <table>
            <tr>
              <th>路径</th>
              <th>请求数</th>
              <th>平均时间</th>
              <th>最小</th>
              <th>最大</th>
              <th>错误数</th>
            </tr>
            ${Object.entries(status.byPath)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 10)
              .map(([path, stats]) => `
                <tr>
                  <td>${path}</td>
                  <td>${stats.count}</td>
                  <td>${stats.avgTime.toFixed(2)}ms</td>
                  <td>${stats.minTime.toFixed(2)}ms</td>
                  <td>${stats.maxTime.toFixed(2)}ms</td>
                  <td class="${stats.errorCount > 0 ? 'error' : ''}">${stats.errorCount}</td>
                </tr>
              `).join('')}
          </table>
          
          <h2>内存使用</h2>
          <div class="grid">
            <div class="card">
              <h3>堆内存使用</h3>
              <div class="value">${status.memoryUsage.heapUsed}</div>
            </div>
            <div class="card">
              <h3>堆内存总计</h3>
              <div class="value">${status.memoryUsage.heapTotal}</div>
            </div>
            <div class="card">
              <h3>运行时间</h3>
              <div class="value">${Math.floor(status.uptime / 1000 / 60)} <span class="unit">分钟</span></div>
            </div>
          </div>
          
          <p style="color: #64748b; margin-top: 20px;">页面每 5 秒自动刷新</p>
          </body>
        </html>
      `)
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/api/metrics',
    handler: () => monitoredServer.getMonitoringStatus()
  })
])

const server = new Server(routes)
monitoredServer = withMonitoring(server, {
  excludePaths: ['/dashboard', '/api/metrics']
})

serve({ fetch: monitoredServer.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
  console.log('Dashboard: http://localhost:3000/dashboard')
})
```

## API 参考

### MonitoringConfig

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用监控 |
| `console` | `boolean` | `true` | 是否输出到控制台 |
| `slowThreshold` | `number` | `1000` | 慢请求阈值（毫秒） |
| `maxRecords` | `number` | `1000` | 最大记录数 |
| `samplingRate` | `number` | `1` | 采样率 0-1 |
| `excludePaths` | `string[]` | `[]` | 排除的路径 |
| `tags` | `Record<string, string>` | `{}` | 自定义标签 |
| `onRequest` | `(metrics) => void` | - | 请求完成回调 |
| `onSlowRequest` | `(metrics) => void` | - | 慢请求回调 |

### MonitoredServer 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getMonitoringStatus()` | `MonitoringStatus` | 完整监控状态 |
| `getMonitoringMetrics()` | `MonitoringMetrics[]` | 原始指标数据 |
| `getPathStats(path)` | `PathStats \| undefined` | 单路径统计 |
| `getTimeWindowStats(ms)` | `TimeWindowStats` | 自定义时间窗口统计 |
| `getRPS()` | `number` | 当前每秒请求数 |
| `getStatusCodeDistribution()` | `StatusCodeDistribution` | 状态码分布 |
| `resetMonitoring()` | `void` | 重置所有监控数据 |

### MonitoringStatus 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | `boolean` | 监控是否启用 |
| `uptime` | `number` | 服务运行时间（毫秒） |
| `totalRequests` | `number` | 总请求数 |
| `successfulRequests` | `number` | 成功请求数 |
| `failedRequests` | `number` | 失败请求数 |
| `errorRate` | `number` | 错误率 |
| `avgResponseTime` | `number` | 平均响应时间 |
| `p50` | `number` | P50 响应时间 |
| `p95` | `number` | P95 响应时间 |
| `p99` | `number` | P99 响应时间 |
| `minTime` | `number` | 最小响应时间 |
| `maxTime` | `number` | 最大响应时间 |
| `rps` | `number` | 当前 RPS |
| `statusCodes` | `StatusCodeDistribution` | 状态码分布 |
| `timeWindows` | `{ last1min, last5min, last1hour }` | 时间窗口统计 |
| `byPath` | `Record<string, PathStats>` | 按路径统计 |
| `memoryUsage` | `{ heapUsed, heapTotal }` | 内存使用 |
| `recentRequests` | `MonitoringMetrics[]` | 最近请求 |

## 总结

Vafast 内置监控提供：

- ✅ **零外部依赖** - 无需 Prometheus、OpenTelemetry
- ✅ **开箱即用** - 一行代码启用
- ✅ **百分位数统计** - P50/P95/P99
- ✅ **时间窗口统计** - 1分钟/5分钟/1小时
- ✅ **RPS 计算** - 实时每秒请求数
- ✅ **状态码分布** - 2xx/3xx/4xx/5xx
- ✅ **按路径统计** - 识别热点和慢端点
- ✅ **内存友好** - 环形缓冲区限制内存
- ✅ **采样率控制** - 高流量场景优化
- ✅ **自定义回调** - 集成外部监控系统

### 下一步

- 查看 [部署指南](/patterns/deploy) 了解生产环境配置
- 学习 [中间件系统](/middleware) 了解如何扩展功能
- 探索 [OpenTelemetry 集成](/integrations/opentelemetry) 了解分布式追踪
