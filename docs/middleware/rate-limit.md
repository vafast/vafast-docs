---
title: Rate Limit 中间件 - Vafast
---

# Rate Limit 中间件

该中间件为 [Vafast](https://github.com/vafastjs/vafast) 提供了灵活的速率限制功能，保护你的 API 免受滥用和 DDoS 攻击。

## 安装

安装命令：
```bash
bun add @vafast/rate-limit
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

// 创建速率限制中间件
const rateLimitMiddleware = rateLimit({
  duration: 60000, // 1分钟
  max: 5, // 最多5个请求
  errorResponse: 'Rate limit exceeded. Please try again later.',
  headers: true,
  skip: (req) => {
    // 跳过健康检查请求
    return req.url.includes('/health')
  }
})

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return 'Hello, Vafast with Rate Limiting!'
    })
  },
  {
    method: 'GET',
    path: '/health',
    handler: createRouteHandler(() => {
      return { status: 'OK', timestamp: new Date().toISOString() }
    })
  },
  {
    method: 'POST',
    path: '/api/data',
    handler: createRouteHandler(() => {
      return { message: 'Data created successfully' }
    })
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用中间件
export default {
  fetch: (req: Request) => {
    // 应用速率限制中间件
    return rateLimitMiddleware(req, () => server.fetch(req))
  }
}
```

## 配置选项

### Options

```typescript
interface Options {
  /** 速率限制的时间窗口（毫秒），默认：60000ms (1分钟) */
  duration: number
  
  /** 在指定时间窗口内允许的最大请求数，默认：10 */
  max: number
  
  /** 当达到速率限制时的错误响应，可以是字符串、Response 对象或 Error 对象 */
  errorResponse: string | Response | Error
  
  /** 速率限制的作用域（保持兼容性，在 vafast 中未使用） */
  scoping: 'global' | 'scoped'
  
  /** 是否在请求失败时也计入速率限制，默认：false */
  countFailedRequest: boolean
  
  /** 生成客户端标识密钥的函数 */
  generator: Generator<any>
  
  /** 存储请求计数的上下文对象 */
  context: Context
  
  /** 跳过速率限制的函数，返回 true 时跳过计数 */
  skip: (req: Request, key?: string) => boolean | Promise<boolean>
  
  /** 注入服务器实例到生成器函数的显式方式（仅作为最后手段使用） */
  injectServer?: () => any | null
  
  /** 是否让中间件控制 RateLimit-* 头部，默认：true */
  headers: boolean
}
```

### 默认选项

```typescript
const defaultOptions = {
  duration: 60000,        // 1分钟
  max: 10,               // 最多10个请求
  errorResponse: 'rate-limit reached',
  scoping: 'global',
  countFailedRequest: false,
  generator: defaultKeyGenerator,  // 基于 IP 地址的默认生成器
  headers: true,
  skip: () => false,     // 默认不跳过任何请求
}
```

## 使用模式

### 1. 基本速率限制

```typescript
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const rateLimitMiddleware = rateLimit({
  duration: 60000,  // 1分钟
  max: 10,         // 最多10个请求
  errorResponse: 'Too many requests. Please try again later.',
  headers: true
})

const routes = [
  {
    method: 'GET',
    path: '/api/users',
    handler: createRouteHandler(() => {
      return { users: ['Alice', 'Bob', 'Charlie'] }
    })
  },
  {
    method: 'POST',
    path: '/api/users',
    handler: createRouteHandler(async ({ req }) => {
      const body = await req.json()
      return { message: 'User created', user: body }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return rateLimitMiddleware(req, () => server.fetch(req))
  }
}
```

### 2. 自定义密钥生成器

```typescript
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'
import type { Generator } from '@vafast/rate-limit'

// 基于用户 ID 的密钥生成器
const userBasedGenerator: Generator<{ userId: string }> = async (req, server, { userId }) => {
  // 从请求头或查询参数获取用户 ID
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    // 这里应该验证 JWT 令牌并提取用户 ID
    // 为了演示，我们使用一个简单的实现
    return `user:${userId || 'anonymous'}`
  }
  
  // 如果没有认证，使用 IP 地址
  const clientIp = req.headers.get('x-real-ip') || 
                   req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                   'unknown'
  
  return `ip:${clientIp}`
}

const rateLimitMiddleware = rateLimit({
  duration: 300000,  // 5分钟
  max: 100,         // 每个用户最多100个请求
  generator: userBasedGenerator,
  errorResponse: 'User rate limit exceeded',
  headers: true
})

const routes = [
  {
    method: 'GET',
    path: '/api/profile',
    handler: createRouteHandler(() => {
      return { message: 'User profile' }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return rateLimitMiddleware(req, () => server.fetch(req))
  }
}
```

### 3. 条件跳过

```typescript
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const rateLimitMiddleware = rateLimit({
  duration: 60000,
  max: 20,
  errorResponse: 'Rate limit exceeded',
  headers: true,
  skip: (req) => {
    const url = new URL(req.url)
    
    // 跳过健康检查
    if (url.pathname === '/health') return true
    
    // 跳过静态资源
    if (url.pathname.startsWith('/static/')) return true
    
    // 跳过管理员 IP
    const clientIp = req.headers.get('x-real-ip')
    if (clientIp === '192.168.1.100') return true
    
    // 跳过特定用户代理
    const userAgent = req.headers.get('user-agent')
    if (userAgent?.includes('GoogleBot')) return true
    
    return false
  }
})

const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: createRouteHandler(() => {
      return { status: 'OK', timestamp: new Date().toISOString() }
    })
  },
  {
    method: 'GET',
    path: '/api/data',
    handler: createRouteHandler(() => {
      return { data: 'Protected data' }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return rateLimitMiddleware(req, () => server.fetch(req))
  }
}
```

### 4. 多实例速率限制

```typescript
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'
import type { Generator } from '@vafast/rate-limit'

// 自定义密钥生成器，基于 IP 地址
const keyGenerator: Generator<{ ip: string }> = async (req, server, { ip }) => {
  const clientIp = req.headers.get('x-real-ip') || 
                   req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                   'unknown'
  
  // 使用 IP 地址生成哈希作为密钥
  return Bun.hash(JSON.stringify(clientIp)).toString()
}

// 创建第一个实例的速率限制中间件
const aInstanceRateLimit = rateLimit({
  scoping: 'scoped',
  duration: 200 * 1000, // 200秒
  max: 10,
  generator: keyGenerator,
  errorResponse: 'Instance A rate limit exceeded',
  headers: true
})

// 创建第二个实例的速率限制中间件
const bInstanceRateLimit = rateLimit({
  scoping: 'scoped',
  duration: 100 * 1000, // 100秒
  max: 5,
  generator: keyGenerator,
  errorResponse: 'Instance B rate limit exceeded',
  headers: true
})

// 定义第一个实例的路由
const aInstanceRoutes = [
  {
    method: 'GET',
    path: '/a',
    handler: createRouteHandler(() => {
      return 'Instance A - Rate limited to 10 requests per 200 seconds'
    })
  }
]

// 定义第二个实例的路由
const bInstanceRoutes = [
  {
    method: 'GET',
    path: '/b',
    handler: createRouteHandler(() => {
      return 'Instance B - Rate limited to 5 requests per 100 seconds'
    })
  }
]

// 定义主应用路由
const mainRoutes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return 'Main application - No rate limiting'
    })
  },
  {
    method: 'GET',
    path: '/status',
    handler: createRouteHandler(() => {
      return { 
        message: 'Application status',
        instances: ['A', 'B'],
        timestamp: new Date().toISOString()
      }
    })
  }
]

// 创建实例服务器
const aInstance = new Server(aInstanceRoutes)
const bInstance = new Server(bInstanceRoutes)
const mainServer = new Server(mainRoutes)

// 导出 fetch 函数，应用不同的速率限制中间件
export default {
  fetch: (req: Request) => {
    const url = new URL(req.url)
    const path = url.pathname

    // 根据路径应用不同的速率限制中间件
    if (path.startsWith('/a')) {
      return aInstanceRateLimit(req, () => aInstance.fetch(req))
    } else if (path.startsWith('/b')) {
      return bInstanceRateLimit(req, () => bInstance.fetch(req))
    } else {
      // 主应用不应用速率限制
      return mainServer.fetch(req)
    }
  }
}
```

### 5. 自定义错误响应

```typescript
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

// 自定义错误响应
const customErrorResponse = new Response(
  JSON.stringify({
    error: 'Rate limit exceeded',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 60,
    code: 'RATE_LIMIT_EXCEEDED'
  }),
  {
    status: 429,
    statusText: 'Too Many Requests',
    headers: {
      'Content-Type': 'application/json'
    }
  }
)

const rateLimitMiddleware = rateLimit({
  duration: 60000,
  max: 5,
  errorResponse: customErrorResponse,
  headers: true
})

const routes = [
  {
    method: 'GET',
    path: '/api/sensitive',
    handler: createRouteHandler(() => {
      return { message: 'Sensitive data' }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return rateLimitMiddleware(req, () => server.fetch(req))
  }
}
```

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'
import type { Generator } from '@vafast/rate-limit'

// 自定义密钥生成器
const customGenerator: Generator<{ userId?: string }> = async (req, server, { userId }) => {
  // 优先使用用户 ID
  if (userId) {
    return `user:${userId}`
  }
  
  // 尝试从 JWT 令牌中获取用户 ID
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // 这里应该验证 JWT 令牌
      // 为了演示，我们使用一个简单的实现
      const token = authHeader.substring(7)
      // const decoded = jwt.verify(token, secret)
      // return `user:${decoded.userId}`
    } catch (error) {
      // 令牌无效，继续使用 IP
    }
  }
  
  // 使用 IP 地址作为备用
  const clientIp = req.headers.get('x-real-ip') || 
                   req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                   req.headers.get('cf-connecting-ip') ||
                   'unknown'
  
  return `ip:${clientIp}`
}

