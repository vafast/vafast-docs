---
title: 路由 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: 路由 - Vafast
  - - meta
    - name: 'description'
      content: 为了确定对客户端的正确响应，web 服务器使用路径和 HTTP 方法来查找正确的资源。这个过程被称为"路由"。我们可以通过定义路由配置对象来定义路由，包括 HTTP 方法、路径和处理函数。
  - - meta
    - property: 'og:description'
      content: 为了确定对客户端的正确响应，web 服务器使用路径和 HTTP 方法来查找正确的资源。这个过程被称为"路由"。我们可以通过定义路由配置对象来定义路由，包括 HTTP 方法、路径和处理函数。
---

<script setup>
import Playground from '../components/nearl/playground.vue'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const demo1 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => '你好')
  },
  {
    method: 'GET',
    path: '/hi',
    handler: createRouteHandler(() => '嗨')
  }
]))

const demo2 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => '你好')
  },
  {
    method: 'POST',
    path: '/hi',
    handler: createRouteHandler(() => '嗨')
  }
]))

const demo3 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/id',
    handler: createRouteHandler(() => `id: undefined`)
  },
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(({ params }) => `id: ${params.id}`)
  }
]))

const demo4 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => '嗨')
  },
  {
    method: 'POST',
    path: '/',
    handler: createRouteHandler(() => '嗨')
  }
]))

const demo5 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => '你好')
  },
  {
    method: 'GET',
    path: '/hi',
    handler: createRouteHandler(() => new Response('路由未找到 :(', { status: 404 }))
  }
]))

const demo6 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(({ params }) => params.id)
  },
  {
    method: 'GET',
    path: '/id/123',
    handler: createRouteHandler(() => '123')
  },
  {
    method: 'GET',
    path: '/id/anything',
    handler: createRouteHandler(() => 'anything')
  },
  {
    method: 'GET',
    path: '/id',
    handler: createRouteHandler(() => new Response('Not found', { status: 404 }))
  },
  {
    method: 'GET',
    path: '/id/anything/test',
    handler: createRouteHandler(() => new Response('Not found', { status: 404 }))
  }
]))

const demo7 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(({ params }) => params.id)
  },
  {
    method: 'GET',
    path: '/id/123',
    handler: createRouteHandler(() => '123')
  },
  {
    method: 'GET',
    path: '/id/anything',
    handler: createRouteHandler(() => 'anything')
  },
  {
    method: 'GET',
    path: '/id',
    handler: createRouteHandler(() => new Response('Not found', { status: 404 }))
  },
  {
    method: 'GET',
    path: '/id/:id/:name',
    handler: createRouteHandler(({ params }) => `${params.id} ${params.name}`)
  }
]))

const demo8 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/get',
    handler: createRouteHandler(() => 'hello')
  },
  {
    method: 'POST',
    path: '/post',
    handler: createRouteHandler(() => 'hi')
  }
]))

const demo9 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(({ params }) => params.id)
  },
  {
    method: 'GET',
    path: '/id/123',
    handler: createRouteHandler(() => '123')
  },
  {
    method: 'GET',
    path: '/id/anything',
    handler: createRouteHandler(() => 'anything')
  },
  {
    method: 'GET',
    path: '/id',
    handler: createRouteHandler(() => new Response('Not found', { status: 404 }))
  },
  {
    method: 'GET',
    path: '/id/:id/:name',
    handler: createRouteHandler(({ params }) => `${params.id}/${params.name}`)
  }
]))

const demo10 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/id/1',
    handler: createRouteHandler(() => '静态路径')
  },
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(() => '动态路径')
  }
]))

const demo11 = new Server(defineRoutes([
  {
    method: 'POST',
    path: '/user/sign-in',
    handler: createRouteHandler(() => '登录')
  },
  {
    method: 'POST',
    path: '/user/sign-up',
    handler: createRouteHandler(() => '注册')
  },
  {
    method: 'POST',
    path: '/user/profile',
    handler: createRouteHandler(() => '个人资料')
  }
]))

const demo12 = new Server(defineRoutes([
  {
    path: '/user',
    children: [
      {
        method: 'POST',
        path: '/sign-in',
        handler: createRouteHandler(() => '登录')
      },
      {
        method: 'POST',
        path: '/sign-up',
        handler: createRouteHandler(() => '注册')
      },
      {
        method: 'POST',
        path: '/profile',
        handler: createRouteHandler(() => '个人资料')
      }
    ]
  }
]))

const demo13 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => '你好，世界')
  },
  {
    path: '/user',
    children: [
      {
        method: 'POST',
        path: '/sign-in',
        handler: createRouteHandler(() => '登录')
      },
      {
        method: 'POST',
        path: '/sign-up',
        handler: createRouteHandler(() => '注册')
      },
      {
        method: 'POST',
        path: '/profile',
        handler: createRouteHandler(() => '个人资料')
      }
    ]
  }
]))
</script>

# 路由

Web 服务器使用请求的 **路径和 HTTP 方法** 来查找正确的资源，这被称为 **"路由"**。

在 Vafast 中，我们通过定义路由配置对象来定义路由，包括 HTTP 方法、路径和处理函数。

