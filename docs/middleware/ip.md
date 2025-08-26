---
title: IP 中间件 - Vafast
---

# IP 中间件

用于 [Vafast](https://github.com/vafastjs/vafast) 的 IP 地址获取中间件，支持从各种代理头部中提取真实的客户端 IP 地址。

## 安装

通过以下命令安装：

```bash
bun add @vafast/ip
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

// 创建 IP 中间件
const ipMiddleware = ip()

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler((request: Request) => {
      // 访问客户端 IP 地址
      const clientIP = (request as any).ip
      return { 
        message: 'Hello World!',
        clientIP: clientIP || 'Unknown'
      }
    }),
    middleware: [ipMiddleware],
  },
  {
    method: 'GET',
    path: '/api/client-info',
    handler: createRouteHandler((request: Request) => {
      return {
        ip: (request as any).ip,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    }),
    middleware: [ipMiddleware],
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
  fetch: (req: Request) => server.fetch(req),
}
```

## 配置选项

### Options

```typescript
interface Options {
  /**
   * 自定义检查 IP 地址的头部
   * @default ['x-real-ip', 'x-client-ip', 'cf-connecting-ip', 'fastly-client-ip', 'x-cluster-client-ip', 'x-forwarded', 'forwarded-for', 'forwarded', 'x-forwarded', 'appengine-user-ip', 'true-client-ip', 'cf-pseudo-ipv4']
   */
  checkHeaders?: IPHeaders[]
  
  /**
   * 仅检查头部，不考虑运行时环境
   * @default false
   */
  headersOnly?: boolean
  
  /**
   * 注入服务器实例的函数
   */
  injectServer: InjectServer
}
```

### IPHeaders

```typescript
type IPHeaders =
  | "x-real-ip"           // Nginx proxy/FastCGI
  | "x-client-ip"         // Apache mod_remoteip
  | "cf-connecting-ip"    // Cloudflare
  | "fastly-client-ip"    // Fastly
  | "x-cluster-client-ip" // GCP
  | "x-forwarded"         // General Forwarded
  | "forwarded-for"       // RFC 7239
  | "forwarded"           // RFC 7239
  | "x-forwarded"         // RFC 7239
  | "appengine-user-ip"   // GCP
  | "true-client-ip"      // Akamai and Cloudflare
  | "cf-pseudo-ipv4"      // Cloudflare
  | "fly-client-ip"       // Fly.io
  | (string & {})         // 自定义头部
```

## 支持的代理头部

中间件默认检查以下头部，按优先级排序：

### 1. 标准代理头部
- **`x-real-ip`**: Nginx 反向代理和 FastCGI
- **`x-client-ip`**: Apache mod_remoteip 模块
- **`x-forwarded-for`**: 标准转发头部（RFC 7239）

### 2. 云服务提供商头部
- **`cf-connecting-ip`**: Cloudflare CDN
- **`fastly-client-ip`**: Fastly CDN
- **`x-cluster-client-ip`**: Google Cloud Platform
- **`appengine-user-ip`**: Google App Engine
- **`true-client-ip`**: Akamai 和 Cloudflare
- **`cf-pseudo-ipv4`**: Cloudflare IPv4 映射

### 3. 平台特定头部
- **`fly-client-ip`**: Fly.io 平台
- **`forwarded`**: RFC 7239 标准头部

## 使用模式

### 1. 基本 IP 获取

```typescript
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

const ipMiddleware = ip()

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler((request: Request) => {
      const clientIP = (request as any).ip
      return { 
        message: 'Welcome!',
        yourIP: clientIP || 'Unknown',
        timestamp: new Date().toISOString()
      }
    }),
    middleware: [ipMiddleware],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 2. 自定义头部检查

```typescript
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

// 自定义检查的头部，按优先级排序
const customIpMiddleware = ip({
  checkHeaders: [
    'x-custom-ip',      // 自定义头部
    'x-real-ip',        // Nginx 代理
    'x-forwarded-for',  // 标准转发
    'cf-connecting-ip'  // Cloudflare
  ]
})

const routes = [
  {
    method: 'GET',
    path: '/api/ip',
    handler: createRouteHandler((request: Request) => {
      return {
        ip: (request as any).ip,
        headers: {
          'x-custom-ip': request.headers.get('x-custom-ip'),
          'x-real-ip': request.headers.get('x-real-ip'),
          'x-forwarded-for': request.headers.get('x-forwarded-for'),
          'cf-connecting-ip': request.headers.get('cf-connecting-ip')
        }
      }
    }),
    middleware: [customIpMiddleware],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 3. 多实例注入

```typescript
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

const ipMiddleware = ip()

// 创建多个实例，每个都使用 IP 中间件
const aInstance = {
  method: 'GET',
  path: '/a',
  handler: createRouteHandler((request: Request) => {
    return {
      instance: 'A',
      clientIP: (request as any).ip,
      timestamp: new Date().toISOString()
    }
  }),
  middleware: [ipMiddleware],
}

const bInstance = {
  method: 'GET',
  path: '/b',
  handler: createRouteHandler((request: Request) => {
    return {
      instance: 'B',
      clientIP: (request as any).ip,
      timestamp: new Date().toISOString()
    }
  }),
  middleware: [ipMiddleware],
}

const routes = [
  aInstance,
  bInstance,
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { 
        message: 'Multi-instance IP tracking',
        endpoints: ['/a', '/b']
      }
    }),
  },
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 4. 条件 IP 获取

```typescript
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

const routes = [
  {
    method: 'GET',
    path: '/public',
    handler: createRouteHandler(() => {
      return { message: 'Public endpoint - no IP tracking' }
    })
    // 不应用 IP 中间件
  },
  {
    method: 'GET',
    path: '/tracked',
    handler: createRouteHandler((request: Request) => {
      return { 
        message: 'IP tracked endpoint',
        clientIP: (request as any).ip
      }
    }),
    middleware: [ip()], // 动态创建中间件
  },
  {
    method: 'GET',
    path: '/admin',
    handler: createRouteHandler((request: Request) => {
      const clientIP = (request as any).ip
      
      // 基于 IP 的访问控制
      if (clientIP === '192.168.1.100') {
        return { 
          message: 'Admin access granted',
          clientIP,
          role: 'admin'
        }
      } else {
        return { 
          message: 'Access denied',
          clientIP,
          requiredIP: '192.168.1.100'
        }
      }
    }),
    middleware: [ip()],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 5. 高级配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

const advancedIpMiddleware = ip({
  checkHeaders: [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip'
  ],
  headersOnly: true, // 仅检查头部
  injectServer: (app) => {
    // 注入服务器实例的逻辑
    console.log('IP middleware injected into server')
    return app
  }
})

const routes = [
  {
    method: 'GET',
    path: '/advanced',
    handler: createRouteHandler((request: Request) => {
      const clientIP = (request as any).ip
      
      return {
        message: 'Advanced IP tracking',
        clientIP,
        headers: {
          'x-real-ip': request.headers.get('x-real-ip'),
          'x-forwarded-for': request.headers.get('x-forwarded-for'),
          'cf-connecting-ip': request.headers.get('cf-connecting-ip')
        },
        timestamp: new Date().toISOString()
      }
    }),
    middleware: [advancedIpMiddleware],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

// 创建不同配置的 IP 中间件
const basicIpMiddleware = ip()
const customIpMiddleware = ip({
  checkHeaders: ['x-custom-ip', 'x-real-ip', 'x-forwarded-for']
})
const strictIpMiddleware = ip({
  checkHeaders: ['x-real-ip', 'cf-connecting-ip'],
  headersOnly: true
})

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { 
        message: 'Vafast IP Tracking API',
        endpoints: [
          '/basic - 基本 IP 获取',
          '/custom - 自定义头部检查',
          '/strict - 严格头部检查',
          '/multi - 多实例 IP 跟踪',
          '/admin - 基于 IP 的访问控制'
        ]
      }
    })
  },
  {
    method: 'GET',
    path: '/basic',
    handler: createRouteHandler((request: Request) => {
      return { 
        message: 'Basic IP tracking',
        clientIP: (request as any).ip || 'Unknown',
        method: 'Default headers check'
      }
    }),
    middleware: [basicIpMiddleware],
  },
  {
    method: 'GET',
    path: '/custom',
    handler: createRouteHandler((request: Request) => {
      return { 
        message: 'Custom headers IP tracking',
        clientIP: (request as any).ip || 'Unknown',
        method: 'Custom headers check',
        checkedHeaders: [
          'x-custom-ip',
          'x-real-ip', 
          'x-forwarded-for'
        ]
      }
    }),
    middleware: [customIpMiddleware],
  },
  {
    method: 'GET',
    path: '/strict',
    handler: createRouteHandler((request: Request) => {
      return { 
        message: 'Strict headers IP tracking',
        clientIP: (request as any).ip || 'Unknown',
        method: 'Strict headers only',
        checkedHeaders: [
          'x-real-ip',
          'cf-connecting-ip'
        ]
      }
    }),
    middleware: [strictIpMiddleware],
  },
  {
    method: 'GET',
    path: '/multi',
    handler: createRouteHandler((request: Request) => {
      return { 
        message: 'Multi-instance IP tracking',
        clientIP: (request as any).ip || 'Unknown',
        instances: ['/multi/a', '/multi/b']
      }
    }),
    middleware: [basicIpMiddleware],
  },
  {
    method: 'GET',
    path: '/multi/a',
    handler: createRouteHandler((request: Request) => {
      return { 
        instance: 'A',
        clientIP: (request as any).ip || 'Unknown',
        timestamp: new Date().toISOString()
      }
    }),
    middleware: [basicIpMiddleware],
  },
  {
    method: 'GET',
    path: '/multi/b',
    handler: createRouteHandler((request: Request) => {
      return { 
        instance: 'B',
        clientIP: (request as any).ip || 'Unknown',
        timestamp: new Date().toISOString()
      }
    }),
    middleware: [basicIpMiddleware],
  },
  {
    method: 'GET',
    path: '/admin',
    handler: createRouteHandler((request: Request) => {
      const clientIP = (request as any).ip
      
      // 简单的 IP 白名单
      const allowedIPs = ['192.168.1.100', '10.0.0.1', '127.0.0.1']
      
      if (allowedIPs.includes(clientIP)) {
        return { 
          message: 'Admin access granted',
          clientIP,
          role: 'admin',
          allowedIPs,
          timestamp: new Date().toISOString()
        }
      } else {
        return { 
          message: 'Access denied',
          clientIP: clientIP || 'Unknown',
          requiredIPs: allowedIPs,
          timestamp: new Date().toISOString()
        }
      }
    }),
    middleware: [basicIpMiddleware],
  },
  {
    method: 'POST',
    path: '/api/log',
    handler: createRouteHandler(async (request: Request) => {
      const clientIP = (request as any).ip
      const body = await request.json()
      
      // 记录客户端活动
      console.log(`[${new Date().toISOString()}] IP: ${clientIP}, Action: ${body.action}`)
      
      return { 
        message: 'Activity logged',
        clientIP,
        action: body.action,
        timestamp: new Date().toISOString()
      }
    }),
    middleware: [basicIpMiddleware],
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
  fetch: (req: Request) => server.fetch(req),
}

console.log('🚀 Vafast IP Tracking API 服务器启动成功！')
console.log('📱 基本 IP 获取: GET /basic')
console.log('🎯 自定义头部: GET /custom')
console.log('🔒 严格检查: GET /strict')
console.log('🔄 多实例跟踪: GET /multi')
console.log('👑 管理访问: GET /admin')
console.log('📝 活动记录: POST /api/log')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, createRouteHandler } from 'vafast'
import { ip } from '@vafast/ip'

describe('Vafast IP Plugin', () => {
  it('should extract IP from X-Real-IP header', async () => {
    const ipMiddleware = ip()

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(({ req }: { req: Request }) => {
          return { ip: (req as any).ip }
        }),
        middleware: [ipMiddleware],
      },
    ])

    const req = new Request('http://localhost/', {
      headers: {
        'X-Real-IP': '192.168.1.100',
      },
    })

    const res = await app.fetch(req)
    const data = await res.json()

    expect(data.ip).toBe('192.168.1.100')
  })

  it('should extract IP from X-Forwarded-For header', async () => {
    const ipMiddleware = ip()

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(({ req }: { req: Request }) => {
          return { ip: (req as any).ip }
        }),
        middleware: [ipMiddleware],
      },
    ])

    const req = new Request('http://localhost/', {
      headers: {
        'X-Forwarded-For': '203.0.113.1, 192.168.1.100',
      },
    })

    const res = await app.fetch(req)
    const data = await res.json()

    // X-Forwarded-For 应该返回第一个 IP（最原始的客户端 IP）
    expect(data.ip).toBe('203.0.113.1')
  })

  it('should extract IP from Cloudflare header', async () => {
    const ipMiddleware = ip()

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(({ req }: { req: Request }) => {
          return { ip: (req as any).ip }
        }),
        middleware: [ipMiddleware],
      },
    ])

    const req = new Request('http://localhost/', {
      headers: {
        'CF-Connecting-IP': '104.16.123.456',
      },
    })

    const res = await app.fetch(req)
    const data = await res.json()

    expect(data.ip).toBe('104.16.123.456')
  })

  it('should handle custom headers configuration', async () => {
    const ipMiddleware = ip({
      checkHeaders: ['X-Custom-IP', 'X-Real-IP'],
    })

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(({ req }: { req: Request }) => {
          return { ip: (req as any).ip }
        }),
        middleware: [ipMiddleware],
      },
    ])

    const req = new Request('http://localhost/', {
      headers: {
        'X-Custom-IP': '10.0.0.1',
        'X-Real-IP': '192.168.1.100',
      },
    })

    const res = await app.fetch(req)
    const data = await res.json()

    // 应该优先使用 X-Custom-IP
    expect(data.ip).toBe('10.0.0.1')
  })

  it('should handle missing IP headers', async () => {
    const ipMiddleware = ip()

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(({ req }: { req: Request }) => {
          return { ip: (req as any).ip }
        }),
        middleware: [ipMiddleware],
      },
    ])

    const req = new Request('http://localhost/')
    const res = await app.fetch(req)
    const data = await res.json()

    // 没有 IP 头部时应该返回空字符串
    expect(data.ip).toBe('')
  })
})
```

## 特性

- ✅ **多头部支持**: 支持所有常见的代理头部
- ✅ **优先级排序**: 按配置顺序检查头部
- ✅ **云服务兼容**: 支持 Cloudflare、Fastly、GCP 等
- ✅ **自定义配置**: 可自定义检查的头部列表
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **高性能**: 轻量级实现，最小化性能开销
- ✅ **易于集成**: 无缝集成到 Vafast 应用

## 最佳实践

### 1. 头部优先级配置

```typescript
const ipMiddleware = ip({
  checkHeaders: [
    'x-real-ip',        // 最高优先级：直接代理
    'cf-connecting-ip', // 次优先级：Cloudflare
    'x-forwarded-for',  // 标准优先级：通用代理
    'x-client-ip'       // 最低优先级：备用选项
  ]
})
```

### 2. 环境特定配置

```typescript
const getIpConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境：严格的头部检查
    return {
      checkHeaders: ['x-real-ip', 'cf-connecting-ip'],
      headersOnly: true
    }
  } else {
    // 开发环境：宽松的头部检查
    return {
      checkHeaders: ['x-real-ip', 'x-forwarded-for', 'x-client-ip']
    }
  }
}

