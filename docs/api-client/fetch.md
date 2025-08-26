---
title: 基础用法 - Vafast API 客户端
head:
  - - meta
    - property: 'og:title'
      content: 基础用法 - Vafast API 客户端

  - - meta
    - name: 'description'
      content: 学习 Vafast API 客户端的基础用法，包括 HTTP 请求方法、参数处理、错误处理和响应处理。

  - - meta
    - property: 'og:description'
      content: 学习 Vafast API 客户端的基础用法，包括 HTTP 请求方法、参数处理、错误处理和响应处理。
---

# 基础用法

Vafast API 客户端提供了简单而强大的 API 来发送 HTTP 请求。本章将介绍基本的用法和常见的操作模式。

## 🚀 创建客户端

首先，创建一个 API 客户端实例：

```typescript
import { VafastApiClient } from '@vafast/api-client'

const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3
})
```

## 📡 HTTP 请求方法

### GET 请求

```typescript
// 基本 GET 请求
const response = await client.get('/users')

// 带查询参数的 GET 请求
const response = await client.get('/users', {
  page: 1,
  limit: 10,
  search: 'john'
})

// 带路径参数的 GET 请求
const response = await client.get('/users/:id', { id: 123 })

// 带自定义头的 GET 请求
const response = await client.get('/users', {}, {
  headers: {
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value'
  }
})
```

### POST 请求

```typescript
// 基本 POST 请求
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})

// 带查询参数的 POST 请求
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  query: { role: 'admin' }
})

// 带自定义头的 POST 请求
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  }
})
```

### PUT 请求

```typescript
// 更新用户信息
const response = await client.put('/users/:id', {
  name: 'John Updated',
  email: 'john.updated@example.com'
}, { id: 123 })

// 带查询参数的 PUT 请求
const response = await client.put('/users/:id', {
  name: 'John Updated'
}, {
  id: 123,
  query: { version: '2.0' }
})
```

### PATCH 请求

```typescript
// 部分更新用户信息
const response = await client.patch('/users/:id', {
  name: 'John Updated'
}, { id: 123 })
```

### DELETE 请求

```typescript
// 删除用户
const response = await client.delete('/users/:id', { id: 123 })

// 带查询参数的 DELETE 请求
const response = await client.delete('/users/:id', {
  id: 123,
  query: { permanent: true }
})
```

## 🔧 参数处理

### 路径参数

```typescript
// 单个路径参数
const response = await client.get('/users/:id', { id: 123 })

// 多个路径参数
const response = await client.get('/posts/:postId/comments/:commentId', {
  postId: 456,
  commentId: 789
})

// 嵌套路径参数
const response = await client.get('/organizations/:orgId/departments/:deptId/employees/:empId', {
  orgId: 'org123',
  deptId: 'dept456',
  empId: 'emp789'
})
```

### 查询参数

```typescript
// 基本查询参数
const response = await client.get('/users', {
  page: 1,
  limit: 10,
  sort: 'name',
  order: 'asc'
})

// 数组查询参数
const response = await client.get('/products', {
  categories: ['electronics', 'books'],
  tags: ['featured', 'new']
})

// 复杂查询参数
const response = await client.get('/search', {
  query: 'laptop',
  filters: {
    price: { min: 100, max: 1000 },
    brand: ['apple', 'dell', 'hp'],
    inStock: true
  },
  sort: { field: 'price', order: 'asc' }
})
```

### 请求体

```typescript
// JSON 请求体
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
  profile: {
    age: 30,
    location: 'New York',
    interests: ['programming', 'music']
  }
})

// FormData 请求体
const formData = new FormData()
formData.append('name', 'John Doe')
formData.append('avatar', fileInput.files[0])

const response = await client.post('/users', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

// 文本请求体
const response = await client.post('/logs', 'User logged in at 2024-01-01', {
  headers: {
    'Content-Type': 'text/plain'
  }
})
```

## 📋 响应处理

### 基本响应结构

```typescript
const response = await client.get('/users')

if (response.error) {
  // 处理错误
  console.error('Error:', response.error.message)
  console.error('Status:', response.error.status)
  console.error('Details:', response.error.details)
} else {
  // 处理成功响应
  console.log('Data:', response.data)
  console.log('Status:', response.status)
  console.log('Headers:', response.headers)
}
```

### 响应类型

```typescript
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    status: number
    details?: any
  }
  status: number
  headers: Record<string, string>
}

// 使用类型化的响应
interface User {
  id: number
  name: string
  email: string
}

const response: ApiResponse<User[]> = await client.get('/users')
```

### 错误处理

```typescript
try {
  const response = await client.get('/users')
  
  if (response.error) {
    switch (response.error.status) {
      case 400:
        console.error('Bad Request:', response.error.message)
        break
      case 401:
        console.error('Unauthorized:', response.error.message)
        // 重定向到登录页面
        break
      case 403:
        console.error('Forbidden:', response.error.message)
        break
      case 404:
        console.error('Not Found:', response.error.message)
        break
      case 500:
        console.error('Server Error:', response.error.message)
        break
      default:
        console.error('Unknown Error:', response.error.message)
    }
  } else {
    console.log('Success:', response.data)
  }
} catch (error) {
  console.error('Network Error:', error)
}
```

## 🎛️ 请求配置

### 全局配置

```typescript
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'User-Agent': 'Vafast-API-Client/1.0.0'
  }
})
```