## 基本路由

### 定义路由

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello World')
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### HTTP 方法

Vafast 支持所有标准的 HTTP 方法：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',     // 获取资源
    path: '/users',
    handler: createRouteHandler(() => 'Get users')
  },
  {
    method: 'POST',    // 创建资源
    path: '/users',
    handler: createRouteHandler(() => 'Create user')
  },
  {
    method: 'PUT',     // 更新资源
    path: '/users/:id',
    handler: createRouteHandler(() => 'Update user')
  },
  {
    method: 'DELETE',  // 删除资源
    path: '/users/:id',
    handler: createRouteHandler(() => 'Delete user')
  },
  {
    method: 'PATCH',   // 部分更新资源
    path: '/users/:id',
    handler: createRouteHandler(() => 'Patch user')
  }
])
```

### 路径参数

路径参数允许您捕获 URL 中的动态值：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(({ params }) => {
      return `User ID: ${params.id}`
    })
  },
  {
    method: 'GET',
    path: '/posts/:postId/comments/:commentId',
    handler: createRouteHandler(({ params }) => {
      return `Post: ${params.postId}, Comment: ${params.commentId}`
    })
  }
])
```

### 查询参数

查询参数通过 `query` 对象访问：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/search',
    handler: createRouteHandler(({ query }) => {
      const { q, page = '1', limit = '10' } = query
      return `Search: ${q}, Page: ${page}, Limit: ${limit}`
    })
  }
])
```

### 请求体

POST、PUT、PATCH 请求的请求体通过 `body` 对象访问：

```typescript
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(async ({ body }) => {
      return `Created user: ${body.name}`
    })
  }
])
```

## 路由优先级

Vafast 使用智能路由匹配算法，静态路径优先于动态路径：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/123',        // 静态路径 - 优先级高
    handler: createRouteHandler(() => 'Specific user')
  },
  {
    method: 'GET',
    path: '/users/:id',        // 动态路径 - 优先级低
    handler: createRouteHandler(({ params }) => `User ${params.id}`)
  }
])
```

## 嵌套路由

Vafast 支持嵌套路由结构，使用 `children` 属性：

```typescript
const routes = defineRoutes([
  {
    path: '/api',
    children: [
      {
        path: '/v1',
        children: [
          {
            method: 'GET',
            path: '/users',
            handler: createRouteHandler(() => 'API v1 users')
          }
        ]
      },
      {
        path: '/v2',
        children: [
          {
            method: 'GET',
            path: '/users',
            handler: createRouteHandler(() => 'API v2 users')
          }
        ]
      }
    ]
  }
])
```

## 路由配置选项

每个路由可以配置以下选项：

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/protected',
    handler: createRouteHandler(() => 'Protected content'),
    middleware: [authMiddleware],  // 路由级中间件
    body: userSchema,             // 请求体验证
    query: querySchema,           // 查询参数验证
    params: paramsSchema          // 路径参数验证
  }
])
```

## 最佳实践

### 1. 使用描述性路径

```typescript
// ✅ 好的
path: '/users/:id/profile'
path: '/posts/:postId/comments'

// ❌ 不好的
path: '/u/:i'
path: '/p/:p/c'
```

### 2. 保持路由结构清晰

```typescript
const routes = defineRoutes([
  // 用户相关路由
  {
    path: '/users',
    children: [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => 'List users')
      },
      {
        method: 'POST',
        path: '/',
        handler: createRouteHandler(() => 'Create user')
      },
      {
        method: 'GET',
        path: '/:id',
        handler: createRouteHandler(({ params }) => `User ${params.id}`)
      }
    ]
  },
  
  // 文章相关路由
  {
    path: '/posts',
    children: [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => 'List posts')
      },
      {
        method: 'POST',
        path: '/',
        handler: createRouteHandler(() => 'Create post')
      }
    ]
  }
])
```

### 3. 使用适当的 HTTP 方法

```typescript
const routes = defineRoutes([
  {
    method: 'GET',     // 获取数据
    path: '/users',
    handler: createRouteHandler(() => 'Get users')
  },
  {
    method: 'POST',    // 创建数据
    path: '/users',
    handler: createRouteHandler(() => 'Create user')
  },
  {
    method: 'PUT',     // 完全更新
    path: '/users/:id',
    handler: createRouteHandler(() => 'Update user')
  },
  {
    method: 'PATCH',   // 部分更新
    path: '/users/:id',
    handler: createRouteHandler(() => 'Patch user')
  },
  {
    method: 'DELETE',  // 删除数据
    path: '/users/:id',
    handler: createRouteHandler(() => 'Delete user')
  }
])
```

## 测试路由

您可以使用 Playground 组件来测试不同的路由配置：

<Playground :demo="demo1" />

<Playground :demo="demo2" />

<Playground :demo="demo3" />

<Playground :demo="demo4" />

<Playground :demo="demo5" />

<Playground :demo="demo6" />

<Playground :demo="demo7" />

<Playground :demo="demo8" />

<Playground :demo="demo9" />

<Playground :demo="demo10" />

<Playground :demo="demo11" />

<Playground :demo="demo12" />

<Playground :demo="demo13" />
