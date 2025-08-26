---
title: 响应处理 - Vafast 类型安全客户端
---

# 响应处理

Vafast 类型安全客户端提供了强大的响应处理能力，支持类型安全的响应数据、错误处理、状态码处理等多种功能。本章将详细介绍如何正确处理各种类型的响应。

## 📋 响应结构概述

Vafast 类型安全客户端的每个请求都会返回一个标准化的响应对象，包含以下属性：

```typescript
interface ApiResponse<T> {
  // 响应数据（成功时）
  data?: T
  
  // 错误信息（失败时）
  error?: ApiError
  
  // HTTP 状态码
  status: number
  
  // 响应头
  headers: Record<string, string>
  
  // 响应元数据
  metadata?: ResponseMetadata
}

interface ApiError {
  // 错误消息
  message: string
  
  // HTTP 状态码
  status: number
  
  // 错误类型
  type: 'network' | 'timeout' | 'validation' | 'server' | 'client'
  
  // 错误详情
  details?: any
  
  // 原始错误
  originalError?: Error
}

interface ResponseMetadata {
  // 请求开始时间
  startTime?: number
  
  // 响应时间
  duration?: number
  
  // 重试次数
  retryCount?: number
  
  // 缓存信息
  cache?: {
    hit: boolean
    key: string
    age: number
  }
}
```

## ✅ 成功响应处理

### 基本成功响应

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(({ params }) => ({
      id: params.id,
      name: 'John Doe',
      email: 'john@example.com'
    })),
    params: Type.Object({
      id: Type.String()
    })
  }
])

// 客户端处理成功响应
const response = await client.get('/users/:id', { id: '123' })

if (response.error) {
  // 处理错误
  console.error('Error:', response.error.message)
} else {
  // 处理成功响应
  const user = response.data
  console.log('User ID:', user.id)
  console.log('User Name:', user.name)
  console.log('User Email:', user.email)
  
  // 类型安全：TypeScript 知道 user 的类型
  // user.invalid // ❌ 编译时错误
}
```

### 类型化响应数据

```typescript
// 定义响应数据类型
interface User {
  id: string
  name: string
  email: string
  profile: {
    age: number
    location: string
  }
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createRouteHandler(({ query }) => {
      const { page = 1, limit = 10 } = query
      return {
        data: [
          { id: '1', name: 'John', email: 'john@example.com', profile: { age: 30, location: 'NY' } },
          { id: '2', name: 'Jane', email: 'jane@example.com', profile: { age: 25, location: 'CA' } }
        ],
        total: 2,
        page,
        limit
      }
    }),
    query: Type.Object({
      page: Type.Optional(Type.Number({ minimum: 1 })),
      limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
    })
  }
])

// 客户端使用类型化响应
const response = await client.get('/users', { page: 1, limit: 10 })

if (response.error) {
  console.error('Error:', response.error.message)
} else {
  // response.data 的类型自动推断为 PaginatedResponse<User>
  const users = response.data
  
  console.log('Total users:', users.total)
  console.log('Current page:', users.page)
  
  users.data.forEach(user => {
    console.log(`${user.name} (${user.email}) - ${user.profile.age} years old`)
  })
}
```

### 响应状态码处理

```typescript
const response = await client.get('/users/:id', { id: '123' })

