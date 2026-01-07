---
title: 路由指南 - Vafast
---

# 路由指南

Vafast 的路由系统是框架的核心，它提供了强大而灵活的方式来定义 API 端点。本指南将详细介绍 Vafast 的路由功能。

## 基本路由

路由是 Vafast 应用的基础构建块。每个路由都定义了 HTTP 方法、路径和处理函数。

### 路由结构

```typescript
import { Server, createHandler } from 'vafast'

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello Vafast!')
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 支持的 HTTP 方法

Vafast 支持所有标准的 HTTP 方法：

```typescript
import { createHandler } from 'vafast'

const routes = [
  {
    method: 'GET',     // 获取资源
    path: '/users',
    handler: createHandler(() => ({ users: [] }))
  },
  {
    method: 'POST',    // 创建资源
    path: '/users',
    handler: createHandler(({ body }) => ({ message: 'Create user', data: body }))
  },
  {
    method: 'PUT',     // 更新资源
    path: '/users/:id',
    handler: createHandler(({ params }) => ({ message: `Update user ${params.id}` }))
  },
  {
    method: 'DELETE',  // 删除资源
    path: '/users/:id',
    handler: createHandler(({ params }) => ({ message: `Delete user ${params.id}` }))
  },
  {
    method: 'PATCH',   // 部分更新
    path: '/users/:id',
    handler: createHandler(({ params, body }) => ({ message: `Patch user ${params.id}`, data: body }))
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
  handler: createHandler(({ params }) => ({
    userId: params.id
  }))
}
```

### 多个参数

```typescript
{
  method: 'GET',
  path: '/users/:userId/posts/:postId',
  handler: createHandler(({ params }) => ({
    userId: params.userId,
    postId: params.postId
  }))
}
```

### 可选参数

```typescript
{
  method: 'GET',
  path: '/users/:id?',
  handler: createHandler(({ params }) => {
    if (params.id) {
      return { userId: params.id }
    }
    return { users: [] }
  })
}
```

## 嵌套路由

Vafast 支持嵌套路由结构，允许您组织复杂的路由层次。

### 基本嵌套

```typescript
const routes = [
  {
    path: '/api',
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: createHandler(() => ({ message: 'Users API' }))
      },
      {
        method: 'GET',
        path: '/posts',
        handler: createHandler(() => ({ message: 'Posts API' }))
      }
    ]
  }
]
```

### 深层嵌套

```typescript
const routes = [
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
                handler: createHandler(() => ({ message: 'Users v1' }))
              },
              {
                method: 'POST',
                path: '/',
                handler: createHandler(({ body }) => ({ message: 'Create user v1', data: body }))
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
const routes = [
  {
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware, logMiddleware],
    handler: createHandler(() => ({ message: 'Admin panel' }))
  }
]
```

### 全局中间件

```typescript
const routes = [
  {
    path: '/api',
    middleware: [logMiddleware], // 应用到所有子路由
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: createHandler(() => ({ message: 'Users' }))
      }
    ]
  }
]
```

## 路由处理函数

处理函数是路由的核心，负责处理请求并返回响应。**推荐使用 `createHandler` 包装处理函数**，它提供统一的上下文解构和自动响应转换。

### 基本处理函数

```typescript
{
  method: 'GET',
  path: '/hello',
  handler: createHandler(() => 'Hello World')
}
```

### 异步处理函数

```typescript
{
  method: 'POST',
  path: '/users',
  handler: createHandler(async ({ body }) => {
    // body 已自动解析
    const user = await createUser(body)
    return { data: user, status: 201 }
  })
}
```

### 访问请求上下文

`createHandler` 提供了完整的请求上下文：

```typescript
{
  method: 'GET',
  path: '/users/:id',
  handler: createHandler(({ req, params, query, headers, cookies }) => ({
    userId: params.id,
    search: query.q,
    userAgent: headers['user-agent']
  }))
}
```

## 响应处理

Vafast 会**自动转换返回值**为 Response，你可以直接返回数据：

### 自动响应转换

```typescript
// 字符串 → text/plain
handler: createHandler(() => 'Hello World')

// 对象/数组 → application/json
handler: createHandler(() => ({ message: 'Success' }))

// 数字/布尔 → text/plain
handler: createHandler(() => 42)

// null/undefined → 204 No Content
handler: createHandler(() => null)
```

### 自定义状态码和头部

使用 `{ data, status, headers }` 格式可以控制响应细节：

```typescript
handler: createHandler(() => ({
  data: { user: { id: 1, name: 'John' } },
  status: 201,
  headers: { 'X-Custom-Header': 'value' }
}))
```

### 重定向

```typescript
import { redirect } from 'vafast'

handler: createHandler(() => redirect('/new-page'))
```

### 手动 Response（不推荐）

如需完全控制，仍可返回 Response 对象：

```typescript
handler: createHandler(() => new Response('Custom', {
  status: 200,
  headers: { 'Content-Type': 'text/custom' }
}))
```

## 错误处理

Vafast 内置了自动错误处理，`createHandler` 会捕获错误并返回格式化响应。

### 抛出错误

```typescript
handler: createHandler(() => {
  throw new Error('Something went wrong')
})
// 自动返回 500 错误响应
```

### 返回错误状态

```typescript
handler: createHandler(() => ({
  data: { error: 'Not found' },
  status: 404
}))
```

### 使用 VafastError

```typescript
import { VafastError } from 'vafast'

handler: createHandler(() => {
  throw new VafastError('资源不存在', { status: 404, type: 'not_found' })
})
```

## 最佳实践

### 1. 路由组织

```typescript
// 按功能组织路由
const userRoutes = [
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(() => ({ users: [] }))
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(({ body }) => ({ user: body }))
  }
]

const postRoutes = [
  {
    method: 'GET',
    path: '/posts',
    handler: createHandler(() => ({ posts: [] }))
  }
]

const routes = [
  {
    path: '/api',
    children: [...userRoutes, ...postRoutes]
  }
]
```

### 2. 中间件复用

```typescript
const commonMiddleware = [logMiddleware, corsMiddleware]

const routes = [
  {
    path: '/api',
    middleware: commonMiddleware,
    children: [
      // 所有子路由都会应用 commonMiddleware
    ]
  }
]
```

### 3. 类型安全（使用 Schema）

```typescript
import { Type } from '@sinclair/typebox'

const routes = [
  {
    method: 'GET',
    path: '/posts/:id/:category?',
    handler: createHandler(
      {
        params: Type.Object({
          id: Type.String(),
          category: Type.Optional(Type.String())
        })
      },
      ({ params }) => ({
        // params 自动获得类型推导
        postId: params.id,
        category: params.category ?? 'default'
      })
    )
  }
]
```

## 总结

Vafast 的路由系统提供了：

- ✅ **createHandler** - 推荐的处理器工厂，提供统一上下文
- ✅ **自动响应转换** - 直接返回数据，无需手动创建 Response
- ✅ 完整的 HTTP 方法支持
- ✅ 动态路由参数
- ✅ 嵌套路由结构
- ✅ 灵活的中间件系统
- ✅ Schema 验证与类型推导

### 下一步

- 查看 [中间件系统](/middleware) 了解更高级的中间件用法
- 学习 [组件路由](/component-routing) 了解声明式路由
- 探索 [最佳实践](/best-practices) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
