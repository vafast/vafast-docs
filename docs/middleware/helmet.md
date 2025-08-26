---
title: Helmet 中间件 - Vafast
---

# Helmet 中间件

用于 [Vafast](https://github.com/vafastjs/vafast) 的安全头中间件，通过添加各种 HTTP 安全头部来增强 Web 应用的安全性。

## 安装

通过以下命令安装：

```bash
bun add @vafast/helmet
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet } from '@vafast/helmet'

// 创建安全头中间件
const helmet = vafastHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
  frameOptions: "DENY",
  xssProtection: true,
  referrerPolicy: "strict-origin-when-cross-origin",
})

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { message: 'Hello World with Security Headers!' }
    }),
    middleware: [helmet],
  },
  {
    method: 'GET',
    path: '/api/data',
    handler: createRouteHandler(() => {
      return { data: 'Protected API endpoint' }
    }),
    middleware: [helmet],
  },
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
  fetch: (req: Request) => server.fetch(req),
}
```

## 配置选项

### SecurityConfig

```typescript
interface SecurityConfig {
  /** Content Security Policy 配置 */
  csp?: CSPConfig
  
  /** 启用或禁用 X-Frame-Options (DENY, SAMEORIGIN, ALLOW-FROM) */
  frameOptions?: "DENY" | "SAMEORIGIN" | "ALLOW-FROM"
  
  /** 启用或禁用 XSS Protection */
  xssProtection?: boolean
  
  /** 启用或禁用 DNS Prefetch Control */
  dnsPrefetch?: boolean
  
  /** 配置 Referrer Policy */
  referrerPolicy?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
  
  /** 配置 Permissions Policy */
  permissionsPolicy?: Record<string, string[]>
  
  /** 配置 HSTS (HTTP Strict Transport Security) */
  hsts?: HSTSConfig
  
  /** 启用或禁用 Cross-Origin Resource Policy */
  corp?: "same-origin" | "same-site" | "cross-origin"
  
  /** 启用或禁用 Cross-Origin Opener Policy */
  coop?: "unsafe-none" | "same-origin-allow-popups" | "same-origin"
  
  /** 配置 Report-To 头部 */
  reportTo?: ReportToConfig[]
  
  /** 自定义头部 */
  customHeaders?: Record<string, string>
}
```

### CSPConfig

```typescript
interface CSPConfig {
  /** 默认源指令 */
  defaultSrc?: string[]
  
  /** 脚本源指令 */
  scriptSrc?: string[]
  
  /** 样式源指令 */
  styleSrc?: string[]
  
  /** 图片源指令 */
  imgSrc?: string[]
  
  /** 字体源指令 */
  fontSrc?: string[]
  
  /** 连接源指令 */
  connectSrc?: string[]
  
  /** 框架源指令 */
  frameSrc?: string[]
  
  /** 对象源指令 */
  objectSrc?: string[]
  
  /** 基础 URI 指令 */
  baseUri?: string[]
  
  /** 报告 URI 指令 */
  reportUri?: string
  
  /** 为脚本和样式标签使用 nonce */
  useNonce?: boolean
  
  /** 仅报告模式 */
  reportOnly?: boolean
}
```

### HSTSConfig

```typescript
interface HSTSConfig {
  /** 最大年龄（秒） */
  maxAge?: number
  
  /** 包含子域名 */
  includeSubDomains?: boolean
  
  /** 预加载 */
  preload?: boolean
}
```

### ReportToConfig

```typescript
interface ReportToConfig {
  /** 端点组名 */
  group: string
  
  /** 端点配置的最大年龄（秒） */
  maxAge: number
  
  /** 发送报告的端点 */
  endpoints: Array<{
    url: string
    priority?: number
    weight?: number
  }>
  
  /** 在报告中包含子域名 */
  includeSubdomains?: boolean
}
```

## 权限常量

中间件提供了一些常用的权限常量：

```typescript
import { permission } from '@vafast/helmet'

const helmet = vafastHelmet({
  csp: {
    defaultSrc: [permission.SELF],           // "'self'"
    scriptSrc: [permission.SELF, permission.UNSAFE_INLINE], // "'self'" "'unsafe-inline'"
    imgSrc: [permission.SELF, permission.DATA, permission.BLOB], // "'self'" "data:" "blob:"
    objectSrc: [permission.NONE],            // "'none'"
    connectSrc: [permission.HTTPS],          // "https:"
  }
})
```

### 可用权限

| 常量 | 值 | 描述 |
|------|-----|------|
| `permission.SELF` | `"'self'"` | 允许同源资源 |
| `permission.UNSAFE_INLINE` | `"'unsafe-inline'"` | 允许内联脚本和样式 |
| `permission.HTTPS` | `"https:"` | 允许 HTTPS 资源 |
| `permission.DATA` | `"data:"` | 允许 data URI |
| `permission.BLOB` | `"blob:"` | 允许 blob URI |
| `permission.NONE` | `"'none'"` | 禁止所有资源 |

## 使用模式

### 1. 基本安全配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet } from '@vafast/helmet'

// 使用默认安全配置
const helmet = vafastHelmet()

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { message: 'Secure by default' }
    }),
    middleware: [helmet],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 2. 自定义 CSP 配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet, permission } from '@vafast/helmet'

