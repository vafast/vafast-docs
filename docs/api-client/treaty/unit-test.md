---
title: 单元测试 - Vafast 类型安全客户端
head:
  - - meta
    - property: 'og:title'
      content: 单元测试 - Vafast 类型安全客户端

  - - meta
    - name: 'description'
      content: 学习如何为 Vafast 类型安全客户端编写单元测试，包括测试策略、测试工具、测试用例等。

  - - meta
    - property: 'og:description'
      content: 学习如何为 Vafast 类型安全客户端编写单元测试，包括测试策略、测试工具、测试用例等。
---

# 单元测试

单元测试是确保代码质量的关键部分。Vafast 类型安全客户端提供了完整的测试支持，让您能够轻松地测试各种功能和场景。本章将详细介绍如何编写有效的单元测试。

## 🧪 测试环境设置

### 安装测试依赖

```bash
# 使用 Bun（推荐）
bun add -d bun @types/node

# 使用 npm
npm install -D jest @types/jest ts-jest

# 使用 yarn
yarn add -D jest @types/jest ts-jest

# 使用 pnpm
pnpm add -D jest @types/jest ts-jest
```

### 测试配置文件

```typescript
// test/setup.ts
import { beforeAll, afterAll } from 'bun:test'

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.API_BASE_URL = 'http://localhost:3000'

// 全局测试设置
beforeAll(() => {
  console.log('Setting up test environment...')
})

afterAll(() => {
  console.log('Cleaning up test environment...')
})
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
}
```

## 🔧 基础测试

### 客户端实例测试

```typescript
// test/client.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Typed Client', () => {
  let client: any
  
  beforeEach(() => {
    client = createTypedClient<App>('http://localhost:3000', {
      timeout: 5000,
      retries: 1
    })
  })
  
  it('should create client instance', () => {
    expect(client).toBeDefined()
    expect(typeof client.get).toBe('function')
    expect(typeof client.post).toBe('function')
    expect(typeof client.put).toBe('function')
    expect(typeof client.delete).toBe('function')
  })
  
  it('should have correct configuration', () => {
    const config = client.getConfig()
    expect(config.baseURL).toBe('http://localhost:3000')
    expect(config.timeout).toBe(5000)
    expect(config.retries).toBe(1)
  })
  
  it('should update configuration', () => {
    client.updateConfig({ timeout: 10000 })
    const config = client.getConfig()
    expect(config.timeout).toBe(10000)
  })
})
```

### HTTP 方法测试

```typescript
// test/http-methods.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('HTTP Methods', () => {
  let client: any
  
  beforeEach(() => {
    client = createTypedClient<App>('http://localhost:3000')
  })
  
  describe('GET', () => {
    it('should make GET request successfully', async () => {
      const response = await client.get('/users')
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
      expect(response.status).toBe(200)
    })
    
    it('should handle query parameters', async () => {
      const response = await client.get('/users', {
        page: 1,
        limit: 5
      })
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
    })
    
    it('should handle path parameters', async () => {
      const response = await client.get('/users/:id', { id: '123' })
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
    })
  })
  
  describe('POST', () => {
    it('should make POST request successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      }
      
      const response = await client.post('/users', userData)
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
    })
    
    it('should validate request body', async () => {
      const invalidData = {
        name: '', // 空字符串，应该验证失败
        email: 'invalid-email' // 无效邮箱格式
      }
      
      const response = await client.post('/users', invalidData)
      
      expect(response.error).toBeDefined()
      expect(response.error?.type).toBe('validation')
    })
  })
  
  describe('PUT', () => {
    it('should make PUT request successfully', async () => {
      const updateData = {
        name: 'John Updated'
      }
      
      const response = await client.put('/users/:id', updateData, { id: '123' })
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
    })
  })
  
  describe('DELETE', () => {
    it('should make DELETE request successfully', async () => {
      const response = await client.delete('/users/:id', { id: '123' })
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
    })
  })
})
```

## 🚨 错误处理测试

### 网络错误测试

