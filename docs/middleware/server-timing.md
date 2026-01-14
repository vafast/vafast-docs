---
title: Server Timing 中间件 - Vafast
---

# Server Timing 中间件

该中间件为 [Vafast](https://github.com/vafastjs/vafast) 提供了服务器计时功能，通过添加 `Server-Timing` 响应头部来帮助开发者监控和优化应用性能。

## 安装

安装命令：
```bash
npm install @vafast/server-timing
```

## 基本用法

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: async () => {
      // 模拟一些异步操作
      await new Promise(resolve => setTimeout(resolve, 100))
      return 'Server Timing Example'
    }
  })
])

const server = new Server(routes)

// 应用 Server-Timing 中间件
server.useGlobalMiddleware(serverTiming())

// 导出 fetch 函数
export default { fetch: server.fetch }
```

## 配置选项

### ServerTimingOptions

```typescript
interface ServerTimingOptions {
  /** 是否启用 Server-Timing 中间件，默认：NODE_ENV !== 'production' */
  enabled?: boolean
  
  /** 允许/拒绝写入响应头
   * - boolean: 是否允许
   * - function: 基于上下文动态判断
   */
  allow?: boolean | Promise<boolean> | ((context: any) => boolean | Promise<boolean>)
  
  /** 追踪开关 */
  trace?: {
    /** 是否追踪处理时间，默认：true */
    handle?: boolean
    
    /** 是否追踪总时间，默认：true */
    total?: boolean
  }
}
```

### 默认配置

```typescript
const defaultOptions = {
  enabled: process.env.NODE_ENV !== 'production',  // 生产环境默认禁用
  allow: true,                                     // 默认允许添加头部
  trace: {
    handle: true,                                  // 默认追踪处理时间
    total: true                                    // 默认追踪总时间
  }
}
```

## 使用模式

### 1. 基本性能监控

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    handler: async () => {
      // 模拟数据库查询
      await new Promise(resolve => setTimeout(resolve, 50))
      
      return { users: ['Alice', 'Bob', 'Charlie'] }
    }
  })
])

const server = new Server(routes)
server.useGlobalMiddleware(serverTiming({
  enabled: true,
  trace: { handle: true, total: true }
}))

export default { fetch: server.fetch }
```

### 2. 条件启用

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/data',
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return { data: 'Performance monitored data' }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/static/info',
    handler: () => {
      // 这个端点不会被监控
      return { info: 'Static information' }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return timing(req, () => server.fetch(req))
  }
}
```

### 3. 自定义追踪配置

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/api/process',
    handler: async ({ req }) => {
      const body = await req.json()
      
      // 模拟复杂处理
      await new Promise(resolve => setTimeout(resolve, 200))
      
      return { 
        message: 'Data processed successfully',
        result: body
      }
    }
  })
])

const server = new Server(routes)

// 只追踪总时间，不追踪处理时间
server.useGlobalMiddleware(serverTiming({
  enabled: true,
  trace: { handle: false, total: true }
}))

export default { fetch: server.fetch }
```

### 4. 动态控制

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/admin/users',
    handler: () => {
      return { users: ['Admin1', 'Admin2'] }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/api/public/info',
    handler: () => {
      return { info: 'Public information' }
    }
  })
])

const server = new Server(routes)

// 应用 Server Timing 中间件
server.useGlobalMiddleware(serverTiming({
  enabled: true,
  allow: async (ctx) => {
    const url = new URL(ctx.request.url)
    
    // 只对管理员启用
    const isAdmin = ctx.request.headers.get('x-admin-key') === 'secret'
    if (isAdmin) return true
    
    // 只对特定路径启用
    if (url.pathname.startsWith('/api/admin/')) return false
    
    // 根据查询参数控制
    const enableTiming = url.searchParams.get('timing') === 'true'
    return enableTiming
  },
  trace: { handle: true, total: true }
}))

export default { fetch: server.fetch }
```

### 5. 生产环境配置

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/health',
    handler: () => {
      return { status: 'healthy', timestamp: new Date().toISOString() }
    }
  })
])

const server = new Server(routes)

// 应用 Server Timing 中间件
server.useGlobalMiddleware(serverTiming({
  enabled: process.env.NODE_ENV !== 'production',
  allow: process.env.ENABLE_TIMING === 'true',
  trace: { handle: true, total: true }
}))

export default { fetch: server.fetch }
```

## 完整示例

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

// 模拟数据库操作
class DatabaseService {
  async query(sql: string, delay: number = 50) {
    await new Promise(resolve => setTimeout(resolve, delay))
    return { sql, result: 'data', timestamp: new Date().toISOString() }
  }
  
  async insert(data: any, delay: number = 100) {
    await new Promise(resolve => setTimeout(resolve, delay))
    return { id: Math.random().toString(36).substr(2, 9), ...data }
  }
}