// 创建不同级别的速率限制中间件
const strictRateLimit = rateLimit({
  duration: 60000,  // 1分钟
  max: 5,          // 最多5个请求
  generator: customGenerator,
  errorResponse: 'Strict rate limit exceeded. Please wait before making more requests.',
  headers: true,
  skip: (req) => {
    // 跳过健康检查和状态端点
    const url = new URL(req.url)
    return url.pathname === '/health' || url.pathname === '/status'
  }
})

const moderateRateLimit = rateLimit({
  duration: 300000,  // 5分钟
  max: 50,          // 最多50个请求
  generator: customGenerator,
  errorResponse: 'Moderate rate limit exceeded. Please reduce your request frequency.',
  headers: true,
  skip: (req) => {
    // 跳过健康检查、状态端点和静态资源
    const url = new URL(req.url)
    return url.pathname === '/health' || 
           url.pathname === '/status' || 
           url.pathname.startsWith('/static/')
  }
})

const lenientRateLimit = rateLimit({
  duration: 3600000,  // 1小时
  max: 1000,         // 最多1000个请求
  generator: customGenerator,
  errorResponse: 'Lenient rate limit exceeded. Please contact support if you need higher limits.',
  headers: true,
  skip: (req) => {
    // 只跳过健康检查
    const url = new URL(req.url)
    return url.pathname === '/health'
  }
})

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return {
        message: 'Vafast Rate Limiting API',
        version: '1.0.0',
        endpoints: [
          'GET /health - 健康检查（无限制）',
          'GET /status - 状态信息（无限制）',
          'GET /api/public - 公开 API（宽松限制）',
          'GET /api/user - 用户 API（中等限制）',
          'POST /api/admin - 管理 API（严格限制）',
          'GET /static/* - 静态资源（无限制）'
        ]
      }
    })
  },
  {
    method: 'GET',
    path: '/health',
    handler: createRouteHandler(() => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    })
  },
  {
    method: 'GET',
    path: '/status',
    handler: createRouteHandler(() => {
      return {
        message: 'System status',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })
  },
  {
    method: 'GET',
    path: '/api/public',
    handler: createRouteHandler(() => {
      return {
        message: 'Public API endpoint',
        data: 'This endpoint has lenient rate limiting (1000 requests per hour)',
        timestamp: new Date().toISOString()
      }
    })
  },
  {
    method: 'GET',
    path: '/api/user',
    handler: createRouteHandler(() => {
      return {
        message: 'User API endpoint',
        data: 'This endpoint has moderate rate limiting (50 requests per 5 minutes)',
        user: {
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com'
        },
        timestamp: new Date().toISOString()
      }
    })
  },
  {
    method: 'POST',
    path: '/api/admin',
    handler: createRouteHandler(async ({ req }) => {
      const body = await req.json()
      
      return {
        message: 'Admin API endpoint',
        data: 'This endpoint has strict rate limiting (5 requests per minute)',
        received: body,
        timestamp: new Date().toISOString()
      }
    })
  },
  {
    method: 'GET',
    path: '/static/:file',
    handler: createRouteHandler(({ params }) => {
      return {
        message: 'Static file endpoint',
        file: params.file,
        data: 'This endpoint has no rate limiting',
        timestamp: new Date().toISOString()
      }
    })
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用速率限制中间件
export default {
  fetch: (req: Request) => {
    const url = new URL(req.url)
    const path = url.pathname

    // 根据路径应用不同的速率限制
    if (path.startsWith('/api/admin')) {
      return strictRateLimit(req, () => server.fetch(req))
    } else if (path.startsWith('/api/user')) {
      return moderateRateLimit(req, () => server.fetch(req))
    } else if (path.startsWith('/api/public')) {
      return lenientRateLimit(req, () => server.fetch(req))
    } else {
      // 其他端点不应用速率限制
      return server.fetch(req)
    }
  }
}

console.log('🚀 Vafast Rate Limiting API 服务器启动成功！')
console.log('📊 不同端点应用了不同级别的速率限制')
console.log('🔒 管理 API：5 请求/分钟')
console.log('👤 用户 API：50 请求/5分钟')
console.log('🌐 公开 API：1000 请求/小时')
console.log('✅ 健康检查和状态端点无限制')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, createRouteHandler } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

describe('Vafast Rate Limit Plugin', () => {
  it('should create rate limit middleware', () => {
    const rateLimitMiddleware = rateLimit({
      duration: 60000,
      max: 5,
      errorResponse: 'Rate limit exceeded',
      headers: true
    })
    
    expect(rateLimitMiddleware).toBeDefined()
    expect(typeof rateLimitMiddleware).toBe('function')
  })

  it('should allow requests within rate limit', async () => {
    const rateLimitMiddleware = rateLimit({
      duration: 60000,
      max: 3,
      headers: true
    })
    
    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return 'Hello, Rate Limited!'
        })
      }
    ])

    // 应用中间件
    const wrappedFetch = (req: Request) => {
      return rateLimitMiddleware(req, () => app.fetch(req))
    }

    // 前3个请求应该成功
    for (let i = 0; i < 3; i++) {
      const res = await wrappedFetch(new Request('http://localhost/'))
      expect(res.status).toBe(200)
      const data = await res.text()
      expect(data).toBe('Hello, Rate Limited!')
      
      // 检查速率限制头部
      expect(res.headers.get('RateLimit-Limit')).toBe('3')
      expect(res.headers.get('RateLimit-Remaining')).toBe(String(2 - i))
      expect(res.headers.get('RateLimit-Reset')).toBeDefined()
    }
  })

  it('should block requests when rate limit exceeded', async () => {
    const rateLimitMiddleware = rateLimit({
      duration: 60000,
      max: 2,
      errorResponse: 'Too many requests',
      headers: true
    })
    
    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return 'Hello, Rate Limited!'
        })
      }
    ])

    // 应用中间件
    const wrappedFetch = (req: Request) => {
      return rateLimitMiddleware(req, () => app.fetch(req))
    }

    // 前2个请求应该成功
    for (let i = 0; i < 2; i++) {
      const res = await wrappedFetch(new Request('http://localhost/'))
      expect(res.status).toBe(200)
    }

    // 第3个请求应该被阻止
    const blockedRes = await wrappedFetch(new Request('http://localhost/'))
    expect(blockedRes.status).toBe(429)
    const errorData = await blockedRes.text()
    expect(errorData).toBe('Too many requests')
    
    // 检查错误响应头部
    expect(blockedRes.headers.get('RateLimit-Limit')).toBe('2')
    expect(blockedRes.headers.get('RateLimit-Remaining')).toBe('0')
    expect(blockedRes.headers.get('Retry-After')).toBeDefined()
  })

  it('should skip rate limiting when skip function returns true', async () => {
    const rateLimitMiddleware = rateLimit({
      duration: 60000,
      max: 1,
      headers: true,
      skip: (req) => req.url.includes('/health')
    })
    
    const app = new Server([
      {
        method: 'GET',
        path: '/health',
        handler: createRouteHandler(() => {
          return 'Health check'
        })
      }
    ])

    const wrappedFetch = (req: Request) => {
      return rateLimitMiddleware(req, () => app.fetch(req))
    }

    // 健康检查请求应该被跳过，不应用速率限制
    const res = await wrappedFetch(new Request('http://localhost/health'))
    expect(res.status).toBe(200)
    
    // 不应该有速率限制头部
    expect(res.headers.get('RateLimit-Limit')).toBeNull()
    expect(res.headers.get('RateLimit-Remaining')).toBeNull()
  })

  it('should handle custom error responses', async () => {
    const customError = new Response('Custom error message', { status: 429 })
    
    const rateLimitMiddleware = rateLimit({
      duration: 60000,
      max: 1,
      errorResponse: customError,
      headers: true
    })
    
    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return 'Hello'
        })
      }
    ])

    const wrappedFetch = (req: Request) => {
      return rateLimitMiddleware(req, () => app.fetch(req))
    }

    // 第一个请求应该成功
    const res1 = await wrappedFetch(new Request('http://localhost/'))
    expect(res1.status).toBe(200)

    // 第二个请求应该被阻止，返回自定义错误
    const res2 = await wrappedFetch(new Request('http://localhost/'))
    expect(res2.status).toBe(429)
    const errorData = await res2.text()
    expect(errorData).toBe('Custom error message')
  })

  it('should work with different HTTP methods', async () => {
    const rateLimitMiddleware = rateLimit({
      duration: 60000,
      max: 2,
      headers: true
    })
    
    const app = new Server([
      {
        method: 'POST',
        path: '/',
        handler: createRouteHandler(() => {
          return { message: 'POST request' }
        })
      }
    ])

    const wrappedFetch = (req: Request) => {
      return rateLimitMiddleware(req, () => app.fetch(req))
    }

    // 前2个 POST 请求应该成功
    for (let i = 0; i < 2; i++) {
      const res = await wrappedFetch(new Request('http://localhost/', {
        method: 'POST',
        body: JSON.stringify({ test: i })
      }))
      expect(res.status).toBe(200)
    }

    // 第3个 POST 请求应该被阻止
    const blockedRes = await wrappedFetch(new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ test: 3 })
    }))
    expect(blockedRes.status).toBe(429)
  })
})
```

## 特性

- ✅ **灵活配置**: 支持自定义时间窗口和请求限制
- ✅ **智能跳过**: 支持条件跳过速率限制
- ✅ **自定义密钥**: 支持基于 IP、用户 ID 等的自定义密钥生成
- ✅ **标准头部**: 自动添加 RateLimit-* 标准头部
- ✅ **错误处理**: 支持自定义错误响应和状态码
- ✅ **高性能**: 使用 LRU 缓存存储，内存占用低
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **易于集成**: 无缝集成到 Vafast 应用

## 最佳实践

### 1. 合理的限制设置

```typescript
// 根据端点的重要性设置不同的限制
const apiRateLimit = rateLimit({
  duration: 60000,  // 1分钟
  max: 100,        // 100个请求
  errorResponse: 'API rate limit exceeded'
})