// 检查 HTTP 状态码
switch (response.status) {
  case 200:
    console.log('Success:', response.data)
    break
    
  case 201:
    console.log('Created:', response.data)
    break
    
  case 204:
    console.log('No content')
    break
    
  default:
    console.log('Other status:', response.status)
}
```

## ❌ 错误响应处理

### 基本错误处理

```typescript
try {
  const response = await client.get('/users/:id', { id: 'invalid' })
  
  if (response.error) {
    // 处理 API 错误
    switch (response.error.type) {
      case 'validation':
        console.error('Validation error:', response.error.details)
        break
        
      case 'server':
        console.error('Server error:', response.error.message)
        break
        
      case 'client':
        console.error('Client error:', response.error.message)
        break
        
      case 'network':
        console.error('Network error:', response.error.message)
        break
        
      case 'timeout':
        console.error('Request timeout')
        break
        
      default:
        console.error('Unknown error:', response.error.message)
    }
  }
} catch (error) {
  // 处理网络或其他异常
  console.error('Unexpected error:', error)
}
```

### 错误类型详解

#### 验证错误 (Validation Error)

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => `Created user: ${body.name}`),
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      email: Type.String({ format: 'email' })
    })
  }
])

// 客户端发送无效数据
const response = await client.post('/users', {
  name: '', // ❌ 太短
  email: 'invalid-email' // ❌ 格式错误
})

if (response.error && response.error.type === 'validation') {
  console.error('Validation failed:')
  console.error('Details:', response.error.details)
  
  // 显示用户友好的错误消息
  if (response.error.details?.name) {
    showFieldError('name', response.error.details.name)
  }
  
  if (response.error.details?.email) {
    showFieldError('email', response.error.details.email)
  }
}
```

#### 服务器错误 (Server Error)

```typescript
const response = await client.get('/users/:id', { id: '123' })

if (response.error && response.error.type === 'server') {
  switch (response.error.status) {
    case 500:
      console.error('Internal server error')
      showErrorMessage('服务器内部错误，请稍后重试')
      break
      
    case 502:
      console.error('Bad gateway')
      showErrorMessage('网关错误，请稍后重试')
      break
      
    case 503:
      console.error('Service unavailable')
      showErrorMessage('服务暂时不可用，请稍后重试')
      break
      
    case 504:
      console.error('Gateway timeout')
      showErrorMessage('网关超时，请稍后重试')
      break
      
    default:
      console.error('Server error:', response.error.message)
      showErrorMessage('服务器错误，请稍后重试')
  }
}
```

#### 客户端错误 (Client Error)

```typescript
const response = await client.get('/users/:id', { id: '123' })

if (response.error && response.error.type === 'client') {
  switch (response.error.status) {
    case 400:
      console.error('Bad request:', response.error.details)
      showErrorMessage('请求参数错误，请检查输入')
      break
      
    case 401:
      console.error('Unauthorized')
      // 重定向到登录页面
      window.location.href = '/login'
      break
      
    case 403:
      console.error('Forbidden')
      showErrorMessage('权限不足，无法访问此资源')
      break
      
    case 404:
      console.error('Not found')
      showErrorMessage('请求的资源不存在')
      break
      
    case 409:
      console.error('Conflict:', response.error.details)
      showErrorMessage('资源冲突，请检查数据')
      break
      
    case 422:
      console.error('Unprocessable entity:', response.error.details)
      showErrorMessage('无法处理的请求，请检查数据')
      break
      
    case 429:
      console.error('Too many requests')
      showErrorMessage('请求过于频繁，请稍后重试')
      break
      
    default:
      console.error('Client error:', response.error.message)
      showErrorMessage('客户端错误，请检查请求')
  }
}
```

#### 网络错误 (Network Error)

```typescript
const response = await client.get('/users/:id', { id: '123' })

if (response.error && response.error.type === 'network') {
  console.error('Network error:', response.error.message)
  
  // 检查网络连接
  if (!navigator.onLine) {
    showErrorMessage('网络连接已断开，请检查网络设置')
  } else {
    showErrorMessage('网络请求失败，请检查网络连接')
  }
  
  // 尝试重新连接
  setTimeout(() => {
    retryRequest()
  }, 5000)
}
```

#### 超时错误 (Timeout Error)

```typescript
const response = await client.get('/users/:id', { id: '123' })

if (response.error && response.error.type === 'timeout') {
  console.error('Request timeout')
  showErrorMessage('请求超时，请稍后重试')
  
  // 自动重试
  if (response.metadata?.retryCount < 3) {
    console.log('Retrying request...')
    setTimeout(() => {
      retryRequest()
    }, 1000)
  }
}
```

