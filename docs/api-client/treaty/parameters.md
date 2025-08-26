---
title: 参数处理 - Vafast 类型安全客户端
---

# 参数处理

Vafast 类型安全客户端提供了强大的参数处理能力，支持路径参数、查询参数、请求体等多种参数类型。本章将详细介绍如何正确使用这些参数。

## 🎯 参数类型概述

Vafast 类型安全客户端支持以下参数类型：

- **路径参数** - URL 路径中的动态部分
- **查询参数** - URL 查询字符串中的参数
- **请求体** - HTTP 请求的主体内容
- **请求头** - HTTP 请求头信息
- **Cookie** - 请求中的 Cookie 信息

## 🛣️ 路径参数

### 基本用法

路径参数是 URL 路径中的动态部分，用冒号 `:` 表示。

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(({ params }) => `User ${params.id}`),
    params: Type.Object({
      id: Type.String()
    })
  }
])

// 客户端使用
const response = await client.get('/users/:id', { id: '123' })
console.log(response.data) // "User 123"
```

### 多个路径参数

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/posts/:postId/comments/:commentId',
    handler: createRouteHandler(({ params }) => 
      `Post ${params.postId}, Comment ${params.commentId}`
    ),
    params: Type.Object({
      postId: Type.String(),
      commentId: Type.String()
    })
  }
])

// 客户端使用
const response = await client.get('/posts/:postId/comments/:commentId', {
  postId: '456',
  commentId: '789'
})
console.log(response.data) // "Post 456, Comment 789"
```

### 嵌套路径参数

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/organizations/:orgId/departments/:deptId/employees/:empId',
    handler: createRouteHandler(({ params }) => 
      `Employee ${params.empId} in ${params.deptId} of ${params.orgId}`
    ),
    params: Type.Object({
      orgId: Type.String(),
      deptId: Type.String(),
      empId: Type.String()
    })
  }
])

// 客户端使用
const response = await client.get('/organizations/:orgId/departments/:deptId/employees/:empId', {
  orgId: 'org123',
  deptId: 'dept456',
  empId: 'emp789'
})
console.log(response.data) // "Employee emp789 in dept456 of org123"
```

### 路径参数类型验证

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(({ params }) => `User ${params.id}`),
    params: Type.Object({
      id: Type.Union([
        Type.String({ pattern: '^[0-9]+$' }), // 数字字符串
        Type.String({ pattern: '^[a-f0-9]{24}$' }) // MongoDB ObjectId
      ])
    })
  }
])

// 客户端使用 - 类型安全
const response = await client.get('/users/:id', { id: '123' }) // ✅ 有效
const response2 = await client.get('/users/:id', { id: '507f1f77bcf86cd799439011' }) // ✅ 有效
const response3 = await client.get('/users/:id', { id: 'invalid' }) // ❌ 类型错误
```

## 🔍 查询参数

### 基本查询参数

查询参数是 URL 查询字符串中的键值对。

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createRouteHandler(({ query }) => {
      const { page = 1, limit = 10, search = '' } = query
      return `Page ${page}, Limit ${limit}, Search: ${search}`
    }),
    query: Type.Object({
      page: Type.Optional(Type.Number({ minimum: 1 })),
      limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
      search: Type.Optional(Type.String())
    })
  }
])

// 客户端使用
const response = await client.get('/users', {
  page: 1,
  limit: 20,
  search: 'john'
})
console.log(response.data) // "Page 1, Limit 20, Search: john"
```

### 数组查询参数

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/products',
    handler: createRouteHandler(({ query }) => {
      const { categories = [], tags = [] } = query
      return `Categories: ${categories.join(', ')}, Tags: ${tags.join(', ')}`
    }),
    query: Type.Object({
      categories: Type.Optional(Type.Array(Type.String())),
      tags: Type.Optional(Type.Array(Type.String()))
    })
  }
])

// 客户端使用
const response = await client.get('/products', {
  categories: ['electronics', 'books'],
  tags: ['featured', 'new']
})
console.log(response.data) // "Categories: electronics, books, Tags: featured, new"
```

