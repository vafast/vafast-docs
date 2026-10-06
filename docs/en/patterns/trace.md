---
title: Performance Monitoring - Vafast
description: 'Vafast built-in performance monitoring: zero-dependency request metrics, P50/P95/P99 latency, RPS, status code distribution and a metrics endpoint.'
---

# Performance Monitoring

Vafast provides a built-in monitoring system with **zero external dependencies** to help you track request performance and identify bottlenecks.

## Quick Start

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

// add monitoring
const monitored = withMonitoring(server)

serve({ fetch: monitored.fetch, port: 3000 })
```

After startup, the console shows:

```
✅ Monitoring enabled
Config: { slowThreshold: '1000ms', maxRecords: 1000, samplingRate: 1, excludePaths: [] }
```

Every request is logged:

```
✅ GET / - 200 (0.52ms)
✅ GET /users - 200 (12.34ms)
❌ GET /not-found - 404 (0.31ms)
⚠️ POST /slow - 200 (🐌 1523.45ms)  // slow requests over the threshold are flagged
```

## Configuration Options

```typescript
const monitored = withMonitoring(server, {
  // whether monitoring is enabled, default true
  enabled: true,
  
  // whether to print to the console, default true
  console: true,
  
  // slow request threshold (ms); requests over it show 🐌, default 1000
  slowThreshold: 500,
  
  // max records (ring buffer), default 1000
  maxRecords: 5000,
  
  // sampling rate 0-1, default 1 (record everything)
  // in high-traffic scenarios, set 0.1 to record only 10%
  samplingRate: 1,
  
  // excluded paths (not recorded)
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  
  // custom tags
  tags: { service: 'api', env: 'production' },
  
  // request completed callback
  onRequest: (metrics) => {
    // send to an external monitoring system
    sendToPrometheus(metrics)
  },
  
  // slow request callback
  onSlowRequest: (metrics) => {
    console.warn(`⚠️ Slow request: ${metrics.path} (${metrics.totalTime}ms)`)
    alertSlack(`Slow request warning: ${metrics.path}`)
  }
})
```

## Getting Monitoring Status

### Full Status

```typescript
const status = monitored.getMonitoringStatus()

console.log(status)
// {
//   enabled: true,
//   uptime: 3600000,              // server uptime (ms)
//   totalRequests: 15000,
//   successfulRequests: 14500,
//   failedRequests: 500,
//   errorRate: 0.0333,
//   avgResponseTime: 12.45,       // average response time
//   p50: 8.2,                     // 50% of requests complete within this time
//   p95: 45.6,                    // 95% of requests complete within this time
//   p99: 120.3,                   // 99% of requests complete within this time
//   minTime: 0.5,
//   maxTime: 2500.8,
//   rps: 15.2,                    // current requests per second
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
//   recentRequests: [ ... ]       // the 5 most recent requests
// }
```

### Time Window Stats

```typescript
// preset time windows
const { last1min, last5min, last1hour } = status.timeWindows

console.log(`Last 1 minute: ${last1min.requests} requests, error rate ${(last1min.errorRate * 100).toFixed(1)}%`)
console.log(`Last 5 minutes: ${last5min.requests} requests, avg ${last5min.avgTime}ms`)
console.log(`Last 1 hour: ${last1hour.requests} requests, RPS ${last1hour.rps}`)

// custom time windows
const last30sec = monitored.getTimeWindowStats(30000)  // last 30 seconds
const last10min = monitored.getTimeWindowStats(600000) // last 10 minutes

console.log(`Last 30 seconds: ${last30sec.requests} requests`)
```

### RPS (Requests per Second)

```typescript
// current RPS (based on the last 10 seconds)
const rps = monitored.getRPS()
console.log(`Current RPS: ${rps}`)

// also available from the status
console.log(`Current RPS: ${status.rps}`)
```

### Status Code Distribution

```typescript
const dist = monitored.getStatusCodeDistribution()

console.log(`Success (2xx): ${dist['2xx']}`)
console.log(`Redirect (3xx): ${dist['3xx']}`)
console.log(`Client error (4xx): ${dist['4xx']}`)
console.log(`Server error (5xx): ${dist['5xx']}`)