```typescript
// test/error-handling.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Error Handling', () => {
  let client: any
  
  beforeEach(() => {
    client = createTypedClient<App>('http://invalid-domain-that-does-not-exist.com', {
      timeout: 1000
    })
  })
  
  it('should handle network errors', async () => {
    const response = await client.get('/test')
    
    expect(response.error).toBeDefined()
    expect(response.error?.type).toBe('network')
    expect(response.data).toBeUndefined()
  })
  
  it('should handle timeout errors', async () => {
    const response = await client.get('/test')
    
    expect(response.error).toBeDefined()
    expect(response.error?.type).toBe('timeout')
  })
  
  it('should handle 404 errors', async () => {
    // 使用有效的域名但无效的路径
    client.updateConfig({ baseURL: 'http://localhost:3000' })
    
    const response = await client.get('/nonexistent')
    
    expect(response.error).toBeDefined()
    expect(response.error?.status).toBe(404)
  })
  
  it('should handle 500 errors', async () => {
    // 模拟服务器错误
    const mockServer = createTypedClient<App>('https://httpstat.us')
    
    const response = await mockServer.get('/500')
    
    expect(response.error).toBeDefined()
    expect(response.error?.status).toBe(500)
  })
})
```

### 验证错误测试

```typescript
// test/validation.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Validation', () => {
  let client: any
  
  beforeEach(() => {
    client = createTypedClient<App>('http://localhost:3000')
  })
  
  it('should validate required fields', async () => {
    const response = await client.post('/users', {
      // 缺少必需的 name 字段
      email: 'john@example.com'
    })
    
    expect(response.error).toBeDefined()
    expect(response.error?.type).toBe('validation')
    expect(response.error?.details?.name).toBeDefined()
  })
  
  it('should validate field types', async () => {
    const response = await client.post('/users', {
      name: 123, // 应该是字符串
      email: 'john@example.com'
    })
    
    expect(response.error).toBeDefined()
    expect(response.error?.type).toBe('validation')
    expect(response.error?.details?.name).toBeDefined()
  })
  
  it('should validate field formats', async () => {
    const response = await client.post('/users', {
      name: 'John Doe',
      email: 'invalid-email' // 无效邮箱格式
    })
    
    expect(response.error).toBeDefined()
    expect(response.error?.type).toBe('validation')
    expect(response.error?.details?.email).toBeDefined()
  })
  
  it('should validate field constraints', async () => {
    const response = await client.post('/users', {
      name: '', // 太短
      email: 'john@example.com'
    })
    
    expect(response.error).toBeDefined()
    expect(response.error?.type).toBe('validation')
    expect(response.error?.details?.name).toBeDefined()
  })
})
```

## 🔄 中间件测试

### 请求中间件测试

```typescript
// test/middleware.test.ts
import { describe, expect, it, beforeEach, jest } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Middleware', () => {
  let client: any
  let mockRequestInterceptor: jest.Mock
  let mockResponseInterceptor: jest.Mock
  
  beforeEach(() => {
    mockRequestInterceptor = jest.fn()
    mockResponseInterceptor = jest.fn()
    
    client = createTypedClient<App>('http://localhost:3000', {
      requestInterceptors: [
        async (config, next) => {
          mockRequestInterceptor(config)
          return await next(config)
        }
      ],
      responseInterceptors: [
        async (response, next) => {
          mockResponseInterceptor(response)
          return await next(response)
        }
      ]
    })
  })
  
  it('should execute request middleware', async () => {
    await client.get('/users')
    
    expect(mockRequestInterceptor).toHaveBeenCalled()
    expect(mockRequestInterceptor.mock.calls[0][0]).toHaveProperty('url')
    expect(mockRequestInterceptor.mock.calls[0][0]).toHaveProperty('method')
  })
  
  it('should execute response middleware', async () => {
    await client.get('/users')
    
    expect(mockResponseInterceptor).toHaveBeenCalled()
    expect(mockResponseInterceptor.mock.calls[0][0]).toHaveProperty('data')
    expect(mockResponseInterceptor.mock.calls[0][0]).toHaveProperty('status')
  })
  
  it('should modify request in middleware', async () => {
    const customClient = createTypedClient<App>('http://localhost:3000', {
      requestInterceptors: [
        async (config, next) => {
          // 添加自定义头
          config.headers['X-Custom-Header'] = 'test-value'
          return await next(config)
        }
      ]
    })
    
    const response = await customClient.get('/users')
    
    expect(response.error).toBeUndefined()
    // 注意：这里我们无法直接验证请求头，但可以验证请求成功
  })
  
  it('should handle middleware errors', async () => {
    const errorClient = createTypedClient<App>('http://localhost:3000', {
      requestInterceptors: [
        async (config, next) => {
          throw new Error('Middleware error')
        }
      ]
    })
    
    const response = await errorClient.get('/users')
    
    expect(response.error).toBeDefined()
    expect(response.error?.message).toBe('Middleware error')
  })
})
```

