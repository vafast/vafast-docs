---
title: Trace - Vafast
---

# Trace

性能是 Vafast 一个重要的方面。

我们不仅希望在基准测试中快速运行，我们希望您在真实场景中拥有一个真正快速的服务器。

有许多因素可能会减慢我们的应用程序 - 并且很难识别它们，但 **trace** 可以通过在每个请求处理阶段中注入开始和停止代码来帮助解决这个问题。

Vafast 提供了内置的监控系统，允许我们跟踪请求处理时间、中间件执行时间和其他性能指标。

## 内置监控

Vafast 提供了 `withMonitoring` 函数来为服务器添加监控能力：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { withMonitoring } from 'vafast/monitoring'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  },
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(async ({ body }) => {
      // 模拟一些异步操作
      await new Promise(resolve => setTimeout(resolve, 100))
      return { success: true, user: body }
    })
  }
])

const server = new Server(routes)

// 添加监控功能
const monitoredServer = withMonitoring(server, {
  enableMetrics: true,
  enableLogging: true
})

export default { fetch: monitoredServer.fetch }
```

## 自定义性能追踪

您可以使用中间件来实现自定义的性能追踪：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 性能追踪中间件
const performanceTraceMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const startTime = performance.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`[${requestId}] 开始处理请求: ${req.method} ${req.url}`)
  
  try {
    const response = await next()
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`[${requestId}] 请求处理完成: ${response.status} (${duration.toFixed(2)}ms)`)
    
    // 添加性能头
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)
    
    return response
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.error(`[${requestId}] 请求处理失败: ${error} (${duration.toFixed(2)}ms)`)
    throw error
  }
}

// 中间件执行时间追踪
const middlewareTraceMiddleware = (middlewareName: string) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const startTime = performance.now()
    
    try {
      const response = await next()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`[${middlewareName}] 执行时间: ${duration.toFixed(2)}ms`)
      
      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.error(`[${middlewareName}] 执行失败: ${error} (${duration.toFixed(2)}ms)`)
      throw error
    }
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  }
])

const server = new Server(routes)

// 应用性能追踪中间件
server.use(performanceTraceMiddleware)
server.use(middlewareTraceMiddleware('Global'))

export default { fetch: server.fetch }
```

## 详细性能分析

实现更详细的性能分析：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  middlewareTimes: Map<string, number>
  totalTime: number
  status: number
  memoryUsage?: NodeJS.MemoryUsage
}

class PerformanceTracker {
  private metrics = new Map<string, PerformanceMetrics>()
  
  startRequest(req: Request): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method,
      url: req.url,
      startTime: performance.now(),
      middlewareTimes: new Map(),
      totalTime: 0,
      status: 0
    }
    
    this.metrics.set(requestId, metrics)
    return requestId
  }
  
  recordMiddlewareTime(requestId: string, middlewareName: string, duration: number) {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.middlewareTimes.set(middlewareName, duration)
    }
  }
  
  endRequest(requestId: string, status: number, memoryUsage?: NodeJS.MemoryUsage) {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.totalTime = performance.now() - metrics.startTime
      metrics.status = status
      metrics.memoryUsage = memoryUsage
      
      this.logMetrics(metrics)
      this.metrics.delete(requestId)
    }
  }
  
  private logMetrics(metrics: PerformanceMetrics) {
    console.log(`\n=== 性能报告 [${metrics.requestId}] ===`)
    console.log(`请求: ${metrics.method} ${metrics.url}`)
    console.log(`状态: ${metrics.status}`)
    console.log(`总时间: ${metrics.totalTime.toFixed(2)}ms`)
    
    if (metrics.middlewareTimes.size > 0) {
      console.log('中间件执行时间:')
      metrics.middlewareTimes.forEach((time, name) => {
        console.log(`  ${name}: ${time.toFixed(2)}ms`)
      })
    }
    
    if (metrics.memoryUsage) {
      console.log('内存使用:')
      console.log(`  堆使用: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  堆总计: ${(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`)
    }
    
    console.log('================================\n')
  }
}