### 复杂查询参数

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/search',
    handler: createRouteHandler(({ query }) => {
      const { filters, sort, pagination } = query
      return `Filters: ${JSON.stringify(filters)}, Sort: ${JSON.stringify(sort)}, Page: ${pagination.page}`
    }),
    query: Type.Object({
      filters: Type.Object({
        price: Type.Object({
          min: Type.Optional(Type.Number()),
          max: Type.Optional(Type.Number())
        }),
        brand: Type.Optional(Type.Array(Type.String())),
        inStock: Type.Optional(Type.Boolean())
      }),
      sort: Type.Object({
        field: Type.String(),
        order: Type.Union([Type.Literal('asc'), Type.Literal('desc')])
      }),
      pagination: Type.Object({
        page: Type.Number({ minimum: 1 }),
        limit: Type.Number({ minimum: 1, maximum: 100 })
      })
    })
  }
])

// 客户端使用
const response = await client.get('/search', {
  filters: {
    price: { min: 100, max: 1000 },
    brand: ['apple', 'dell', 'hp'],
    inStock: true
  },
  sort: { field: 'price', order: 'asc' },
  pagination: { page: 1, limit: 20 }
})
```

### 查询参数验证

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/analytics',
    handler: createRouteHandler(({ query }) => {
      const { startDate, endDate, metrics } = query
      return `Analytics from ${startDate} to ${endDate} for ${metrics.join(', ')}`
    }),
    query: Type.Object({
      startDate: Type.String({ format: 'date' }),
      endDate: Type.String({ format: 'date' }),
      metrics: Type.Array(Type.Union([
        Type.Literal('views'),
        Type.Literal('clicks'),
        Type.Literal('conversions')
      ]))
    })
  }
])

// 客户端使用 - 类型安全
const response = await client.get('/analytics', {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  metrics: ['views', 'clicks'] // ✅ 有效
})

const response2 = await client.get('/analytics', {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  metrics: ['invalid'] // ❌ 类型错误
})
```

## 📦 请求体

### 基本请求体

请求体是 HTTP 请求的主体内容，通常用于 POST、PUT、PATCH 等请求。

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => `Created user: ${body.name}`),
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      email: Type.String({ format: 'email' }),
      age: Type.Number({ minimum: 0, maximum: 150 })
    })
  }
])

// 客户端使用
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})
console.log(response.data) // "Created user: John Doe"
```

### 复杂请求体

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/orders',
    handler: createRouteHandler(({ body }) => {
      const { customer, items, shipping } = body
      return `Order for ${customer.name} with ${items.length} items`
    }),
    body: Type.Object({
      customer: Type.Object({
        name: Type.String(),
        email: Type.String({ format: 'email' }),
        phone: Type.Optional(Type.String())
      }),
      items: Type.Array(Type.Object({
        productId: Type.String(),
        quantity: Type.Number({ minimum: 1 }),
        price: Type.Number({ minimum: 0 })
      })),
      shipping: Type.Object({
        address: Type.String(),
        city: Type.String(),
        country: Type.String(),
        postalCode: Type.String()
      })
    })
  }
])

// 客户端使用
const response = await client.post('/orders', {
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  },
  items: [
    { productId: 'prod123', quantity: 2, price: 29.99 },
    { productId: 'prod456', quantity: 1, price: 49.99 }
  ],
  shipping: {
    address: '123 Main St',
    city: 'New York',
    country: 'USA',
    postalCode: '10001'
  }
})
```

### 文件上传

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/upload',
    handler: createRouteHandler(async ({ body }) => {
      const { file, metadata } = body
      const fileName = file.name
      return `Uploaded file: ${fileName}`
    }),
    body: Type.Object({
      file: Type.Any(), // 文件对象
      metadata: Type.Object({
        description: Type.Optional(Type.String()),
        tags: Type.Optional(Type.Array(Type.String()))
      })
    })
  }
])