## 💾 缓存测试

### 缓存功能测试

```typescript
// test/cache.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Cache', () => {
  let client: any
  
  beforeEach(() => {
    client = createTypedClient<App>('http://localhost:3000', {
      enableCache: true,
      cacheExpiry: 1000 // 1秒
    })
  })
  
  it('should cache responses', async () => {
    const startTime = Date.now()
    
    // 第一次请求
    const response1 = await client.get('/users')
    const firstRequestTime = Date.now() - startTime
    
    expect(response1.error).toBeUndefined()
    expect(response1.data).toBeDefined()
    
    // 第二次请求（应该使用缓存）
    const response2 = await client.get('/users')
    const secondRequestTime = Date.now() - startTime
    
    expect(response2.error).toBeUndefined()
    expect(response2.data).toEqual(response1.data)
    
    // 第二次请求应该更快（使用缓存）
    expect(secondRequestTime).toBeLessThan(firstRequestTime + 100)
  })
  
  it('should respect cache expiry', async () => {
    // 第一次请求
    await client.get('/users')
    
    // 等待缓存过期
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    // 第二次请求（缓存已过期）
    const response = await client.get('/users')
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
  })
  
  it('should clear cache', async () => {
    // 第一次请求
    await client.get('/users')
    
    // 清除缓存
    client.clearCache('/users')
    
    // 第二次请求（缓存已清除）
    const response = await client.get('/users')
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
  })
  
  it('should handle cache control headers', async () => {
    // 强制不使用缓存
    const response1 = await client.get('/users', {}, {
      cache: 'no-cache'
    })
    
    expect(response1.error).toBeUndefined()
    
    // 强制使用缓存
    const response2 = await client.get('/users', {}, {
      cache: 'force-cache'
    })
    
    expect(response2.error).toBeUndefined()
  })
})
```

## 🔄 重试机制测试

### 重试功能测试

```typescript
// test/retry.test.ts
import { describe, expect, it, beforeEach, jest } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Retry Mechanism', () => {
  let client: any
  let mockFetch: jest.Mock
  
  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch
    
    client = createTypedClient<App>('http://localhost:3000', {
      retries: 3,
      retryDelay: 100
    })
  })
  
  it('should retry failed requests', async () => {
    // 模拟前两次失败，第三次成功
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      })
    
    const response = await client.get('/test')
    
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(response.error).toBeUndefined()
    expect(response.data).toEqual({ success: true })
  })
  
  it('should respect retry limit', async () => {
    // 模拟所有请求都失败
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    const response = await client.get('/test')
    
    expect(mockFetch).toHaveBeenCalledTimes(4) // 初始请求 + 3次重试
    expect(response.error).toBeDefined()
    expect(response.error?.type).toBe('network')
  })
  
  it('should use custom retry condition', async () => {
    client = createTypedClient<App>('http://localhost:3000', {
      retries: 2,
      retryCondition: (error) => {
        // 只在特定错误时重试
        return error.status === 429
      }
    })
    
    // 模拟 400 错误（不应该重试）
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' })
    })
    
    const response = await client.get('/test')
    
    expect(mockFetch).toHaveBeenCalledTimes(1) // 不应该重试
    expect(response.error?.status).toBe(400)
  })
})
```

## 📊 统计和监控测试

### 统计功能测试

