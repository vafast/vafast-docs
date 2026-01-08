---
title: 处理程序 - Vafast
---

<script setup>
import Tab from '../components/fern/tab.vue'
</script>

# 处理程序

处理程序是响应每个路由请求的函数。

接受请求信息并返回响应给客户端。

在其他框架中，处理程序也被称为 **控制器**。

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'hello world')
  }
])
```

## 基本用法

### 简单响应

最简单的处理程序直接返回数据：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello World')
  },
  {
    method: 'GET',
    path: '/json',
    handler: createHandler(() => ({ message: 'Hello World' }))
  },
  {
    method: 'GET',
    path: '/html',
    handler: createHandler(() => '<h1>Hello World</h1>')
  }
])
```

### 访问请求信息

处理程序可以访问请求的各种信息：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/info',
    handler: createHandler(({ req, headers, query }) => {
      return {
        url: req.url,
        method: req.method,
        userAgent: headers['user-agent'],
        query: query.search || 'default'
      }
    })
  }
])
```

### 异步处理

处理程序支持异步操作：

```typescript
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(async ({ body }) => {
      // 模拟数据库操作
      const user = await createUser(body)
      return user
    })
  }
])
```

## 参数解构

Vafast 使用参数解构来提供类型安全的访问：

### 基本参数

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/user/:id',
    handler: createHandler(({ params, query, headers }) => {
      const userId = params.id
      const page = query.page || '1'
      const auth = headers.authorization
      
      return `User ${userId}, Page ${page}, Auth: ${auth}`
    })
  }
])
```

### 请求体

::: tip 推荐
使用 Schema 验证替代手动验证，可获得更好的类型安全和错误信息。
:::

```typescript
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      {
        body: Type.Object({
          name: Type.String({ minLength: 1 }),
          email: Type.String({ format: 'email' }),
          age: Type.Optional(Type.Number())
        })
      },
      ({ body }) => ({
        name: body.name,
        email: body.email,
        age: body.age || 18
      })
    )
  }
])
```

### 查询参数

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/search',
    handler: createHandler(({ query }) => {
      const { q, page = '1', limit = '10', sort = 'name' } = query
      
      return {
        query: q,
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        results: []
      }
    })
  }
])
```

## 响应处理

### 自动响应类型

Vafast 会自动处理不同类型的返回值：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/string',
    handler: createHandler(() => 'Plain text') // 返回 text/plain
  },
  {
    method: 'GET',
    path: '/json',
    handler: createHandler(() => ({ data: 'JSON' })) // 返回 application/json
  },
  {
    method: 'GET',
    path: '/html',
    handler: createHandler(() => '<h1>HTML</h1>') // 返回 text/html
  },
  {
    method: 'GET',
    path: '/number',
    handler: createHandler(() => 42) // 返回 text/plain
  }
])
```

### 自定义状态码和头部

使用 `{ data, status, headers }` 格式可以控制响应细节：

```typescript
import { redirect } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/custom',
    handler: createHandler(() => ({
      data: 'Custom response',
        status: 200,
      headers: { 'X-Custom-Header': 'value' }
    }))
  },
  {
    method: 'GET',
    path: '/redirect',
    handler: createHandler(() => redirect('/new-page'))
  }
])
```

### 错误响应

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/user/:id',
    handler: createHandler(({ params }) => {
      const userId = params.id
      
      if (!userId || isNaN(Number(userId))) {
        return { data: { error: 'Invalid user ID' }, status: 400 }
      }
      
      if (userId === '999') {
        return { data: { error: 'User not found' }, status: 404 }
      }
      
      return { id: userId, name: 'John Doe' }
    })
  }
])
```

## 中间件集成

处理程序可以与中间件配合使用：

```typescript
import { json } from 'vafast'

const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return await next()
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/protected',
    handler: createHandler(() => 'Protected content'),
    middleware: [authMiddleware]
  }
])
```

## Schema 验证

处理程序可以与 TypeBox 验证集成，使用两参数形式：

```typescript
import { Type } from '@sinclair/typebox'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      { body: userSchema },
      ({ body }) => {
        // body 已经通过验证，类型安全
        const { name, email, age } = body
        return { name, email, age: age || 18 }
      }
    )
  }
])
```

## 最佳实践

### 1. 保持处理程序简洁

```typescript
// ✅ 好的做法
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(async ({ body }) => {
      const user = await createUser(body)
      return user
    })
  }
])

// ❌ 避免的做法
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(async ({ body }) => {
      // 不要在这里放太多业务逻辑
      const { name, email, age, address, phone, preferences, ... } = body
      // 复杂的验证逻辑
      // 数据库操作
      // 邮件发送
      // 日志记录
      // 等等...
    })
  }
])
```

### 2. 使用适当的错误处理

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/user/:id',
    handler: createHandler(async ({ params }) => {
        const user = await getUserById(params.id)
        if (!user) {
        return { data: { error: 'User not found' }, status: 404 }
        }
        return user
      // 注意：未捕获的错误由 createHandler 内置错误处理自动返回 500
    })
  }
])
```

### 3. 利用类型安全

```typescript
interface User {
  id: string
  name: string
  email: string
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(async ({ body }): Promise<User> => {
      const user = await createUser(body)
      return user
    })
  }
])
```

## 总结

Vafast 的处理程序系统提供了：

- ✅ 类型安全的参数访问
- ✅ 自动响应类型推断
- ✅ 中间件集成支持
- ✅ 验证系统集成
- ✅ 异步操作支持
- ✅ 灵活的响应控制

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强处理程序功能
- 探索 [验证系统](/essential/validation) 了解如何验证请求数据
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