// 模拟缓存服务
class CacheService {
  async get(key: string, delay: number = 10) {
    await new Promise(resolve => setTimeout(resolve, delay))
    return { key, value: 'cached_value', hit: true }
  }
  
  async set(key: string, value: any, delay: number = 20) {
    await new Promise(resolve => setTimeout(resolve, delay))
    return { key, value, success: true }
  }
}

// 创建服务实例
const db = new DatabaseService()
const cache = new CacheService()

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return {
        message: 'Vafast Server Timing API',
        version: '1.0.0',
        endpoints: [
          'GET /api/users - 获取用户列表（开发环境监控）',
          'GET /api/users/:id - 获取单个用户（开发环境监控）',
          'POST /api/users - 创建用户（开发环境监控）',
          'GET /api/admin/stats - 管理员统计（管理员监控）',
          'GET /api/health - 健康检查（无监控）'
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/users',
    handler: async () => {
      // 模拟数据库查询
      const users = await db.query('SELECT * FROM users', 80)
      
      return {
        message: 'Users retrieved successfully',
        count: 3,
        users: ['Alice', 'Bob', 'Charlie'],
        query: users
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/api/users/:id',
    handler: async ({ params }) => {
      const userId = params.id
      
      // 先尝试从缓存获取
      const cachedUser = await cache.get(`user:${userId}`)
      
      if (cachedUser.hit) {
        return {
          message: 'User retrieved from cache',
          user: { id: userId, name: 'Cached User' },
          source: 'cache'
        }
      }
      
      // 缓存未命中，从数据库获取
      const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`, 60)
      
      // 更新缓存
      await cache.set(`user:${userId}`, user)
      
      return {
        message: 'User retrieved from database',
        user: { id: userId, name: 'Database User' },
        source: 'database',
        query: user
      }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/api/users',
    handler: async ({ req }) => {
      const body = await req.json()
      
      // 模拟用户创建
      const newUser = await db.insert(body, 120)
      
      return {
        message: 'User created successfully',
        user: newUser,
        timestamp: new Date().toISOString()
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/api/admin/stats',
    handler: async () => {
      // 模拟管理员统计查询
      const userStats = await db.query('SELECT COUNT(*) as count FROM users', 150)
      const cacheStats = await cache.get('cache:stats', 30)
      
      return {
        message: 'Admin statistics retrieved',
        stats: {
          totalUsers: userStats.result,
          cacheHitRate: '85%',
          systemLoad: 'medium',
          lastUpdated: new Date().toISOString()
        }
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/api/health',
    handler: () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      }
    }
  })
])

// 创建服务器
const server = new Server(routes)

// 根据环境应用不同的 Server Timing 中间件
if (process.env.NODE_ENV === 'development') {
  server.useGlobalMiddleware(serverTiming({
    enabled: true,
    allow: true,
    trace: { handle: true, total: true }
  }))
} else if (process.env.NODE_ENV === 'production') {
  // 生产环境：只对管理员端点启用
  // 这里可以通过路由级中间件实现
}

// 导出 fetch 函数
export default { fetch: server.fetch }

console.log('Vafast Server Timing API 服务器启动成功！')
console.log('开发环境：所有 API 端点都将被监控')
console.log('生产环境：Server Timing 默认禁用')
console.log('👑 管理员端点：需要正确的 x-admin-key 头部')
console.log('健康检查：无性能监控')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

describe('Vafast Server Timing Plugin', () => {
  it('should create server timing middleware', () => {
    const timingMiddleware = serverTiming({
      enabled: true,
      trace: { handle: true, total: true }
    })

    expect(timingMiddleware).toBeDefined()
    expect(typeof timingMiddleware).toBe('function')
  })

  it('should add Server-Timing header when enabled', async () => {
    const app = new Server(defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/',
        handler: () => {
          return 'Hello, Server Timing!'
        }
      })
    ]))

    // 应用中间件
    app.useGlobalMiddleware(serverTiming({
      enabled: true,
      trace: { handle: true, total: true }
    }))

    const res = await app.fetch(new Request('http://localhost/'))
    const data = await res.text()

    expect(data).toBe('Hello, Server Timing!')
    expect(res.status).toBe(200)

    // 检查 Server-Timing 头部
    const timingHeader = res.headers.get('Server-Timing')
    expect(timingHeader).toBeDefined()
    expect(timingHeader).toContain('handle;dur=')
    expect(timingHeader).toContain('total;dur=')
  })

  it('should not add Server-Timing header when disabled', async () => {
    const app = new Server(defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/',
        handler: () => {
          return 'Hello, No Timing!'
        }
      })
    ]))

    // 应用中间件（禁用状态）
    app.useGlobalMiddleware(serverTiming({
      enabled: false,
      trace: { handle: true, total: true }
    }))

    const res = await app.fetch(new Request('http://localhost/'))
    const data = await res.text()

    expect(data).toBe('Hello, No Timing!')
    expect(res.status).toBe(200)

    // 检查 Server-Timing 头部不应该存在
    const timingHeader = res.headers.get('Server-Timing')
    expect(timingHeader).toBeNull()
  })

  it('should respect allow function for adding headers', async () => {
    const app = new Server(defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/allow',
        handler: () => {
          return 'Allowed with timing'
        }
      }),
      defineRoute({
        method: 'GET',
        path: '/deny',
        handler: () => {
          return 'Denied without timing'
        }
      })
    ]))

    // 应用中间件
    app.useGlobalMiddleware(serverTiming({
      enabled: true,
      allow: (ctx) => ctx.request.url.includes('/allow'),
      trace: { handle: true, total: true }
    }))

    // 允许的路径应该有 Server-Timing 头部
    const allowedRes = await app.fetch(new Request('http://localhost/allow'))
    expect(allowedRes.headers.get('Server-Timing')).toBeDefined()

    // 拒绝的路径不应该有 Server-Timing 头部
    const deniedRes = await app.fetch(new Request('http://localhost/deny'))
    expect(deniedRes.headers.get('Server-Timing')).toBeNull()
  })

  it('should handle custom trace configuration', async () => {
    const app = new Server(defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/',
        handler: () => {
          return 'Custom trace config'
        }
      })
    ]))

    // 应用中间件
    app.useGlobalMiddleware(serverTiming({
      enabled: true,
      trace: { handle: false, total: true }
    }))

    const res = await app.fetch(new Request('http://localhost/'))
    const timingHeader = res.headers.get('Server-Timing')

    expect(timingHeader).toBeDefined()
    expect(timingHeader).toContain('total;dur=')
    expect(timingHeader).not.toContain('handle;dur=')
  })

  it('should work with async operations', async () => {
    const app = new Server(defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/async',
        handler: async () => {
          // 模拟异步操作
          await new Promise(resolve => setTimeout(resolve, 50))
          return 'Async operation completed'
        }
      })
    ]))

    // 应用中间件
    app.useGlobalMiddleware(serverTiming({
      enabled: true,
      trace: { handle: true, total: true }
    }))

    const res = await app.fetch(new Request('http://localhost/async'))
    const data = await res.text()

    expect(data).toBe('Async operation completed')
    expect(res.status).toBe(200)

    // 检查 Server-Timing 头部
    const timingHeader = res.headers.get('Server-Timing')
    expect(timingHeader).toBeDefined()
    
    // 解析时间值
    const totalMatch = timingHeader.match(/total;dur=(\d+\.?\d*)/)
    expect(totalMatch).toBeDefined()
    
    const totalTime = parseFloat(totalMatch![1])
    expect(totalTime).toBeGreaterThan(0)
  })
})
```

## 特性

- ✅ **性能监控**: 自动追踪请求处理时间和总时间
- ✅ **灵活配置**: 支持开发/生产环境的不同配置
- ✅ **条件控制**: 支持基于请求上下文的动态控制
- ✅ **标准头部**: 自动添加 RFC 标准的 Server-Timing 头部
- ✅ **轻量级**: 最小化性能开销
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **易于集成**: 无缝集成到 Vafast 应用

## 最佳实践

### 1. 环境配置

```typescript
const timing = serverTiming({
  enabled: process.env.NODE_ENV === 'development',
  allow: process.env.ENABLE_TIMING === 'true'
})
```

### 2. 路径过滤

```typescript
allow: (ctx) => {
  const url = new URL(ctx.request.url)
  // 只对 API 端点启用
  return url.pathname.startsWith('/api/')
}
```

### 3. 权限控制

```typescript
allow: (ctx) => {
  const isAdmin = ctx.request.headers.get('x-admin-key') === process.env.ADMIN_KEY
  return isAdmin
}
```

### 4. 性能考虑

```typescript
// 在生产环境中谨慎启用
const timing = serverTiming({
  enabled: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
  trace: { handle: false, total: true }  // 只追踪总时间以减少开销
})
```

## 注意事项

1. **性能影响**: Server Timing 中间件会添加少量性能开销
2. **生产环境**: 默认在生产环境中禁用，避免暴露性能信息
3. **头部大小**: Server-Timing 头部会增加响应大小
4. **浏览器支持**: 确保目标浏览器支持 Server-Timing 头部
5. **调试工具**: 使用浏览器开发者工具查看 Server-Timing 信息

## 相关链接

- [Server-Timing MDN 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
- [Server-Timing RFC 标准](https://www.w3.org/TR/server-timing/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Vafast 官方文档](https://vafast.dev)