// detailed distribution
console.log(`200 OK: ${dist.detail[200]}`)
console.log(`201 Created: ${dist.detail[201]}`)
console.log(`404 Not Found: ${dist.detail[404]}`)
console.log(`500 Internal Error: ${dist.detail[500]}`)
```

### Per-Path Stats

```typescript
// get stats for a single path
const userStats = monitored.getPathStats('/users')

if (userStats) {
  console.log(`/users path:`)
  console.log(`  Requests: ${userStats.count}`)
  console.log(`  Avg time: ${userStats.avgTime.toFixed(2)}ms`)
  console.log(`  Min time: ${userStats.minTime.toFixed(2)}ms`)
  console.log(`  Max time: ${userStats.maxTime.toFixed(2)}ms`)
  console.log(`  Errors: ${userStats.errorCount}`)
}

// get stats for all paths
const { byPath } = status
Object.entries(byPath).forEach(([path, stats]) => {
  console.log(`${path}: ${stats.count} requests, avg ${stats.avgTime}ms`)
})
```

### Percentiles

```typescript
const { p50, p95, p99 } = status

console.log(`P50: ${p50}ms`)  // 50% of requests complete within this time
console.log(`P95: ${p95}ms`)  // 95% of requests complete within this time  
console.log(`P99: ${p99}ms`)  // 99% of requests complete within this time

// P99 is a key service-quality metric
// if P99 > threshold, 1% of requests are having a poor experience
```

## Exposing a Monitoring Endpoint

```typescript
import { Server, defineRoute, defineRoutes, serve, err } from 'vafast'
import { withMonitoring, type MonitoredServer } from 'vafast/monitoring'

// create the monitoring endpoint routes
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
          throw err.notFound('Path not found')
        }
        return stats
      }
    }),
    defineRoute({
      method: 'POST',
      path: '/metrics/reset',
      handler: () => {
        getServer().resetMonitoring()
        return { message: 'Monitoring data reset' }
      }
    })
  ])
}

// main app routes
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

// get the monitoredServer reference lazily
let monitoredServer: MonitoredServer

const allRoutes = [
  ...appRoutes,
  ...createMetricsRoutes(() => monitoredServer)
]

const server = new Server(allRoutes)
monitoredServer = withMonitoring(server, {
  excludePaths: ['/metrics', '/health']  // exclude the monitoring endpoints themselves
})

serve({ fetch: monitoredServer.fetch, port: 3000 })
```

Endpoints:

- `GET /metrics` - full monitoring status
- `GET /metrics/rps` - current RPS
- `GET /metrics/status-codes` - status code distribution
- `GET /metrics/path/users` - stats for the `/users` path
- `POST /metrics/reset` - reset monitoring data

## Advanced Usage

### Sampling Rate

In high-traffic scenarios, recording every request may affect performance. Use a sampling rate:

```typescript
const monitored = withMonitoring(server, {
  // record only 10% of requests
  samplingRate: 0.1
})
```

### Slow Request Alerts

```typescript
const monitored = withMonitoring(server, {
  slowThreshold: 500,  // over 500ms counts as slow
  
  onSlowRequest: async (metrics) => {
    // log it
    console.error(`[SLOW] ${metrics.method} ${metrics.path} - ${metrics.totalTime.toFixed(2)}ms`)
    
    // send an alert
    await fetch('https://hooks.slack.com/services/xxx', {
      method: 'POST',
      body: JSON.stringify({
        text: `⚠️ Slow request alert: ${metrics.path} (${metrics.totalTime.toFixed(0)}ms)`
      })
    })
  }
})
```

### Sending to External Monitoring

```typescript
const monitored = withMonitoring(server, {
  onRequest: (metrics) => {
    // send to the Prometheus Pushgateway
    fetch('http://prometheus:9091/metrics/job/vafast', {
      method: 'POST',
      body: `http_request_duration_ms{method="${metrics.method}",path="${metrics.path}",status="${metrics.statusCode}"} ${metrics.totalTime}`
    })
    
    // or send to InfluxDB
    fetch('http://influxdb:8086/write?db=metrics', {
      method: 'POST',
      body: `requests,method=${metrics.method},path=${metrics.path},status=${metrics.statusCode} duration=${metrics.totalTime}`
    })
  }
})
```

### Convenience Factory

```typescript
import { Server } from 'vafast'
import { createMonitoredServer } from 'vafast/monitoring'