const authRateLimit = rateLimit({
  duration: 300000,  // 5分钟
  max: 10,          // 10个请求（防止暴力破解）
  errorResponse: 'Too many authentication attempts'
})
```

### 2. 智能跳过策略

```typescript
skip: (req) => {
  const url = new URL(req.url)
  
  // 跳过健康检查
  if (url.pathname === '/health') return true
  
  // 跳过静态资源
  if (url.pathname.startsWith('/static/')) return true
  
  // 跳过管理员 IP
  const clientIp = req.headers.get('x-real-ip')
  if (adminIps.includes(clientIp)) return true
  
  return false
}
```

### 3. 自定义密钥生成

```typescript
const userBasedGenerator: Generator = async (req, server, { userId }) => {
  // 优先使用用户 ID
  if (userId) return `user:${userId}`
  
  // 备用使用 IP 地址
  const clientIp = req.headers.get('x-real-ip') || 'unknown'
  return `ip:${clientIp}`
}
```

### 4. 错误响应处理

```typescript
const customErrorResponse = new Response(
  JSON.stringify({
    error: 'Rate limit exceeded',
    retryAfter: 60,
    message: 'Please wait before making more requests'
  }),
  {
    status: 429,
    headers: { 'Content-Type': 'application/json' }
  }
)
```

## 注意事项

1. **内存使用**: 速率限制数据存储在内存中，注意设置合理的 `maxSize`
2. **分布式环境**: 在多个实例环境中，每个实例独立计数
3. **时间同步**: 确保服务器时间同步，避免速率限制不准确
4. **IP 地址**: 在代理环境中，确保正确获取真实客户端 IP
5. **错误处理**: 合理设置错误响应，避免暴露过多系统信息

## 相关链接

- [RFC 6585 - Rate Limiting](https://tools.ietf.org/html/rfc6585)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [Vafast 官方文档](https://vafast.dev)