const ipMiddleware = ip(getIpConfig())
```

### 3. 安全考虑

```typescript
const secureIpMiddleware = ip({
  checkHeaders: [
    'x-real-ip',        // 可信的代理头部
    'cf-connecting-ip'  // 可信的 CDN 头部
  ],
  headersOnly: true     // 仅检查头部，不依赖环境
})

// 在路由中使用
const routes = [
  {
    method: 'GET',
    path: '/secure',
    handler: createRouteHandler((request: Request) => {
      const clientIP = (request as any).ip
      
      // 验证 IP 地址格式
      if (!isValidIP(clientIP)) {
        return { error: 'Invalid IP address' }
      }
      
      return { 
        message: 'Secure endpoint',
        clientIP,
        validated: true
      }
    }),
    middleware: [secureIpMiddleware],
  }
]
```

### 4. 监控和日志

```typescript
const monitoredIpMiddleware = ip({
  checkHeaders: ['x-real-ip', 'x-forwarded-for'],
  injectServer: (app) => {
    console.log('IP middleware injected with monitoring')
    return app
  }
})

// 在处理器中添加 IP 监控
const routes = [
  {
    method: 'GET',
    path: '/monitored',
    handler: createRouteHandler((request: Request) => {
      const clientIP = (request as any).ip
      
      // 记录 IP 访问
      logIPAccess(clientIP, request.url, new Date())
      
      return { 
        message: 'IP access monitored',
        clientIP,
        timestamp: new Date().toISOString()
      }
    }),
    middleware: [monitoredIpMiddleware],
  }
]
```

## 注意事项

1. **头部优先级**: 配置的头部按顺序检查，第一个找到的 IP 将被使用
2. **X-Forwarded-For 处理**: 该头部可能包含多个 IP，中间件会使用第一个（最原始的客户端 IP）
3. **安全考虑**: 在生产环境中，建议仅信任可信的代理头部
4. **性能影响**: IP 中间件对性能影响很小，但建议在需要时使用
5. **类型断言**: 当前版本需要类型断言 `(request as any).ip` 来访问 IP 地址

## 相关链接

- [X-Forwarded-For - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)
- [Forwarded - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded)
- [RFC 7239 - Forwarded HTTP Extension](https://tools.ietf.org/html/rfc7239)
- [Cloudflare Headers](https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers/)
- [Vafast 官方文档](https://vafast.dev)
