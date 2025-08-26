---
title: 处理程序 - Vafast
---

<script setup>
import Playground from '../components/nearl/playground.vue'
import Tab from '../components/fern/tab.vue'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const handler1 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(({ path }) => path)
  }
]))

const handler2 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => new Response('Teapot', { status: 418 }))
  }
]))

const demo1 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/a',
    handler: createRouteHandler(() => 'Version 1')
  },
  {
    method: 'GET',
    path: '/b',
    handler: createRouteHandler(() => 'Store info')
  },
  {
    method: 'GET',
    path: '/c',
    handler: createRouteHandler(() => 'still ok')
  }
]))

const demo2 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/error',
    handler: createRouteHandler(() => new Response('Error', { status: 500 }))
  },
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Version 1')
  }
]))

const demo3 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(({ headers }) => {
      const auth = headers.authorization
      const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null
      return bearer ?? '12345'
    })
  }
]))

const demo4 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/elysia-version',
    handler: createRouteHandler(() => 'Vafast Version 1')
  },
  {
    method: 'GET',
    path: '/version',
    handler: createRouteHandler(() => 'Version 1')
  }
]))

const demo5 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Setup Carbon')
  }
]))

const demo6 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Setup Carbon')
  }
]))

const demo7 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Counter: 0')
  },
  {
    method: 'GET',
    path: '/error',
    handler: createRouteHandler(() => 'Counter: 0')
  }
]))
</script>

# 处理程序

处理程序是响应每个路由请求的函数。

接受请求信息并返回响应给客户端。

在其他框架中，处理程序也被称为 **控制器**。

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    // 函数 `createRouteHandler(() => 'hello world')` 创建一个处理程序
    handler: createRouteHandler(() => 'hello world')
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
    handler: createRouteHandler(() => 'Hello World')
  },
  {
    method: 'GET',
    path: '/json',
    handler: createRouteHandler(() => ({ message: 'Hello World' }))
  },
  {
    method: 'GET',
    path: '/html',
    handler: createRouteHandler(() => '<h1>Hello World</h1>')
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
    handler: createRouteHandler(({ req, path, method, headers, query }) => {
      return {
        path,
        method,
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
    handler: createRouteHandler(async ({ body }) => {
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
    handler: createRouteHandler(({ params, query, headers }) => {
      const userId = params.id
      const page = query.page || '1'
      const auth = headers.authorization
      
      return `User ${userId}, Page ${page}, Auth: ${auth}`
    })
  }
])
```

### 请求体

```typescript
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(async ({ body }) => {
      const { name, email, age } = body
      
      if (!name || !email) {
        return new Response('Name and email are required', { status: 400 })
      }
      
      return { name, email, age: age || 18 }
    })
  }
])
```

### 查询参数

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/search',
    handler: createRouteHandler(({ query }) => {
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
    handler: createRouteHandler(() => 'Plain text') // 返回 text/plain
  },
  {
    method: 'GET',
    path: '/json',
    handler: createRouteHandler(() => ({ data: 'JSON' })) // 返回 application/json
  },
  {
    method: 'GET',
    path: '/html',
    handler: createRouteHandler(() => '<h1>HTML</h1>') // 返回 text/html
  },
  {
    method: 'GET',
    path: '/number',
    handler: createRouteHandler(() => 42) // 返回 text/plain
  }
])
```

### 手动响应控制

如果需要更精细的控制，可以返回 Response 对象：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/custom',
    handler: createRouteHandler(() => {
      return new Response('Custom response', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'X-Custom-Header': 'value'
        }
      })
    })
  },
  {
    method: 'GET',
    path: '/redirect',
    handler: createRouteHandler(() => {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/new-page'
        }
      })
    })
  }
])
```

### 错误响应

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/user/:id',
    handler: createRouteHandler(({ params }) => {
      const userId = params.id
      
      if (!userId || isNaN(Number(userId))) {
        return new Response('Invalid user ID', { status: 400 })
      }
      
      if (userId === '999') {
        return new Response('User not found', { status: 404 })
      }
      
      return { id: userId, name: 'John Doe' }
    })
  }
])
```

## 中间件集成

处理程序可以与中间件配合使用：

```typescript
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  return await next()
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/protected',
    handler: createRouteHandler(() => 'Protected content'),
    middleware: [authMiddleware]
  }
])
```

## 验证集成

处理程序可以与 TypeBox 验证集成：

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
    handler: createRouteHandler(({ body }) => {
      // body 已经通过验证，类型安全
      const { name, email, age } = body
      return { name, email, age: age || 18 }
    }),
    body: userSchema
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
    handler: createRouteHandler(async ({ body }) => {
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
    handler: createRouteHandler(async ({ body }) => {
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
    handler: createRouteHandler(async ({ params }) => {
      try {
        const user = await getUserById(params.id)
        if (!user) {
          return new Response('User not found', { status: 404 })
        }
        return user
      } catch (error) {
        console.error('Error fetching user:', error)
        return new Response('Internal server error', { status: 500 })
      }
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
    handler: createRouteHandler(async ({ body }): Promise<User> => {
      const user = await createUser(body)
      return user
    })
  }
])
```

## 测试处理程序

您可以使用 Playground 组件来测试不同的处理程序：

<Playground :demo="handler1" />

<Playground :demo="handler2" />

<Playground :demo="demo1" />

<Playground :demo="demo2" />

<Playground :demo="demo3" />

<Playground :demo="demo4" />

<Playground :demo="demo5" />

<Playground :demo="demo6" />

<Playground :demo="demo7" />

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
