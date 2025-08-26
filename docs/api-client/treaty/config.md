---
title: 配置选项 - Vafast 类型安全客户端
head:
  - - meta
    - property: 'og:title'
      content: 配置选项 - Vafast 类型安全客户端

  - - meta
    - name: 'description'
      content: 了解 Vafast 类型安全客户端的所有配置选项，包括基础配置、高级配置和自定义配置。

  - - meta
    - property: 'og:description'
      content: 了解 Vafast 类型安全客户端的所有配置选项，包括基础配置、高级配置和自定义配置。
---

# 配置选项

Vafast 类型安全客户端提供了丰富的配置选项，让您能够根据项目需求进行精确的定制。本章将详细介绍所有可用的配置选项。

## 🔧 基础配置

### 创建客户端时的配置

```typescript
import { createTypedClient } from '@vafast/api-client'
import type { App } from './server'

const client = createTypedClient<App>('http://localhost:3000', {
  // 基础配置
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  
  // 请求配置
  defaultHeaders: {
    'Content-Type': 'application/json',
    'User-Agent': 'Vafast-API-Client/1.0.0'
  },
  
  // 缓存配置
  enableCache: true,
  cacheExpiry: 300000,
  
  // 重试配置
  retryDelay: 1000,
  retryCondition: (error) => error.status >= 500
})
```

### 配置选项详解

#### 基础选项

```typescript
interface BaseConfig {
  // 基础 URL，所有请求都会基于此 URL
  baseURL?: string
  
  // 请求超时时间（毫秒）
  timeout?: number
  
  // 最大重试次数
  retries?: number
  
  // 重试延迟时间（毫秒）
  retryDelay?: number
  
  // 是否启用缓存
  enableCache?: boolean
  
  // 缓存过期时间（毫秒）
  cacheExpiry?: number
  
  // 缓存策略
  cacheStrategy?: 'memory' | 'localStorage' | 'sessionStorage'
}
```

#### 请求选项

```typescript
interface RequestConfig {
  // 默认请求头
  defaultHeaders?: Record<string, string>
  
  // 请求拦截器
  requestInterceptors?: RequestInterceptor[]
  
  // 响应拦截器
  responseInterceptors?: ResponseInterceptor[]
  
  // 错误处理器
  errorHandler?: ErrorHandler
  
  // 日志配置
  logging?: LoggingConfig
}
```

#### 重试选项

```typescript
interface RetryConfig {
  // 重试条件函数
  retryCondition?: (error: ApiError, attempt: number) => boolean
  
  // 自定义重试延迟函数
  retryDelay?: (attempt: number) => number
  
  // 最大重试次数
  maxRetries?: number
  
  // 重试状态码
  retryStatusCodes?: number[]
}
```

## 🎛️ 高级配置

### 中间件配置

```typescript
import { createTypedClient } from '@vafast/api-client'
import type { App } from './server'

const client = createTypedClient<App>('http://localhost:3000', {
  // 请求中间件
  requestInterceptors: [
    async (config, next) => {
      // 添加认证头
      if (localStorage.getItem('token')) {
        config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
      }
      
      // 添加请求 ID
      config.headers['X-Request-ID'] = `req-${Date.now()}`
      
      return await next(config)
    },
    
    async (config, next) => {
      // 记录请求开始时间
      config.metadata = { startTime: Date.now() }
      
      return await next(config)
    }
  ],
  
  // 响应中间件
  responseInterceptors: [
    async (response, next) => {
      // 记录响应时间
      if (response.metadata?.startTime) {
        const duration = Date.now() - response.metadata.startTime
        console.log(`Request completed in ${duration}ms`)
      }
      
      return await next(response)
    },
    
    async (response, next) => {
      // 处理特定状态码
      if (response.status === 401) {
        // 清除无效的认证信息
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      return await next(response)
    }
  ]
})
```

### 缓存配置

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 启用缓存
  enableCache: true,
  
  // 缓存过期时间（5分钟）
  cacheExpiry: 300000,
  
  // 缓存策略
  cacheStrategy: 'memory', // 'memory' | 'localStorage' | 'sessionStorage'
  
  // 自定义缓存键生成器
  cacheKeyGenerator: (config) => {
    const { method, url, params, query } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(query)}`
  },
  
  // 缓存验证器
  cacheValidator: (cachedData) => {
    // 检查缓存数据是否仍然有效
    return cachedData && Date.now() - cachedData.timestamp < 300000
  }
})
```