## 🔄 响应拦截器

### 响应中间件

```typescript
import { createTypedClient } from '@vafast/api-client'
import type { App } from './server'

const client = createTypedClient<App>('http://localhost:3000', {
  // 响应拦截器
  responseInterceptors: [
    async (response, next) => {
      // 记录响应时间
      if (response.metadata?.startTime) {
        const duration = Date.now() - response.metadata.startTime
        console.log(`Request completed in ${duration}ms`)
      }
      
      // 处理特定状态码
      if (response.status === 401) {
        // 清除无效的认证信息
        localStorage.removeItem('token')
        window.location.href = '/login'
        return response
      }
      
      // 处理 5xx 错误
      if (response.status >= 500) {
        // 记录服务器错误
        logServerError(response)
        
        // 显示用户友好的错误消息
        showServerErrorMessage()
      }
      
      return await next(response)
    },
    
    async (response, next) => {
      // 数据转换
      if (response.data && typeof response.data === 'object') {
        // 转换日期字符串为 Date 对象
        response.data = transformDates(response.data)
      }
      
      return await next(response)
    }
  ]
})
```

### 自定义响应处理

```typescript
// 自定义响应处理器
const customResponseHandler = async (response: ApiResponse<any>) => {
  // 处理成功响应
  if (response.data) {
    // 数据标准化
    const normalizedData = normalizeResponseData(response.data)
    
    // 缓存响应数据
    if (response.metadata?.cache?.hit === false) {
      cacheResponseData(response.url, normalizedData)
    }
    
    return normalizedData
  }
  
  // 处理错误响应
  if (response.error) {
    // 错误分类
    const errorCategory = categorizeError(response.error)
    
    // 错误报告
    reportError(errorCategory, response.error)
    
    // 错误恢复
    const recoveredData = await attemptErrorRecovery(response.error)
    if (recoveredData) {
      return recoveredData
    }
    
    // 抛出错误
    throw new ApiError(response.error.message, response.error.status)
  }
  
  return null
}

// 使用自定义响应处理器
const response = await client.get('/users/:id', { id: '123' })
const result = await customResponseHandler(response)
```

## 📊 响应数据转换

### 数据标准化

```typescript
// 响应数据标准化
const normalizeResponseData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(normalizeResponseData)
  }
  
  if (data && typeof data === 'object') {
    const normalized: any = {}
    
    for (const [key, value] of Object.entries(data)) {
      // 转换蛇形命名法为驼峰命名法
      const camelKey = snakeToCamel(key)
      
      // 递归处理嵌套对象
      normalized[camelKey] = normalizeResponseData(value)
    }
    
    return normalized
  }
  
  return data
}

// 使用示例
const response = await client.get('/users/:id', { id: '123' })

if (response.data) {
  // 原始数据：{ user_name: "John Doe", created_at: "2024-01-01" }
  const normalizedData = normalizeResponseData(response.data)
  // 标准化后：{ userName: "John Doe", createdAt: "2024-01-01" }
  
  console.log(normalizedData.userName)
  console.log(normalizedData.createdAt)
}
```

### 日期转换

```typescript
// 日期转换器
const transformDates = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(transformDates)
  }
  
  if (data && typeof data === 'object') {
    const transformed: any = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && isDateString(value)) {
        // 转换日期字符串为 Date 对象
        transformed[key] = new Date(value)
      } else if (typeof value === 'object') {
        // 递归处理嵌套对象
        transformed[key] = transformDates(value)
      } else {
        transformed[key] = value
      }
    }
    
    return transformed
  }
  
  return data
}

// 使用示例
const response = await client.get('/users/:id', { id: '123' })

if (response.data) {
  // 原始数据：{ createdAt: "2024-01-01T00:00:00.000Z" }
  const transformedData = transformDates(response.data)
  // 转换后：{ createdAt: Date object }
  
  console.log(transformedData.createdAt instanceof Date) // true
  console.log(transformedData.createdAt.toLocaleDateString()) // "1/1/2024"
}
```