// 客户端使用
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('metadata', JSON.stringify({
  description: 'Profile picture',
  tags: ['avatar', 'profile']
}))

const response = await client.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
```

### 请求体验证

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/validation',
    handler: createRouteHandler(({ body }) => `Valid data: ${body.value}`),
    body: Type.Object({
      value: Type.String({
        minLength: 5,
        maxLength: 100,
        pattern: '^[a-zA-Z0-9\\s]+$'
      }),
      number: Type.Number({
        minimum: 1,
        maximum: 1000,
        multipleOf: 5
      }),
      email: Type.String({
        format: 'email'
      }),
      url: Type.String({
        format: 'uri'
      }),
      date: Type.String({
        format: 'date'
      })
    })
  }
])

// 客户端使用 - 类型安全
const response = await client.post('/validation', {
  value: 'Hello World', // ✅ 有效
  number: 25, // ✅ 有效
  email: 'test@example.com', // ✅ 有效
  url: 'https://example.com', // ✅ 有效
  date: '2024-01-01' // ✅ 有效
})

// 类型错误会在编译时被捕获
const response2 = await client.post('/validation', {
  value: 'Hi', // ❌ 太短
  number: 23, // ❌ 不是5的倍数
  email: 'invalid-email', // ❌ 格式错误
  url: 'not-a-url', // ❌ 格式错误
  date: 'invalid-date' // ❌ 格式错误
})
```

## 🎛️ 请求头

### 基本请求头

请求头用于传递额外的 HTTP 请求信息。

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/protected',
    handler: createRouteHandler(({ headers }) => {
      const authHeader = headers.get('authorization')
      return `Authenticated with: ${authHeader}`
    }),
    headers: Type.Object({
      authorization: Type.String({ pattern: '^Bearer .+' })
    })
  }
])

// 客户端使用
const response = await client.get('/protected', {}, {
  headers: {
    'Authorization': 'Bearer token123',
    'X-Request-ID': 'req-456',
    'User-Agent': 'Vafast-Client/1.0.0'
  }
})
```

### 动态请求头

```typescript
// 客户端使用 - 动态请求头
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const response = await client.get('/protected', {}, {
  headers: {
    ...getAuthHeaders(),
    'X-Request-ID': `req-${Date.now()}`
  }
})
```

### 请求头验证

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/secure',
    handler: createRouteHandler(({ headers }) => 'Secure endpoint accessed'),
    headers: Type.Object({
      'x-api-key': Type.String({ minLength: 32, maxLength: 32 }),
      'x-timestamp': Type.String({ pattern: '^\\d{10}$' }),
      'x-signature': Type.String({ minLength: 64, maxLength: 64 })
    })
  }
])

// 客户端使用
const timestamp = Math.floor(Date.now() / 1000).toString()
const signature = generateSignature(timestamp)

const response = await client.post('/secure', { data: 'secret' }, {
  headers: {
    'X-API-Key': '1234567890abcdef1234567890abcdef',
    'X-Timestamp': timestamp,
    'X-Signature': signature
  }
})
```

## 🍪 Cookie 参数

### 基本 Cookie 处理

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/profile',
    handler: createRouteHandler(({ cookies }) => {
      const sessionId = cookies.get('sessionId')
      return `Profile for session: ${sessionId}`
    }),
    cookies: Type.Object({
      sessionId: Type.String()
    })
  }
])

// 客户端使用
const response = await client.get('/profile', {}, {
  credentials: 'include' // 包含 Cookie
})
```

### Cookie 验证

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/login',
    handler: createRouteHandler(({ body, cookies }) => {
      // 设置认证 Cookie
      cookies.set('sessionId', 'new-session-123', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600
      })
      return 'Login successful'
    }),
    body: Type.Object({
      username: Type.String(),
      password: Type.String()
    })
  }
])

// 客户端使用
const response = await client.post('/login', {
  username: 'john',
  password: 'password123'
}, {
  credentials: 'include'
})
```

