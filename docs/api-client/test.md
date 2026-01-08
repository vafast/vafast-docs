---
title: 测试指南 - Vafast API 客户端
---

# 测试指南

测试是确保代码质量的关键部分。Vafast API 客户端提供了完整的测试支持，让您能够轻松地测试各种场景。

## 🧪 测试环境设置

### 安装测试依赖

```bash
# 使用 Bun（推荐）
npm install -d bun @types/node

# 使用 npm
npm install -D jest @types/jest ts-jest

# 使用 yarn
yarn add -D jest @types/jest ts-jest

# 使用 pnpm
pnpm add -D jest @types/jest ts-jest
```

### 配置测试环境

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

## 🔧 基础测试

### 客户端实例测试

```typescript
// test/client.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('VafastApiClient', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 5000
    })
  })
  
  it('should create client instance', () => {
    expect(client).toBeInstanceOf(VafastApiClient)
    expect(client.config.baseURL).toBe('https://jsonplaceholder.typicode.com')
    expect(client.config.timeout).toBe(5000)
  })
  
  it('should have default configuration', () => {
    expect(client.config.retries).toBe(3)
    expect(client.config.enableCache).toBe(false)
  })
  
  it('should update configuration', () => {
    client.updateConfig({ timeout: 10000 })
    expect(client.config.timeout).toBe(10000)
  })
})
```

### HTTP 方法测试

```typescript
// test/http-methods.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('HTTP Methods', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com'
    })
  })
  
  describe('GET', () => {
    it('should fetch users successfully', async () => {
      const response = await client.get('/users')
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
    })
    
    it('should handle query parameters', async () => {
      const response = await client.get('/users', {
        _page: 1,
        _limit: 5
      })
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
    
    it('should handle path parameters', async () => {
      const response = await client.get('/users/:id', { id: 1 })
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
      expect(response.data.id).toBe(1)
    })
  })
  
  describe('POST', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      }
      
      const response = await client.post('/users', userData)
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
      expect(response.data.name).toBe(userData.name)
      expect(response.data.email).toBe(userData.email)
    })
  })
  
  describe('PUT', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'John Updated'
      }
      
      const response = await client.put('/users/:id', updateData, { id: 1 })
      
      expect(response.error).toBeUndefined()
      expect(response.data).toBeDefined()
      expect(response.data.name).toBe(updateData.name)
    })
  })
  
  describe('DELETE', () => {
    it('should delete user successfully', async () => {
      const response = await client.delete('/users/:id', { id: 1 })
      
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
import { VafastApiClient } from '@vafast/api-client'

describe('Error Handling', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://invalid-domain-that-does-not-exist.com',
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
    client.updateConfig({ baseURL: 'https://jsonplaceholder.typicode.com' })
    
    const response = await client.get('/nonexistent')
    
    expect(response.error).toBeDefined()
    expect(response.error?.status).toBe(404)
  })
  
  it('should handle 500 errors', async () => {
    // 模拟服务器错误
    const mockServer = new VafastApiClient({
      baseURL: 'https://httpstat.us'
    })
    
    const response = await mockServer.get('/500')
    
    expect(response.error).toBeDefined()
    expect(response.error?.status).toBe(500)
  })
})
```

### 重试机制测试