const tracker = new PerformanceTracker()

// 增强的性能追踪中间件
const enhancedTraceMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const requestId = tracker.startRequest(req)
  
  try {
    const response = await next()
    tracker.endRequest(requestId, response.status)
    return response
  } catch (error) {
    tracker.endRequest(requestId, 500)
    throw error
  }
}

// 中间件性能追踪
const createMiddlewareTracer = (name: string) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const startTime = performance.now()
    
    try {
      const response = await next()
      
      const duration = performance.now() - startTime
      const requestId = req.headers.get('X-Request-ID')
      if (requestId) {
        tracker.recordMiddlewareTime(requestId, name, duration)
      }
      
      return response
    } catch (error) {
      const duration = performance.now() - startTime
      const requestId = req.headers.get('X-Request-ID')
      if (requestId) {
        tracker.recordMiddlewareTime(requestId, name, duration)
      }
      throw error
    }
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  }
])

const server = new Server(routes)

// 应用增强的性能追踪
server.use(enhancedTraceMiddleware)
server.use(createMiddlewareTracer('Global'))

export default { fetch: server.fetch }
```

## 实时性能监控

实现实时性能监控面板：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

class RealTimeMonitor {
  private metrics: Array<{
    timestamp: number
    method: string
    path: string
    duration: number
    status: number
  }> = []
  
  private maxMetrics = 1000
  
  recordRequest(method: string, path: string, duration: number, status: number) {
    this.metrics.push({
      timestamp: Date.now(),
      method,
      path,
      duration,
      status
    })
    
    // 保持最新的指标
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }
  
  getStats() {
    const now = Date.now()
    const lastMinute = this.metrics.filter(m => now - m.timestamp < 60000)
    const lastHour = this.metrics.filter(m => now - m.timestamp < 3600000)
    
    return {
      total: this.metrics.length,
      lastMinute: lastMinute.length,
      lastHour: lastHour.length,
      averageResponseTime: this.metrics.length > 0 
        ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length 
        : 0,
      statusCodes: this.getStatusCodeDistribution(),
      topEndpoints: this.getTopEndpoints()
    }
  }
  
  private getStatusCodeDistribution() {
    const distribution: Record<number, number> = {}
    this.metrics.forEach(m => {
      distribution[m.status] = (distribution[m.status] || 0) + 1
    })
    return distribution
  }
  
  private getTopEndpoints() {
    const endpointCounts: Record<string, number> = {}
    this.metrics.forEach(m => {
      const key = `${m.method} ${m.path}`
      endpointCounts[key] = (endpointCounts[key] || 0) + 1
    })
    
    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))
  }
}

const monitor = new RealTimeMonitor()

// 监控中间件
const monitoringMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const startTime = performance.now()
  const url = new URL(req.url)
  
  try {
    const response = await next()
    
    const duration = performance.now() - startTime
    monitor.recordRequest(req.method, url.pathname, duration, response.status)
    
    return response
  } catch (error) {
    const duration = performance.now() - startTime
    monitor.recordRequest(req.method, url.pathname, duration, 500)
    throw error
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  },
  {
    method: 'GET',
    path: '/metrics',
    handler: createRouteHandler(() => {
      const stats = monitor.getStats()
      return new Response(JSON.stringify(stats, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      })
    })
  },
  {
    method: 'GET',
    path: '/monitor',
    handler: createRouteHandler(() => {
      const stats = monitor.getStats()
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Vafast 性能监控</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
              .status-2xx { color: green; }
              .status-4xx { color: orange; }
              .status-5xx { color: red; }
            </style>
          </head>
          <body>
            <h1>Vafast 性能监控</h1>
            <div class="metric">
              <h3>总请求数: ${stats.total}</h3>
              <p>最近1分钟: ${stats.lastMinute}</p>
              <p>最近1小时: ${stats.lastHour}</p>
            </div>
            <div class="metric">
              <h3>平均响应时间: ${stats.averageResponseTime.toFixed(2)}ms</h3>
            </div>
            <div class="metric">
              <h3>状态码分布:</h3>
              ${Object.entries(stats.statusCodes).map(([code, count]) => 
                `<p class="status-${code.startsWith('2') ? '2xx' : code.startsWith('4') ? '4xx' : '5xx'}">
                  ${code}: ${count}
                </p>`
              ).join('')}
            </div>
            <div class="metric">
              <h3>热门端点:</h3>
              ${stats.topEndpoints.map(({ endpoint, count }) => 
                `<p>${endpoint}: ${count}</p>`
              ).join('')}
            </div>
            <script>
              setInterval(() => location.reload(), 5000);
            </script>
          </body>
        </html>
      `
    })
  }
])