### 请求级配置

```typescript
// 单个请求的配置
const response = await client.get('/users', {}, {
  timeout: 5000,
  retries: 1,
  headers: {
    'Authorization': 'Bearer token123',
    'X-Request-ID': 'req-123'
  }
})
```

### 中间件配置

```typescript
// 添加请求中间件
client.use(async (config, next) => {
  // 添加认证头
  if (localStorage.getItem('token')) {
    config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
  }
  
  // 添加请求 ID
  config.headers['X-Request-ID'] = `req-${Date.now()}`
  
  return await next(config)
})

// 添加响应中间件
client.use(async (response, next) => {
  // 记录响应时间
  console.log(`Request completed in ${Date.now() - response.startTime}ms`)
  
  return await next(response)
})
```

## 🔄 重试机制

### 自动重试

```typescript
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // 只在网络错误或 5xx 错误时重试
    return error.status >= 500 || error.type === 'network'
  }
})
```

### 自定义重试策略

```typescript
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  retries: 5,
  retryDelay: (attempt) => {
    // 指数退避策略
    return Math.min(1000 * Math.pow(2, attempt), 10000)
  },
  retryCondition: (error, attempt) => {
    // 最多重试 5 次，只在特定错误时重试
    if (attempt >= 5) return false
    
    return error.status === 429 || error.status >= 500
  }
})
```

## 💾 缓存机制

### 启用缓存

```typescript
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  enableCache: true,
  cacheExpiry: 300000, // 5分钟
  cacheStrategy: 'memory' // 'memory' | 'localStorage' | 'sessionStorage'
})
```

### 缓存控制

```typescript
// 强制刷新缓存
const response = await client.get('/users', {}, {
  cache: 'no-cache'
})

// 使用缓存
const response = await client.get('/users', {}, {
  cache: 'force-cache'
})

// 清除特定路径的缓存
client.clearCache('/users')

// 清除所有缓存
client.clearCache()
```

## 📊 请求统计

### 启用统计

```typescript
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  enableStats: true
})

// 获取统计信息
const stats = client.getStats()
console.log('Total requests:', stats.totalRequests)
console.log('Successful requests:', stats.successfulRequests)
console.log('Failed requests:', stats.failedRequests)
console.log('Average response time:', stats.averageResponseTime)
```

### 自定义统计

```typescript
client.on('request', (config) => {
  console.log('Request started:', config.url)
})

client.on('response', (response) => {
  console.log('Response received:', response.status)
})

client.on('error', (error) => {
  console.error('Request failed:', error.message)
})
```

## 🔗 完整示例

```typescript
import { VafastApiClient } from '@vafast/api-client'

// 创建客户端
const client = new VafastApiClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  retries: 3,
  enableCache: true,
  cacheExpiry: 300000
})

// 用户管理 API
class UserAPI {
  // 获取用户列表
  static async getUsers(page = 1, limit = 10) {
    const response = await client.get('/users', {
      _page: page,
      _limit: limit
    })
    
    if (response.error) {
      throw new Error(`Failed to fetch users: ${response.error.message}`)
    }
    
    return response.data
  }
  
  // 获取单个用户
  static async getUser(id: number) {
    const response = await client.get('/users/:id', { id })
    
    if (response.error) {
      throw new Error(`Failed to fetch user: ${response.error.message}`)
    }
    
    return response.data
  }
  
  // 创建用户
  static async createUser(userData: { name: string; email: string }) {
    const response = await client.post('/users', userData)
    
    if (response.error) {
      throw new Error(`Failed to create user: ${response.error.message}`)
    }
    
    return response.data
  }
  
  // 更新用户
  static async updateUser(id: number, userData: Partial<{ name: string; email: string }>) {
    const response = await client.put('/users/:id', userData, { id })
    
    if (response.error) {
      throw new Error(`Failed to update user: ${response.error.message}`)
    }
    
    return response.data
  }
  
  // 删除用户
  static async deleteUser(id: number) {
    const response = await client.delete('/users/:id', { id })
    
    if (response.error) {
      throw new Error(`Failed to delete user: ${response.error.message}`)
    }
    
    return response.data
  }
}

// 使用示例
async function main() {
  try {
    // 获取用户列表
    const users = await UserAPI.getUsers(1, 5)
    console.log('Users:', users)
    
    // 获取单个用户
    const user = await UserAPI.getUser(1)
    console.log('User:', user)
    
    // 创建新用户
    const newUser = await UserAPI.createUser({
      name: 'John Doe',
      email: 'john@example.com'
    })
    console.log('New user:', newUser)
    
    // 更新用户
    const updatedUser = await UserAPI.updateUser(1, {
      name: 'John Updated'
    })
    console.log('Updated user:', updatedUser)
    
    // 删除用户
    await UserAPI.deleteUser(1)
    console.log('User deleted successfully')
    
  } catch (error) {
    console.error('API Error:', error.message)
  }
}

main()
```

## 📚 下一步

现在您已经掌握了 Vafast API 客户端的基础用法，接下来可以：

1. **探索类型安全** - 学习如何创建类型安全的客户端
2. **学习 WebSocket** - 掌握实时通信功能
3. **配置中间件** - 自定义请求和响应处理
4. **高级配置** - 了解更复杂的配置选项
5. **错误处理** - 学习更完善的错误处理策略

如果您有任何问题，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast) 或 [社区页面](/community)。