```typescript
// test/retry.test.ts
import { describe, expect, it, beforeEach, jest } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('Retry Mechanism', () => {
  let client: VafastApiClient
  let mockFetch: jest.Mock
  
  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch
    
    client = new VafastApiClient({
      baseURL: 'https://api.example.com',
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
    client = new VafastApiClient({
      baseURL: 'https://api.example.com',
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

## 🔄 中间件测试

### 请求中间件测试

```typescript
// test/middleware.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('Middleware', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com'
    })
  })
  
  it('should execute request middleware', async () => {
    const requestMiddleware = jest.fn()
    
    client.use(async (config, next) => {
      requestMiddleware(config)
      return await next(config)
    })
    
    await client.get('/users')
    
    expect(requestMiddleware).toHaveBeenCalled()
    expect(requestMiddleware.mock.calls[0][0]).toHaveProperty('url')
    expect(requestMiddleware.mock.calls[0][0]).toHaveProperty('method')
  })
  
  it('should modify request in middleware', async () => {
    client.use(async (config, next) => {
      // 添加自定义头
      config.headers['X-Custom-Header'] = 'test-value'
      return await next(config)
    })
    
    const response = await client.get('/users')
    
    expect(response.error).toBeUndefined()
    // 注意：这里我们无法直接验证请求头，但可以验证请求成功
  })
  
  it('should execute response middleware', async () => {
    const responseMiddleware = jest.fn()
    
    client.use(async (response, next) => {
      responseMiddleware(response)
      return await next(response)
    })
    
    await client.get('/users')
    
    expect(responseMiddleware).toHaveBeenCalled()
    expect(responseMiddleware.mock.calls[0][0]).toHaveProperty('data')
    expect(responseMiddleware.mock.calls[0][0]).toHaveProperty('status')
  })
  
  it('should handle middleware errors', async () => {
    client.use(async (config, next) => {
      throw new Error('Middleware error')
    })
    
    const response = await client.get('/users')
    
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
import { VafastApiClient } from '@vafast/api-client'

describe('Cache', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
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

## 📊 统计和监控测试

### 统计功能测试

```typescript
// test/stats.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('Statistics', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
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
    client.updateConfig({ baseURL: 'https://invalid-domain.com' })
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
import { VafastApiClient } from '@vafast/api-client'

describe('Integration Tests', () => {
  let client: VafastApiClient
  
  beforeAll(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 10000
    })
  })
  
  it('should perform full CRUD operations', async () => {
    // Create
    const createResponse = await client.post('/posts', {
      title: 'Test Post',
      body: 'Test Body',
      userId: 1
    })
    
    expect(createResponse.error).toBeUndefined()
    expect(createResponse.data).toBeDefined()
    expect(createResponse.data.title).toBe('Test Post')
    
    const postId = createResponse.data.id
    
    // Read
    const readResponse = await client.get('/posts/:id', { id: postId })
    
    expect(readResponse.error).toBeUndefined()
    expect(readResponse.data).toBeDefined()
    expect(readResponse.data.id).toBe(postId)
    
    // Update
    const updateResponse = await client.put('/posts/:id', {
      title: 'Updated Post',
      body: 'Updated Body',
      userId: 1
    }, { id: postId })
    
    expect(updateResponse.error).toBeUndefined()
    expect(updateResponse.data).toBeDefined()
    expect(updateResponse.data.title).toBe('Updated Post')
    
    // Delete
    const deleteResponse = await client.delete('/posts/:id', { id: postId })
    
    expect(deleteResponse.error).toBeUndefined()
  })
  
  it('should handle pagination', async () => {
    const response = await client.get('/posts', {
      _page: 1,
      _limit: 5
    })
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
    expect(response.data.length).toBeLessThanOrEqual(5)
  })
  
  it('should handle search and filtering', async () => {
    const response = await client.get('/posts', {
      title_like: 'qui est esse'
    })
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
    expect(response.data.length).toBeGreaterThan(0)
    
    // 验证搜索结果
    const hasMatchingTitle = response.data.some((post: any) =>
      post.title.includes('qui est esse')
    )
    expect(hasMatchingTitle).toBe(true)
  })
})
```

## 🎯 性能测试

### 性能基准测试

```typescript
// test/performance.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('Performance Tests', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
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

## 🧹 测试清理

### 测试后清理

```typescript
// test/cleanup.test.ts
import { describe, expect, it, afterEach } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('Test Cleanup', () => {
  let client: VafastApiClient
  
  afterEach(() => {
    // 清理缓存
    if (client) {
      client.clearCache()
      client.resetStats()
    }
  })
  
  it('should clean up after tests', () => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
      enableCache: true,
      enableStats: true
    })
    
    // 执行一些操作
    expect(client).toBeDefined()
  })
})
```

## 📚 测试最佳实践

### 1. 测试隔离
- 每个测试用例都应该是独立的
- 使用 `beforeEach` 和 `afterEach` 清理状态
- 避免测试之间的依赖关系

### 2. 模拟外部依赖
- 使用 mock 函数模拟网络请求
- 避免依赖外部服务的可用性
- 使用测试数据而不是真实 API

### 3. 错误场景测试
- 测试各种错误情况
- 验证错误处理的正确性
- 测试边界条件和异常情况

### 4. 性能测试
- 测试并发请求处理
- 验证缓存机制的有效性
- 监控响应时间和资源使用

### 5. 集成测试
- 测试与真实 API 的集成
- 验证端到端功能
- 测试各种配置组合

## 🚀 运行测试

### 使用 Bun

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test test/client.test.ts

# 运行测试并显示覆盖率
npm test --coverage

# 监听模式
npm test --watch
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

## 📚 下一步

现在您已经了解了如何测试 Vafast API 客户端，接下来可以：

1. **编写更多测试用例** - 覆盖更多功能和场景
2. **设置持续集成** - 自动化测试流程
3. **性能测试** - 验证在高负载下的表现
4. **安全测试** - 测试各种安全场景
5. **文档测试** - 确保示例代码的正确性

如果您在测试过程中遇到任何问题，请查看我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 或 [社区页面](/community)。