### 重试配置

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 重试配置
  retries: 5,
  retryDelay: 1000,
  
  // 自定义重试条件
  retryCondition: (error, attempt) => {
    // 只在特定错误时重试
    if (attempt >= 5) return false
    
    // 重试 5xx 错误和网络错误
    if (error.status >= 500) return true
    
    // 重试 429 错误（限流）
    if (error.status === 429) return true
    
    // 重试网络错误
    if (error.type === 'network') return true
    
    return false
  },
  
  // 指数退避重试延迟
  retryDelay: (attempt) => {
    const baseDelay = 1000
    const maxDelay = 10000
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    
    // 添加随机抖动
    const jitter = Math.random() * 0.1 * delay
    
    return delay + jitter
  }
})
```

### 日志配置

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 日志配置
  logging: {
    enabled: true,
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    format: 'json', // 'json' | 'text'
    
    // 自定义日志记录器
    logger: {
      debug: (message, data) => console.debug(`[DEBUG] ${message}`, data),
      info: (message, data) => console.info(`[INFO] ${message}`, data),
      warn: (message, data) => console.warn(`[WARN] ${message}`, data),
      error: (message, data) => console.error(`[ERROR] ${message}`, data)
    },
    
    // 日志过滤器
    filter: (level, message, data) => {
      // 在生产环境中过滤敏感信息
      if (process.env.NODE_ENV === 'production') {
        if (data?.headers?.Authorization) {
          data.headers.Authorization = '[REDACTED]'
        }
      }
      return true
    }
  }
})
```

## 🔐 安全配置

### 认证配置

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 认证配置
  auth: {
    // 自动添加认证头
    autoAuth: true,
    
    // 认证头格式
    authHeader: 'Authorization',
    authFormat: 'Bearer {token}',
    
    // 获取认证信息
    getToken: () => localStorage.getItem('token'),
    
    // 刷新认证信息
    refreshToken: async () => {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')
      
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      
      if (!response.ok) throw new Error('Failed to refresh token')
      
      const { token, refreshToken: newRefreshToken } = await response.json()
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', newRefreshToken)
      
      return token
    },
    
    // 认证失败处理
    onAuthFailure: (error) => {
      if (error.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
  }
})
```

### CORS 配置

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // CORS 配置
  cors: {
    // 允许的源
    allowedOrigins: ['http://localhost:3000', 'https://example.com'],
    
    // 允许的请求方法
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    
    // 允许的请求头
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    
    // 是否允许携带认证信息
    allowCredentials: true,
    
    // 预检请求缓存时间
    maxAge: 86400
  }
})
```

## 🌍 环境配置

### 多环境配置

```typescript
// config/environments.ts
interface EnvironmentConfig {
  development: ClientConfig
  staging: ClientConfig
  production: ClientConfig
}

const environments: EnvironmentConfig = {
  development: {
    baseURL: 'http://localhost:3000',
    timeout: 5000,
    retries: 1,
    enableCache: false,
    logging: { enabled: true, level: 'debug' }
  },
  
  staging: {
    baseURL: 'https://staging-api.example.com',
    timeout: 10000,
    retries: 3,
    enableCache: true,
    cacheExpiry: 300000,
    logging: { enabled: true, level: 'info' }
  },
  
  production: {
    baseURL: 'https://api.example.com',
    timeout: 15000,
    retries: 5,
    enableCache: true,
    cacheExpiry: 600000,
    logging: { enabled: false }
  }
}

// 根据环境变量选择配置
const env = process.env.NODE_ENV || 'development'
const config = environments[env as keyof EnvironmentConfig]

// 创建客户端
const client = createTypedClient<App>('', config)
```

### 动态配置更新

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  baseURL: 'https://api.example.com',
  timeout: 10000
})

// 动态更新配置
client.updateConfig({
  timeout: 15000,
  retries: 5
})

// 更新基础 URL
client.updateConfig({
  baseURL: 'https://new-api.example.com'
})

// 启用缓存
client.updateConfig({
  enableCache: true,
  cacheExpiry: 300000
})
```

## 🔧 自定义配置

### 自定义拦截器

```typescript
// 自定义请求拦截器
const customRequestInterceptor: RequestInterceptor = async (config, next) => {
  // 添加时间戳
  config.headers['X-Timestamp'] = Date.now().toString()
  
  // 添加请求签名
  const signature = generateSignature(config)
  config.headers['X-Signature'] = signature
  
  return await next(config)
}

// 自定义响应拦截器
const customResponseInterceptor: ResponseInterceptor = async (response, next) => {
  // 验证响应签名
  const expectedSignature = generateSignature(response)
  const actualSignature = response.headers.get('X-Signature')
  
  if (expectedSignature !== actualSignature) {
    throw new Error('Invalid response signature')
  }
  
  return await next(response)
}