## 🎛️ 响应配置

### 响应类型配置

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  // 响应配置
  response: {
    // 自动解析 JSON
    autoParseJson: true,
    
    // 响应超时
    timeout: 30000,
    
    // 响应大小限制
    maxSize: 10 * 1024 * 1024, // 10MB
    
    // 响应验证
    validate: true,
    
    // 响应缓存
    cache: {
      enabled: true,
      maxAge: 300000, // 5分钟
      maxSize: 100 // 最多缓存100个响应
    }
  }
})
```

### 响应头处理

```typescript
const response = await client.get('/users/:id', { id: '123' })

// 获取响应头
const contentType = response.headers['content-type']
const contentLength = response.headers['content-length']
const cacheControl = response.headers['cache-control']

// 检查响应类型
if (contentType?.includes('application/json')) {
  // 处理 JSON 响应
  const data = response.data
} else if (contentType?.includes('text/')) {
  // 处理文本响应
  const text = response.data
} else if (contentType?.includes('image/')) {
  // 处理图片响应
  const imageBlob = response.data
}

// 检查缓存控制
if (cacheControl?.includes('no-cache')) {
  // 不使用缓存
  console.log('Response should not be cached')
} else if (cacheControl?.includes('max-age=')) {
  // 解析缓存时间
  const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '0')
  console.log(`Response can be cached for ${maxAge} seconds`)
}
```

## 🔍 响应调试

### 启用响应日志

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  logging: {
    enabled: true,
    level: 'debug',
    
    // 响应日志配置
    response: {
      enabled: true,
      includeHeaders: true,
      includeBody: true,
      includeMetadata: true
    }
  }
})

// 响应会被自动记录
const response = await client.get('/users/:id', { id: '123' })
```

### 响应性能分析

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  monitoring: {
    enabled: true,
    
    // 响应性能指标
    metrics: {
      responseTime: true,
      responseSize: true,
      statusCodeDistribution: true
    }
  }
})

// 获取响应性能统计
const stats = client.getResponseStats()
console.log('Average response time:', stats.averageResponseTime)
console.log('Response size distribution:', stats.responseSizeDistribution)
console.log('Status code distribution:', stats.statusCodeDistribution)
```

## 📝 响应最佳实践

### 1. 错误处理
- 始终检查 `response.error` 的存在
- 根据错误类型采取不同的处理策略
- 提供用户友好的错误消息

### 2. 类型安全
- 使用 TypeScript 类型定义响应数据
- 避免使用 `any` 类型
- 利用类型推断减少类型错误

### 3. 性能优化
- 使用响应缓存减少重复请求
- 监控响应时间识别性能问题
- 实现适当的错误重试机制

### 4. 用户体验
- 显示加载状态
- 提供错误恢复选项
- 实现优雅的降级策略

### 5. 安全性
- 验证响应数据的完整性
- 防止 XSS 攻击
- 安全地处理敏感信息

## 🔗 相关链接

- [类型安全客户端概述](/api-client/treaty/overview) - 了解基本概念
- [配置选项](/api-client/treaty/config) - 学习响应配置
- [参数处理](/api-client/treaty/parameters) - 了解请求参数
- [WebSocket 支持](/api-client/treaty/websocket) - 处理实时响应
- [单元测试](/api-client/treaty/unit-test) - 测试响应处理

## 📚 下一步

现在您已经了解了 Vafast 类型安全客户端的响应处理，接下来可以：

1. **配置 WebSocket** - 处理实时通信响应
2. **编写测试** - 验证响应处理的正确性
3. **性能优化** - 优化响应处理性能
4. **错误处理** - 完善错误处理策略
5. **监控告警** - 实现响应监控系统

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast) 或 [社区页面](/community)。