const server = new Server(routes)
server.use(monitoringMiddleware)

export default { fetch: server.fetch }
```

## 性能基准测试

实现性能基准测试：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

class PerformanceBenchmark {
  private results: Array<{
    name: string
    duration: number
    timestamp: number
  }> = []
  
  async runBenchmark(name: string, testFn: () => Promise<any>) {
    const startTime = performance.now()
    
    try {
      await testFn()
      const duration = performance.now() - startTime
      
      this.results.push({ name, duration, timestamp: Date.now() })
      
      console.log(`[${name}] 基准测试完成: ${duration.toFixed(2)}ms`)
      return duration
    } catch (error) {
      console.error(`[${name}] 基准测试失败:`, error)
      throw error
    }
  }
  
  getResults() {
    return this.results
  }
  
  getAverageTime(name: string) {
    const relevantResults = this.results.filter(r => r.name === name)
    if (relevantResults.length === 0) return 0
    
    return relevantResults.reduce((sum, r) => sum + r.duration, 0) / relevantResults.length
  }
  
  generateReport() {
    const uniqueNames = [...new Set(this.results.map(r => r.name))]
    
    console.log('\n=== 性能基准测试报告 ===')
    uniqueNames.forEach(name => {
      const avgTime = this.getAverageTime(name)
      const count = this.results.filter(r => r.name === name).length
      console.log(`${name}: 平均 ${avgTime.toFixed(2)}ms (${count} 次测试)`)
    })
    console.log('==========================\n')
  }
}

const benchmark = new PerformanceBenchmark()

// 基准测试路由
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  },
  {
    method: 'POST',
    path: '/benchmark',
    handler: createRouteHandler(async ({ body }) => {
      const { testName, iterations = 1000 } = body
      
      const testFn = async () => {
        for (let i = 0; i < iterations; i++) {
          // 模拟一些计算
          Math.sqrt(i) * Math.PI
        }
      }
      
      const duration = await benchmark.runBenchmark(testName, testFn)
      
      return {
        testName,
        iterations,
        duration: duration.toFixed(2),
        averageTime: benchmark.getAverageTime(testName).toFixed(2)
      }
    })
  },
  {
    method: 'GET',
    path: '/benchmark/results',
    handler: createRouteHandler(() => {
      return new Response(JSON.stringify(benchmark.getResults(), null, 2), {
        headers: { 'Content-Type': 'application/json' }
      })
    })
  }
])

const server = new Server(routes)

// 运行基准测试
setTimeout(() => {
  benchmark.generateReport()
}, 5000)

export default { fetch: server.fetch }
```

## 总结

Vafast 的性能追踪系统提供了：

- ✅ 内置监控支持
- ✅ 自定义性能追踪中间件
- ✅ 详细的性能分析
- ✅ 实时性能监控
- ✅ 性能基准测试
- ✅ 内存使用监控
- ✅ 中间件执行时间追踪

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强功能
- 探索 [验证系统](/essential/validation) 了解类型安全
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