// 使用自定义拦截器
const client = createTypedClient<App>('http://localhost:3000', {
  requestInterceptors: [customRequestInterceptor],
  responseInterceptors: [customResponseInterceptor]
})
```

### 自定义错误处理器

```typescript
// 自定义错误处理器
const customErrorHandler: ErrorHandler = (error, request) => {
  // 记录错误
  console.error('API Error:', {
    message: error.message,
    status: error.status,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  })
  
  // 发送错误报告
  if (process.env.NODE_ENV === 'production') {
    sendErrorReport(error, request)
  }
  
  // 根据错误类型采取不同措施
  switch (error.status) {
    case 401:
      // 重定向到登录页面
      window.location.href = '/login'
      break
      
    case 403:
      // 显示权限不足提示
      showPermissionDeniedMessage()
      break
      
    case 429:
      // 显示限流提示
      showRateLimitMessage()
      break
      
    case 500:
      // 显示服务器错误提示
      showServerErrorMessage()
      break
      
    default:
      // 显示通用错误提示
      showErrorMessage(error.message)
  }
}

// 使用自定义错误处理器
const client = createTypedClient<App>('http://localhost:3000', {
  errorHandler: customErrorHandler
})
```

## 📊 监控配置

### 性能监控

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 启用性能监控
  monitoring: {
    enabled: true,
    
    // 性能指标收集
    metrics: {
      responseTime: true,
      requestSize: true,
      responseSize: true,
      errorRate: true,
      throughput: true
    },
    
    // 性能阈值
    thresholds: {
      responseTime: 5000, // 5秒
      errorRate: 0.05,   // 5%
      throughput: 100    // 100 req/s
    },
    
    // 性能报告
    reporting: {
      interval: 60000, // 每分钟报告一次
      destination: 'https://metrics.example.com/api/metrics'
    }
  }
})
```

### 健康检查

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 健康检查配置
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    interval: 30000, // 30秒检查一次
    
    // 健康检查条件
    conditions: {
      responseTime: (time) => time < 1000,
      statusCode: (status) => status === 200,
      responseBody: (body) => body.status === 'healthy'
    },
    
    // 健康检查失败处理
    onFailure: (error) => {
      console.warn('Health check failed:', error)
      // 可以在这里实现故障转移逻辑
    }
  }
})
```

## 🔍 调试配置

### 开发环境调试

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 开发环境调试配置
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    
    // 请求日志
    logRequests: true,
    logResponses: true,
    logErrors: true,
    
    // 性能分析
    profile: true,
    
    // 类型检查
    typeCheck: true,
    
    // 调试工具
    devTools: {
      enabled: true,
      port: 9229
    }
  }
})
```

### 调试工具集成

```typescript
// 启用调试工具
if (process.env.NODE_ENV === 'development') {
  // 在浏览器中打开调试工具
  client.debug.openDevTools()
  
  // 监听所有请求
  client.debug.on('request', (config) => {
    console.group('🚀 API Request')
    console.log('URL:', config.url)
    console.log('Method:', config.method)
    console.log('Headers:', config.headers)
    console.log('Body:', config.body)
    console.groupEnd()
  })
  
  // 监听所有响应
  client.debug.on('response', (response) => {
    console.group('✅ API Response')
    console.log('Status:', response.status)
    console.log('Headers:', response.headers)
    console.log('Data:', response.data)
    console.log('Time:', response.metadata?.duration)
    console.groupEnd()
  })
  
  // 监听所有错误
  client.debug.on('error', (error) => {
    console.group('❌ API Error')
    console.error('Message:', error.message)
    console.error('Status:', error.status)
    console.error('Details:', error.details)
    console.groupEnd()
  })
}
```

## 📚 配置最佳实践

### 1. 环境分离
- 为不同环境创建不同的配置文件
- 使用环境变量控制配置
- 避免在代码中硬编码配置值

### 2. 配置验证
- 验证配置选项的有效性
- 提供配置选项的默认值
- 在运行时检查必需的配置

### 3. 性能优化
- 根据使用场景调整缓存策略
- 优化重试策略减少不必要的重试
- 监控性能指标并调整配置

### 4. 安全考虑
- 在生产环境中禁用详细日志
- 使用 HTTPS 进行安全通信
- 实现适当的认证和授权

### 5. 错误处理
- 提供有意义的错误消息
- 实现优雅的降级策略
- 记录和监控错误情况

## 🔗 相关链接

- [类型安全客户端概述](/api-client/treaty/overview) - 了解基本概念
- [参数处理](/api-client/treaty/parameters) - 学习参数配置
- [响应处理](/api-client/treaty/response) - 了解响应配置
- [WebSocket 支持](/api-client/treaty/websocket) - 配置实时通信
- [单元测试](/api-client/treaty/unit-test) - 测试配置选项

## 📚 下一步

现在您已经了解了 Vafast 类型安全客户端的所有配置选项，接下来可以：

1. **学习参数处理** - 了解如何配置请求参数
2. **探索响应处理** - 学习响应配置选项
3. **配置 WebSocket** - 设置实时通信
4. **编写测试** - 验证配置的正确性
5. **性能调优** - 根据实际需求优化配置

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast) 或 [社区页面](/community)。