const helmet = vafastHelmet({
  csp: {
    defaultSrc: [permission.SELF],
    scriptSrc: [
      permission.SELF,
      permission.UNSAFE_INLINE,
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    styleSrc: [
      permission.SELF,
      permission.UNSAFE_INLINE,
      'https://fonts.googleapis.com'
    ],
    fontSrc: [
      permission.SELF,
      'https://fonts.gstatic.com'
    ],
    imgSrc: [
      permission.SELF,
      permission.DATA,
      permission.BLOB,
      'https:'
    ],
    connectSrc: [
      permission.SELF,
      'https://api.example.com',
      'wss://ws.example.com'
    ],
    frameSrc: [permission.SELF],
    objectSrc: [permission.NONE],
    baseUri: [permission.SELF],
    reportUri: '/csp-report'
  }
})

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { message: 'Custom CSP configuration' }
    }),
    middleware: [helmet],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 3. 严格的 CSP 配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet, permission } from '@vafast/helmet'

const strictHelmet = vafastHelmet({
  csp: {
    defaultSrc: [permission.SELF],
    scriptSrc: [permission.SELF], // 不允许内联脚本
    styleSrc: [permission.SELF],  // 不允许内联样式
    imgSrc: [permission.SELF],
    fontSrc: [permission.SELF],
    connectSrc: [permission.SELF],
    frameSrc: [permission.NONE],  // 禁止所有框架
    objectSrc: [permission.NONE], // 禁止所有对象
    baseUri: [permission.SELF],
    useNonce: true // 启用 nonce 支持
  },
  frameOptions: 'DENY',
  xssProtection: true,
  referrerPolicy: 'strict-origin',
  corp: 'same-origin',
  coop: 'same-origin'
})

const routes = [
  {
    method: 'GET',
    path: '/secure',
    handler: createRouteHandler(() => {
      return { message: 'Strict security configuration' }
    }),
    middleware: [strictHelmet],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 4. 生产环境 HSTS 配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet } from '@vafast/helmet'

const productionHelmet = vafastHelmet({
  hsts: {
    maxAge: 31536000,        // 1 年
    includeSubDomains: true, // 包含子域名
    preload: true            // 预加载到浏览器
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    'interest-cohort': [], // 禁用 FLoC
    'payment': [],
    'usb': []
  }
})

const routes = [
  {
    method: 'GET',
    path: '/api',
    handler: createRouteHandler(() => {
      return { message: 'Production security headers' }
    }),
    middleware: [productionHelmet],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 5. 自定义头部和报告配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet } from '@vafast/helmet'

const advancedHelmet = vafastHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    reportUri: '/csp-report'
  },
  reportTo: [
    {
      group: 'csp-endpoint',
      maxAge: 86400, // 24 小时
      endpoints: [
        {
          url: 'https://reports.example.com/csp',
          priority: 1,
          weight: 1
        }
      ],
      includeSubdomains: true
    }
  ],
  customHeaders: {
    'X-Custom-Security': 'enabled',
    'X-Security-Level': 'high',
    'X-Content-Security': 'strict'
  }
})

const routes = [
  {
    method: 'GET',
    path: '/advanced',
    handler: createRouteHandler(() => {
      return { message: 'Advanced security configuration' }
    }),
    middleware: [advancedHelmet],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 6. 条件安全配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet } from '@vafast/helmet'

// 根据环境选择不同的安全配置
const getSecurityConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "https:"],
        connectSrc: ["'self'", "https://api.example.com"]
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      frameOptions: 'DENY',
      xssProtection: true
    }
  } else {
    // 开发环境：更宽松的配置
    return {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
      },
      frameOptions: 'SAMEORIGIN',
      xssProtection: false
    }
  }
}

const helmet = vafastHelmet(getSecurityConfig())

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { 
        message: 'Environment-aware security',
        environment: process.env.NODE_ENV || 'development'
      }
    }),
    middleware: [helmet],
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet, permission } from '@vafast/helmet'