```typescript
// test/stats.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Statistics', () => {
  let client: any
  
  beforeEach(() => {
    client = createTypedClient<App>('http://localhost:3000', {
      enableStats: true
    })
  })
  
  it('should track request count', async () => {
    const initialStats = client.getStats()
    
    await client.get('/users')
    await client.get('/posts')
    
    const finalStats = client.getStats()
    
    expect(finalStats.totalRequests).toBe(initialStats.totalRequests + 2)
    expect(finalStats.successfulRequests).toBe(initialStats.successfulRequests + 2)
  })
  
  it('should track response times', async () => {
    await client.get('/users')
    
    const stats = client.getStats()
    
    expect(stats.averageResponseTime).toBeGreaterThan(0)
    expect(stats.totalRequests).toBeGreaterThan(0)
  })
  
  it('should track error count', async () => {
    const initialStats = client.getStats()
    
    // 触发一个错误
    client.updateConfig({ baseURL: 'http://invalid-domain.com' })
    await client.get('/test')
    
    const finalStats = client.getStats()
    
    expect(finalStats.failedRequests).toBe(initialStats.failedRequests + 1)
  })
  
  it('should reset statistics', async () => {
    await client.get('/users')
    
    const statsBeforeReset = client.getStats()
    expect(statsBeforeReset.totalRequests).toBeGreaterThan(0)
    
    client.resetStats()
    
    const statsAfterReset = client.getStats()
    expect(statsAfterReset.totalRequests).toBe(0)
    expect(statsAfterReset.successfulRequests).toBe(0)
    expect(statsAfterReset.failedRequests).toBe(0)
  })
})
```

## 🔗 集成测试

### 与真实 API 的集成测试

```typescript
// test/integration.test.ts
import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Integration Tests', () => {
  let client: any
  
  beforeAll(() => {
    client = createTypedClient<App>('http://localhost:3000', {
      timeout: 10000
    })
  })
  
  it('should perform full CRUD operations', async () => {
    // Create
    const createResponse = await client.post('/users', {
      name: 'Test User',
      email: 'test@example.com'
    })
    
    expect(createResponse.error).toBeUndefined()
    expect(createResponse.data).toBeDefined()
    expect(createResponse.data.name).toBe('Test User')
    
    const userId = createResponse.data.id
    
    // Read
    const readResponse = await client.get('/users/:id', { id: userId })
    
    expect(readResponse.error).toBeUndefined()
    expect(readResponse.data).toBeDefined()
    expect(readResponse.data.id).toBe(userId)
    
    // Update
    const updateResponse = await client.put('/users/:id', {
      name: 'Updated User'
    }, { id: userId })
    
    expect(updateResponse.error).toBeUndefined()
    expect(updateResponse.data).toBeDefined()
    expect(updateResponse.data.name).toBe('Updated User')
    
    // Delete
    const deleteResponse = await client.delete('/users/:id', { id: userId })
    
    expect(deleteResponse.error).toBeUndefined()
  })
  
  it('should handle pagination', async () => {
    const response = await client.get('/users', {
      page: 1,
      limit: 5
    })
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
    expect(response.data.length).toBeLessThanOrEqual(5)
  })
  
  it('should handle search and filtering', async () => {
    const response = await client.get('/users', {
      search: 'john'
    })
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
    expect(response.data.length).toBeGreaterThan(0)
    
    // 验证搜索结果
    const hasMatchingName = response.data.some((user: any) =>
      user.name.toLowerCase().includes('john')
    )
    expect(hasMatchingName).toBe(true)
  })
})
```

## 🎯 性能测试

### 性能基准测试

```typescript
// test/performance.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

describe('Performance Tests', () => {
  let client: any
  
  beforeEach(() => {
    client = createTypedClient<App>('http://localhost:3000', {
      enableCache: true
    })
  })
  
  it('should handle concurrent requests', async () => {
    const startTime = Date.now()
    
    const promises = Array.from({ length: 10 }, () =>
      client.get('/users')
    )
    
    const responses = await Promise.all(promises)
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    expect(responses).toHaveLength(10)
    expect(responses.every(r => r.error === undefined)).toBe(true)
    
    // 验证并发性能（10个请求应该在合理时间内完成）
    expect(totalTime).toBeLessThan(5000) // 5秒内
  })
  
  it('should handle large responses efficiently', async () => {
    const startTime = Date.now()
    
    const response = await client.get('/users')
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
    expect(response.data.length).toBeGreaterThan(0)
    
    // 验证响应时间
    expect(responseTime).toBeLessThan(3000) // 3秒内
  })
  
  it('should cache responses efficiently', async () => {
    // 第一次请求
    const startTime1 = Date.now()
    await client.get('/users')
    const firstRequestTime = Date.now() - startTime1
    
    // 第二次请求（使用缓存）
    const startTime2 = Date.now()
    await client.get('/users')
    const secondRequestTime = Date.now() - startTime2
    
    // 缓存请求应该显著更快
    expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.5)
  })
})
```

