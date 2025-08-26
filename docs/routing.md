---
title: 路由指南 - Vafast
---

# 路由指南

Vafast 的路由系统是框架的核心，它提供了强大而灵活的方式来定义 API 端点。本指南将详细介绍 Vafast 的路由功能。

## 基本路由

路由是 Vafast 应用的基础构建块。每个路由都定义了 HTTP 方法、路径和处理函数。

### 路由结构

```typescript
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: () => new Response('Hello Vafast!')
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 支持的 HTTP 方法

Vafast 支持所有标准的 HTTP 方法：

```typescript
const routes: any[] = [
  {
    method: 'GET',     // 获取资源
    path: '/users',
    handler: () => new Response('Get users')
  },
  {
    method: 'POST',    // 创建资源
    path: '/users',
    handler: async (req: Request) => {
      const body = await req.json()
      return new Response('Create user')
    }
  },
  {
    method: 'PUT',     // 更新资源
    path: '/users/:id',
    handler: async (req: Request) => new Response('Update user')
  },
  {
    method: 'DELETE',  // 删除资源
    path: '/users/:id',
    handler: () => new Response('Delete user')
  },
  {
    method: 'PATCH',   // 部分更新
    path: '/users/:id',
    handler: () => new Response('Patch user')
  },
  {
    method: 'OPTIONS', // 预检请求
    path: '/users',
    handler: () => new Response('Options')
  },
  {
    method: 'HEAD',    // 获取响应头
    path: '/users',
    handler: () => new Response('Head')
  }
]
```

## 动态路由

Vafast 支持动态路由参数，允许您捕获 URL 中的变量值。

### 基本参数

```typescript
{
  method: 'GET',
  path: '/users/:id',
  handler: (req: Request, params?: Record<string, string>) => {
    const userId = params?.id
    return new Response(`User ID: ${userId}`)
  }
}
```

### 多个参数

```typescript
{
  method: 'GET',
  path: '/users/:userId/posts/:postId',
  handler: (req: Request, params?: Record<string, string>) => {
    const { userId, postId } = params || {}
    return new Response(`User ${userId}, Post ${postId}`)
  }
}
```

### 可选参数

```typescript
{
  method: 'GET',
  path: '/users/:id?',
  handler: (req: Request, params?: Record<string, string>) => {
    if (params?.id) {
      return new Response(`User ID: ${params.id}`)
    }
    return new Response('All users')
  }
}
```

## 嵌套路由

Vafast 支持嵌套路由结构，允许您组织复杂的路由层次。

### 基本嵌套

```typescript
const routes: any[] = [
  {
    path: '/api',
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: () => new Response('Users API')
      },
      {
        method: 'GET',
        path: '/posts',
        handler: () => new Response('Posts API')
      }
    ]
  }
]
```

### 深层嵌套

```typescript
const routes: any[] = [
  {
    path: '/api',
    children: [
      {
        path: '/v1',
        children: [
          {
            path: '/users',
            children: [
              {
                method: 'GET',
                path: '/',
                handler: () => new Response('Users v1')
              },
              {
                method: 'POST',
                path: '/',
                handler: async (req: Request) => new Response('Create user v1')
              }
            ]
          }
        ]
      }
    ]
  }
]
```

## 中间件

中间件是 Vafast 路由系统的强大功能，允许您在请求处理前后执行自定义逻辑。

### 中间件定义

```typescript
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const auth = req.headers.get('authorization')
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }
  return next()
}

const logMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const start = Date.now()
  const response = await next()
  const duration = Date.now() - start
  console.log(`${req.method} ${req.url} - ${duration}ms`)
  return response
}
```

### 应用中间件

```typescript
const routes: any[] = [
  {
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware, logMiddleware],
    handler: () => new Response('Admin panel')
  }
]
```

### 全局中间件

```typescript
const routes: any[] = [
  {
    path: '/api',
    middleware: [logMiddleware], // 应用到所有子路由
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: () => new Response('Users')
      }
    ]
  }
]
```

## 路由处理函数

处理函数是路由的核心，负责处理请求并返回响应。

### 基本处理函数

```typescript
{
  method: 'GET',
  path: '/hello',
  handler: () => new Response('Hello World')
}
```

### 异步处理函数

```typescript
{
  method: 'POST',
  path: '/users',
  handler: async (req: Request) => {
    const body = await req.json()
    // 处理数据...
    return new Response('User created', { status: 201 })
  }
}
```

### 生成器处理函数

```typescript
{
  method: 'GET',
  path: '/stream',
  handler: function* () {
    yield 'Hello'
    yield 'World'
    yield '!'
  }
}
```

### 带参数的处理函数

```typescript
{
  method: 'GET',
  path: '/users/:id',
  handler: (req: Request, params?: Record<string, string>) => {
    const userId = params?.id
    const query = new URL(req.url).searchParams
    
    return new Response(`User ${userId}, Query: ${query.get('sort')}`)
  }
}
```

## 响应处理

Vafast 使用标准的 Web API Response 对象，提供了灵活的响应方式。

### 基本响应

```typescript
handler: () => new Response('Hello World')
```

### JSON 响应

```typescript
handler: () => new Response(
  JSON.stringify({ message: 'Success' }),
  { headers: { 'Content-Type': 'application/json' } }
)
```

### 状态码和头部

```typescript
handler: () => new Response('Created', {
  status: 201,
  headers: {
    'Content-Type': 'text/plain',
    'X-Custom-Header': 'value'
  }
})
```

### 重定向

```typescript
handler: () => new Response(null, {
  status: 302,
  headers: { 'Location': '/new-page' }
})
```

## 错误处理

Vafast 提供了多种错误处理方式。

### 抛出错误

```typescript
handler: () => {
  throw new Error('Something went wrong')
}
```

### 返回错误响应

```typescript
handler: () => {
  return new Response('Not found', { status: 404 })
}
```

### 错误处理中间件

```typescript
const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
```

## 最佳实践

### 1. 路由组织

```typescript
// 按功能组织路由
const userRoutes = [
  {
    method: 'GET',
    path: '/users',
    handler: () => new Response('Get users')
  },
  {
    method: 'POST',
    path: '/users',
    handler: async (req: Request) => new Response('Create user')
  }
]

const postRoutes = [
  {
    method: 'GET',
    path: '/posts',
    handler: () => new Response('Get posts')
  }
]

const routes: any[] = [
  {
    path: '/api',
    children: [...userRoutes, ...postRoutes]
  }
]
```

### 2. 中间件复用

```typescript
const commonMiddleware = [logMiddleware, corsMiddleware]

const routes: any[] = [
  {
    path: '/api',
    middleware: commonMiddleware,
    children: [
      // 所有子路由都会应用 commonMiddleware
    ]
  }
]
```

### 3. 类型安全

```typescript
interface RouteParams {
  id: string
  category?: string
}

const routes: any[] = [
  {
    method: 'GET',
    path: '/posts/:id/:category?',
    handler: (req: Request, params?: RouteParams) => {
      // 类型安全的参数访问
      const { id, category } = params || {}
      return new Response(`Post ${id} in ${category || 'default'}`)
    }
  }
]
```

## 总结

Vafast 的路由系统提供了：

- ✅ 完整的 HTTP 方法支持
- ✅ 动态路由参数
- ✅ 嵌套路由结构
- ✅ 灵活的中间件系统
- ✅ 类型安全的处理函数
- ✅ 标准的 Web API 响应

### 下一步

- 查看 [中间件系统](/middleware) 了解更高级的中间件用法
- 学习 [组件路由](/component-routing) 了解声明式路由
- 探索 [最佳实践](/best-practices) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