// 创建不同安全级别的中间件
const basicHelmet = vafastHelmet({
  frameOptions: 'DENY',
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin'
})

const standardHelmet = vafastHelmet({
  csp: {
    defaultSrc: [permission.SELF],
    scriptSrc: [permission.SELF, permission.UNSAFE_INLINE],
    styleSrc: [permission.SELF, permission.UNSAFE_INLINE],
    imgSrc: [permission.SELF, permission.DATA, permission.BLOB],
    fontSrc: [permission.SELF],
    connectSrc: [permission.SELF],
    frameSrc: [permission.SELF],
    objectSrc: [permission.NONE],
    baseUri: [permission.SELF]
  },
  frameOptions: 'DENY',
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  dnsPrefetch: false,
  corp: 'same-origin',
  coop: 'same-origin'
})

const strictHelmet = vafastHelmet({
  csp: {
    defaultSrc: [permission.SELF],
    scriptSrc: [permission.SELF],
    styleSrc: [permission.SELF],
    imgSrc: [permission.SELF],
    fontSrc: [permission.SELF],
    connectSrc: [permission.SELF],
    frameSrc: [permission.NONE],
    objectSrc: [permission.NONE],
    baseUri: [permission.SELF],
    useNonce: true
  },
  frameOptions: 'DENY',
  xssProtection: true,
  referrerPolicy: 'strict-origin',
  dnsPrefetch: false,
  corp: 'same-origin',
  coop: 'same-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    'interest-cohort': [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  }
})

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { 
        message: 'Vafast Security Headers API',
        endpoints: [
          '/basic - 基本安全头部',
          '/standard - 标准安全配置',
          '/strict - 严格安全配置',
          '/custom - 自定义安全配置'
        ]
      }
    })
  },
  {
    method: 'GET',
    path: '/basic',
    handler: createRouteHandler(() => {
      return { 
        message: 'Basic security headers applied',
        security: 'Basic level'
      }
    }),
    middleware: [basicHelmet],
  },
  {
    method: 'GET',
    path: '/standard',
    handler: createRouteHandler(() => {
      return { 
        message: 'Standard security configuration applied',
        security: 'Standard level',
        csp: 'Enabled',
        frameOptions: 'DENY',
        xssProtection: 'Enabled'
      }
    }),
    middleware: [standardHelmet],
  },
  {
    method: 'GET',
    path: '/strict',
    handler: createRouteHandler(() => {
      return { 
        message: 'Strict security configuration applied',
        security: 'Strict level',
        csp: 'Strict mode',
        frameOptions: 'DENY',
        xssProtection: 'Enabled',
        permissionsPolicy: 'Restricted'
      }
    }),
    middleware: [strictHelmet],
  },
  {
    method: 'GET',
    path: '/custom',
    handler: createRouteHandler(() => {
      return { 
        message: 'Custom security configuration applied',
        security: 'Custom level'
      }
    }),
    middleware: [
      vafastHelmet({
        csp: {
          defaultSrc: [permission.SELF],
          scriptSrc: [permission.SELF, 'https://cdn.example.com'],
          styleSrc: [permission.SELF, 'https://fonts.googleapis.com'],
          imgSrc: [permission.SELF, 'https:', permission.DATA],
          connectSrc: [permission.SELF, 'https://api.example.com'],
          reportUri: '/csp-report'
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        customHeaders: {
          'X-Security-Version': '2.0',
          'X-Content-Security': 'enabled'
        }
      })
    ],
  },
  {
    method: 'POST',
    path: '/csp-report',
    handler: createRouteHandler(async (req: Request) => {
      const report = await req.json()
      console.log('CSP Violation Report:', report)
      
      // 这里可以记录到日志系统或数据库
      // logCSPViolation(report)
      
      return { 
        message: 'CSP report received',
        timestamp: new Date().toISOString()
      }
    })
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
  fetch: (req: Request) => server.fetch(req),
}

console.log('🚀 Vafast Security Headers API 服务器启动成功！')
console.log('🔒 基本安全: GET /basic')
console.log('🛡️ 标准安全: GET /standard')
console.log('⚡ 严格安全: GET /strict')
console.log('🎯 自定义安全: GET /custom')
console.log('📊 CSP 报告: POST /csp-report')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, createRouteHandler } from 'vafast'
import { vafastHelmet, permission } from '@vafast/helmet'