## 🔍 测试工具和辅助函数

### 测试辅助函数

```typescript
// test/helpers.ts
import { createTypedClient } from '@vafast/api-client'
import type { App } from '../server'

// 创建测试客户端
export function createTestClient(config = {}) {
  return createTypedClient<App>('http://localhost:3000', {
    timeout: 5000,
    retries: 1,
    enableCache: false,
    ...config
  })
}

// 等待指定时间
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 模拟网络延迟
export function simulateNetworkDelay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 创建模拟响应
export function createMockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers()
  }
}

// 创建模拟错误
export function createMockError(message: string, status = 500) {
  return {
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
    headers: new Headers()
  }
}

// 验证响应结构
export function validateResponseStructure(response: any) {
  expect(response).toHaveProperty('data')
  expect(response).toHaveProperty('error')
  expect(response).toHaveProperty('status')
  expect(response).toHaveProperty('headers')
}

// 验证错误响应
export function validateErrorResponse(response: any, expectedStatus?: number) {
  expect(response.error).toBeDefined()
  expect(response.data).toBeUndefined()
  
  if (expectedStatus) {
    expect(response.error.status).toBe(expectedStatus)
  }
  
  expect(response.error.message).toBeDefined()
  expect(typeof response.error.message).toBe('string')
}

// 验证成功响应
export function validateSuccessResponse(response: any) {
  expect(response.error).toBeUndefined()
  expect(response.data).toBeDefined()
  expect(response.status).toBeGreaterThanOrEqual(200)
  expect(response.status).toBeLessThan(300)
}
```

### 测试数据工厂

```typescript
// test/factories.ts

// 用户数据工厂
export function createUserData(overrides = {}) {
  return {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    ...overrides
  }
}

// 用户列表工厂
export function createUserList(count: number, overrides = {}) {
  return Array.from({ length: count }, (_, index) => 
    createUserData({
      id: `user-${index + 1}`,
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
      ...overrides
    })
  )
}

// 分页响应工厂
export function createPaginatedResponse<T>(data: T[], page = 1, limit = 10) {
  return {
    data,
    total: data.length,
    page,
    limit,
    totalPages: Math.ceil(data.length / limit)
  }
}

// 错误响应工厂
export function createErrorResponse(message: string, status = 400, type = 'client') {
  return {
    error: {
      message,
      status,
      type,
      details: null
    },
    data: undefined,
    status,
    headers: {}
  }
}
```

## 📝 测试最佳实践

### 1. 测试组织
- 按功能模块组织测试文件
- 使用描述性的测试名称
- 保持测试的独立性

### 2. 测试覆盖
- 测试所有主要功能
- 测试边界条件
- 测试错误情况

### 3. 测试数据
- 使用工厂函数创建测试数据
- 避免硬编码的测试数据
- 清理测试后的数据

### 4. 异步测试
- 正确处理异步操作
- 使用适当的等待机制
- 避免测试超时

### 5. 测试性能
- 监控测试执行时间
- 避免不必要的网络请求
- 使用适当的模拟

## 🚀 运行测试

### 使用 Bun

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test test/client.test.ts

# 运行测试并显示覆盖率
bun test --coverage

# 监听模式
bun test --watch
```

### 使用 npm

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- test/client.test.ts

# 运行测试并显示覆盖率
npm run test:coverage

# 监听模式
npm run test:watch
```

### 测试覆盖率

```bash
# 生成覆盖率报告
bun test --coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

## 🔗 相关链接

- [类型安全客户端概述](/api-client/treaty/overview) - 了解基本概念
- [配置选项](/api-client/treaty/config) - 学习测试配置
- [参数处理](/api-client/treaty/parameters) - 测试参数处理
- [响应处理](/api-client/treaty/response) - 测试响应处理
- [WebSocket 支持](/api-client/treaty/websocket) - 测试 WebSocket 功能

## 📚 下一步

现在您已经了解了如何为 Vafast 类型安全客户端编写单元测试，接下来可以：

1. **编写更多测试用例** - 覆盖更多功能和场景
2. **设置持续集成** - 自动化测试流程
3. **性能测试** - 验证在高负载下的表现
4. **安全测试** - 测试各种安全场景
5. **文档测试** - 确保示例代码的正确性

如果您在测试过程中遇到任何问题，请查看我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 或 [社区页面](/community)。