// create a monitored Server in one step
const monitored = createMonitoredServer(Server, routes, {
  slowThreshold: 500,
  excludePaths: ['/health']
})

serve({ fetch: monitored.fetch, port: 3000 })
```

## Example Monitoring Dashboard

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
          <title>Vafast Monitoring Dashboard</title>
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
          <h1>Vafast Monitoring Dashboard</h1>
          
          <div class="grid">
            <div class="card">
              <h3>Total Requests</h3>
              <div class="value">${status.totalRequests.toLocaleString()}</div>
            </div>
            <div class="card">
              <h3>Current RPS</h3>
              <div class="value">${status.rps} <span class="unit">req/s</span></div>
            </div>
            <div class="card">
              <h3>Error Rate</h3>
              <div class="value ${status.errorRate > 0.05 ? 'error' : status.errorRate > 0.01 ? 'warning' : 'success'}">
                ${(status.errorRate * 100).toFixed(2)}%
              </div>
            </div>
            <div class="card">
              <h3>Avg Response Time</h3>
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
          
          <h2>Time Window Stats</h2>
          <table>
            <tr>
              <th>Window</th>
              <th>Requests</th>
              <th>Success</th>
              <th>Failed</th>
              <th>Error Rate</th>
              <th>Avg Time</th>
              <th>RPS</th>
            </tr>
            <tr>
              <td>Last 1 minute</td>
              <td>${status.timeWindows.last1min.requests}</td>
              <td class="success">${status.timeWindows.last1min.successful}</td>
              <td class="error">${status.timeWindows.last1min.failed}</td>
              <td>${(status.timeWindows.last1min.errorRate * 100).toFixed(2)}%</td>
              <td>${status.timeWindows.last1min.avgTime}ms</td>
              <td>${status.timeWindows.last1min.rps}</td>
            </tr>
            <tr>
              <td>Last 5 minutes</td>
              <td>${status.timeWindows.last5min.requests}</td>
              <td class="success">${status.timeWindows.last5min.successful}</td>
              <td class="error">${status.timeWindows.last5min.failed}</td>
              <td>${(status.timeWindows.last5min.errorRate * 100).toFixed(2)}%</td>
              <td>${status.timeWindows.last5min.avgTime}ms</td>
              <td>${status.timeWindows.last5min.rps}</td>
            </tr>
            <tr>
              <td>Last 1 hour</td>
              <td>${status.timeWindows.last1hour.requests}</td>
              <td class="success">${status.timeWindows.last1hour.successful}</td>
              <td class="error">${status.timeWindows.last1hour.failed}</td>
              <td>${(status.timeWindows.last1hour.errorRate * 100).toFixed(2)}%</td>
              <td>${status.timeWindows.last1hour.avgTime}ms</td>
              <td>${status.timeWindows.last1hour.rps}</td>
            </tr>
          </table>
          
          <h2>Status Code Distribution</h2>
          <div class="grid">
            <div class="card">
              <h3>2xx Success</h3>
              <div class="value success">${status.statusCodes['2xx']}</div>
            </div>
            <div class="card">
              <h3>3xx Redirect</h3>
              <div class="value">${status.statusCodes['3xx']}</div>
            </div>
            <div class="card">
              <h3>4xx Client Error</h3>
              <div class="value warning">${status.statusCodes['4xx']}</div>
            </div>
            <div class="card">
              <h3>5xx Server Error</h3>
              <div class="value error">${status.statusCodes['5xx']}</div>
            </div>
          </div>
          
          <h2>Path Stats (Top 10)</h2>
          <table>
            <tr>
              <th>Path</th>
              <th>Requests</th>
              <th>Avg Time</th>
              <th>Min</th>
              <th>Max</th>
              <th>Errors</th>
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
          
          <h2>Memory Usage</h2>
          <div class="grid">
            <div class="card">
              <h3>Heap Used</h3>
              <div class="value">${status.memoryUsage.heapUsed}</div>
            </div>
            <div class="card">
              <h3>Heap Total</h3>
              <div class="value">${status.memoryUsage.heapTotal}</div>
            </div>
            <div class="card">
              <h3>Uptime</h3>
              <div class="value">${Math.floor(status.uptime / 1000 / 60)} <span class="unit">min</span></div>
            </div>
          </div>
          
          <p style="color: #64748b; margin-top: 20px;">The page refreshes every 5 seconds</p>
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

## API Reference

### MonitoringConfig

| Property | Type | Default | Description |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | Whether monitoring is enabled |
| `console` | `boolean` | `true` | Whether to print to the console |
| `slowThreshold` | `number` | `1000` | Slow request threshold (ms) |
| `maxRecords` | `number` | `1000` | Max records |
| `samplingRate` | `number` | `1` | Sampling rate 0-1 |
| `excludePaths` | `string[]` | `[]` | Excluded paths |
| `tags` | `Record<string, string>` | `{}` | Custom tags |
| `onRequest` | `(metrics) => void` | - | Request completed callback |
| `onSlowRequest` | `(metrics) => void` | - | Slow request callback |

### MonitoredServer Methods

| Method | Returns | Description |
|------|--------|------|
| `getMonitoringStatus()` | `MonitoringStatus` | Full monitoring status |
| `getMonitoringMetrics()` | `MonitoringMetrics[]` | Raw metrics data |
| `getPathStats(path)` | `PathStats \| undefined` | Stats for a single path |
| `getTimeWindowStats(ms)` | `TimeWindowStats` | Custom time window stats |
| `getRPS()` | `number` | Current requests per second |
| `getStatusCodeDistribution()` | `StatusCodeDistribution` | Status code distribution |
| `resetMonitoring()` | `void` | Reset all monitoring data |

### MonitoringStatus Fields

| Field | Type | Description |
|------|------|------|
| `enabled` | `boolean` | Whether monitoring is enabled |
| `uptime` | `number` | Server uptime (ms) |
| `totalRequests` | `number` | Total requests |
| `successfulRequests` | `number` | Successful requests |
| `failedRequests` | `number` | Failed requests |
| `errorRate` | `number` | Error rate |
| `avgResponseTime` | `number` | Average response time |
| `p50` | `number` | P50 response time |
| `p95` | `number` | P95 response time |
| `p99` | `number` | P99 response time |
| `minTime` | `number` | Minimum response time |
| `maxTime` | `number` | Maximum response time |
| `rps` | `number` | Current RPS |
| `statusCodes` | `StatusCodeDistribution` | Status code distribution |
| `timeWindows` | `{ last1min, last5min, last1hour }` | Time window stats |
| `byPath` | `Record<string, PathStats>` | Per-path stats |
| `memoryUsage` | `{ heapUsed, heapTotal }` | Memory usage |
| `recentRequests` | `MonitoringMetrics[]` | Recent requests |

## Summary

Vafast's built-in monitoring provides:

- ✅ **Zero external dependencies** - no Prometheus or OpenTelemetry required
- ✅ **Works out of the box** - enable it with one line of code
- ✅ **Percentile stats** - P50/P95/P99
- ✅ **Time window stats** - 1 minute / 5 minutes / 1 hour
- ✅ **RPS calculation** - real-time requests per second
- ✅ **Status code distribution** - 2xx/3xx/4xx/5xx
- ✅ **Per-path stats** - spot hot and slow endpoints
- ✅ **Memory friendly** - a ring buffer caps memory usage
- ✅ **Sampling rate control** - optimized for high traffic
- ✅ **Custom callbacks** - integrate with external monitoring systems

### Next Steps

- See the [Deployment Guide](/en/patterns/deploy) for production configuration
- Learn the [Middleware System](/en/middleware) to extend functionality
- Explore the [OpenTelemetry integration](/en/integrations/opentelemetry) for distributed tracing