## 🔧 参数组合

### 混合参数类型

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'PUT',
    path: '/users/:id',
    handler: createRouteHandler(({ params, query, body, headers }) => {
      const { id } = params
      const { version } = query
      const { name, email } = body
      const { 'x-request-id': requestId } = headers
      
      return `Updated user ${id} to version ${version} with request ${requestId}`
    }),
    params: Type.Object({
      id: Type.String()
    }),
    query: Type.Object({
      version: Type.String()
    }),
    body: Type.Object({
      name: Type.String(),
      email: Type.String({ format: 'email' })
    }),
    headers: Type.Object({
      'x-request-id': Type.String()
    })
  }
])

// 客户端使用
const response = await client.put('/users/:id', {
  name: 'John Updated',
  email: 'john.updated@example.com'
}, {
  id: '123',
  query: { version: '2.0' },
  headers: { 'X-Request-ID': 'req-789' }
})
```

### 可选参数

```typescript
// 服务器端定义
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/search',
    handler: createRouteHandler(({ query }) => {
      const { q, page = 1, limit = 10, sort = 'relevance' } = query
      return `Search: ${q}, Page: ${page}, Limit: ${limit}, Sort: ${sort}`
    }),
    query: Type.Object({
      q: Type.String(),
      page: Type.Optional(Type.Number({ minimum: 1 })),
      limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
      sort: Type.Optional(Type.Union([
        Type.Literal('relevance'),
        Type.Literal('date'),
        Type.Literal('price')
      ]))
    })
  }
])

// 客户端使用 - 部分参数
const response = await client.get('/search', {
  q: 'laptop',
  page: 2
  // limit 和 sort 使用默认值
})
```

## 📝 参数最佳实践

### 1. 参数命名
- 使用清晰的描述性名称
- 遵循一致的命名约定
- 避免缩写和模糊名称

### 2. 参数验证
- 为所有参数定义验证规则
- 使用适当的类型约束
- 提供有意义的错误消息

### 3. 参数文档
- 为每个参数提供清晰的描述
- 说明参数的格式和约束
- 提供使用示例

### 4. 参数安全
- 验证和清理所有输入
- 使用适当的类型检查
- 防止参数注入攻击

### 5. 参数性能
- 避免过大的请求体
- 使用适当的缓存策略
- 优化参数处理逻辑

## 🔍 参数调试

### 启用参数日志

```typescript
const client = createTypedClient<App>('http://localhost:3000', {
  logging: {
    enabled: true,
    level: 'debug'
  }
})

// 参数会被自动记录
const response = await client.get('/users/:id', { id: '123' }, {
  query: { page: 1, limit: 10 }
})
```

### 参数验证错误

```typescript
try {
  const response = await client.get('/users/:id', { id: 'invalid' })
} catch (error) {
  if (error.type === 'validation') {
    console.error('Parameter validation failed:', error.details)
  }
}
```

## 🔗 相关链接

- [类型安全客户端概述](/api-client/treaty/overview) - 了解基本概念
- [配置选项](/api-client/treaty/config) - 学习配置参数
- [响应处理](/api-client/treaty/response) - 了解响应参数
- [WebSocket 支持](/api-client/treaty/websocket) - 处理实时参数
- [单元测试](/api-client/treaty/unit-test) - 测试参数处理

## 📚 下一步

现在您已经了解了 Vafast 类型安全客户端的参数处理，接下来可以：

1. **学习响应处理** - 了解如何处理响应参数
2. **配置 WebSocket** - 处理实时通信参数
3. **编写测试** - 验证参数处理的正确性
4. **性能优化** - 优化参数处理性能
5. **安全加固** - 增强参数安全性

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast) 或 [社区页面](/community)。