describe('Vafast Helmet Security Headers', () => {
  it('should add basic security headers', async () => {
    const helmet = vafastHelmet({
      frameOptions: 'DENY',
      xssProtection: true,
    })

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return { message: 'Hello World with Security Headers!' }
        }),
        middleware: [helmet],
      },
    ])

    const res = await app.fetch(new Request('http://localhost/'))
    
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('should add CSP headers', async () => {
    const helmet = vafastHelmet({
      csp: {
        defaultSrc: [permission.SELF],
        scriptSrc: [permission.SELF, permission.UNSAFE_INLINE],
        styleSrc: [permission.SELF, permission.UNSAFE_INLINE],
      },
    })

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return { message: 'Hello World!' }
        }),
        middleware: [helmet],
      },
    ])

    const res = await app.fetch(new Request('http://localhost/'))
    
    const csp = res.headers.get('Content-Security-Policy')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
  })

  it('should handle custom headers', async () => {
    const helmet = vafastHelmet({
      customHeaders: {
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value',
      },
    })

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return { message: 'Hello World!' }
        }),
        middleware: [helmet],
      },
    ])

    const res = await app.fetch(new Request('http://localhost/'))
    
    expect(res.headers.get('X-Custom-Header')).toBe('custom-value')
    expect(res.headers.get('X-Another-Header')).toBe('another-value')
  })

  it('should handle HSTS headers in production', async () => {
    // 模拟生产环境
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const helmet = vafastHelmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return { message: 'Hello World!' }
        }),
        middleware: [helmet],
      },
    ])

    const res = await app.fetch(new Request('http://localhost/'))
    
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload')

    // 恢复环境变量
    process.env.NODE_ENV = originalEnv
  })

  it('should handle nonce generation', async () => {
    const helmet = vafastHelmet({
      csp: {
        defaultSrc: [permission.SELF],
        scriptSrc: [permission.SELF],
        useNonce: true,
      },
    })

    const app = new Server([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return { message: 'Hello World!' }
        }),
        middleware: [helmet],
      },
    ])

    const res = await app.fetch(new Request('http://localhost/'))
    
    const csp = res.headers.get('Content-Security-Policy')
    const nonce = res.headers.get('X-Nonce')
    
    expect(csp).toContain("'nonce-")
    expect(nonce).toBeTruthy()
    expect(nonce?.length).toBeGreaterThan(10)
  })
})
```

## 特性

- ✅ **内容安全策略 (CSP)**: 防止 XSS 攻击和资源注入
- ✅ **HTTP 严格传输安全 (HSTS)**: 强制 HTTPS 连接
- ✅ **XSS 保护**: 启用浏览器内置的 XSS 保护
- ✅ **框架选项**: 防止点击劫持攻击
- ✅ **引用策略**: 控制引用信息的泄露
- ✅ **权限策略**: 限制浏览器功能的访问
- ✅ **跨域策略**: 控制跨域资源的访问
- ✅ **报告机制**: 支持 CSP 违规报告
- ✅ **Nonce 支持**: 安全的内联脚本和样式支持
- ✅ **性能优化**: 高效的头部分析和生成
- ✅ **类型安全**: 完整的 TypeScript 类型支持

## 最佳实践

### 1. 渐进式安全策略

```typescript
// 开发环境：宽松配置
const devHelmet = vafastHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
})

// 生产环境：严格配置
const prodHelmet = vafastHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    useNonce: true
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

### 2. CSP 监控和报告

```typescript
const monitoredHelmet = vafastHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    reportUri: '/csp-report',
    reportOnly: false // 生产环境设为 false
  },
  reportTo: [
    {
      group: 'csp-violations',
      maxAge: 86400,
      endpoints: [
        {
          url: 'https://reports.example.com/csp',
          priority: 1
        }
      ]
    }
  ]
})
```

### 3. 资源白名单管理

```typescript
const resourceHelmet = vafastHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    styleSrc: [
      "'self'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    connectSrc: [
      "'self'",
      'https://api.example.com',
      'wss://ws.example.com'
    ]
  }
})
```

### 4. 安全头部组合

```typescript
const comprehensiveHelmet = vafastHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"]
  },
  frameOptions: 'DENY',
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  dnsPrefetch: false,
  corp: 'same-origin',
  coop: 'same-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    'interest-cohort': [],
    payment: [],
    usb: []
  }
})
```

## 注意事项

1. **CSP 配置**: 过于严格的 CSP 可能会破坏现有功能，建议逐步收紧
2. **HSTS 设置**: 一旦启用 HSTS，很难撤销，确保 HTTPS 配置正确
3. **性能影响**: 安全头部会增加响应大小，但影响通常很小
4. **兼容性**: 某些安全头部在旧浏览器中可能不被支持
5. **测试**: 在生产环境部署前，充分测试安全配置

## 相关链接

- [Content Security Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTTP Strict Transport Security - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [X-Frame-Options - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [Referrer Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
- [Permissions Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)
- [Vafast 官方文档](https://vafast.dev)
