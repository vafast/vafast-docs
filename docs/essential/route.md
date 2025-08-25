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
import { Server } from 'vafast'

const demo1 = new Server([
  {
    method: 'GET',
    path: '/',
    handler: () => '你好'
  },
  {
    method: 'GET',
    path: '/hi',
    handler: () => '嗨'
  }
])

const demo2 = new Server([
  {
    method: 'GET',
    path: '/',
    handler: () => '你好'
  },
  {
    method: 'POST',
    path: '/hi',
    handler: () => '嗨'
  }
])

const demo3 = new Server([
  {
    method: 'GET',
    path: '/id',
    handler: () => `id: undefined`
  },
  {
    method: 'GET',
    path: '/id/:id',
    handler: (req, params) => `id: ${params?.id}`
  }
])

const demo4 = new Server([
  {
    method: 'GET',
    path: '/',
    handler: () => '嗨'
  },
  {
    method: 'POST',
    path: '/',
    handler: () => '嗨'
  }
])

const demo5 = new Server([
  {
    method: 'GET',
    path: '/',
    handler: () => '你好'
  },
  {
    method: 'GET',
    path: '/hi',
    handler: () => new Response('路由未找到 :(', { status: 404 })
  }
])

const demo6 = new Server([
  {
    method: 'GET',
    path: '/id/:id',
    handler: (req, params) => params?.id
  },
  {
    method: 'GET',
    path: '/id/123',
    handler: () => '123'
  },
  {
    method: 'GET',
    path: '/id/anything',
    handler: () => 'anything'
  },
  {
    method: 'GET',
    path: '/id',
    handler: () => new Response('Not found', { status: 404 })
  },
  {
    method: 'GET',
    path: '/id/anything/test',
    handler: () => new Response('Not found', { status: 404 })
  }
])

const demo7 = new Server([
  {
    method: 'GET',
    path: '/id/:id',
    handler: (req, params) => params?.id
  },
  {
    method: 'GET',
    path: '/id/123',
    handler: () => '123'
  },
  {
    method: 'GET',
    path: '/id/anything',
    handler: () => 'anything'
  },
  {
    method: 'GET',
    path: '/id',
    handler: () => new Response('Not found', { status: 404 })
  },
  {
    method: 'GET',
    path: '/id/:id/:name',
    handler: (req, params) => `${params?.id} ${params?.name}`
  }
])

const demo8 = new Server([
  {
    method: 'GET',
    path: '/get',
    handler: () => 'hello'
  },
  {
    method: 'POST',
    path: '/post',
    handler: () => 'hi'
  }
])

const demo9 = new Server([
  {
    method: 'GET',
    path: '/id/:id',
    handler: (req, params) => params?.id
  },
  {
    method: 'GET',
    path: '/id/123',
    handler: () => '123'
  },
  {
    method: 'GET',
    path: '/id/anything',
    handler: () => 'anything'
  },
  {
    method: 'GET',
    path: '/id',
    handler: () => new Response('Not found', { status: 404 })
  },
  {
    method: 'GET',
    path: '/id/:id/:name',
    handler: (req, params) => `${params?.id}/${params?.name}`
  }
])

const demo10 = new Server([
  {
    method: 'GET',
    path: '/id/1',
    handler: () => '静态路径'
  },
  {
    method: 'GET',
    path: '/id/:id',
    handler: () => '动态路径'
  }
])

const demo11 = new Server([
  {
    method: 'POST',
    path: '/user/sign-in',
    handler: () => '登录'
  },
  {
    method: 'POST',
    path: '/user/sign-up',
    handler: () => '注册'
  },
  {
    method: 'POST',
    path: '/user/profile',
    handler: () => '个人资料'
  }
])

const demo12 = new Server([
  {
    path: '/user',
    children: [
      {
        method: 'POST',
        path: '/sign-in',
        handler: () => '登录'
      },
      {
        method: 'POST',
        path: '/sign-up',
        handler: () => '注册'
      },
      {
        method: 'POST',
        path: '/profile',
        handler: () => '个人资料'
      }
    ]
  }
])

const demo13 = new Server([
  {
    method: 'GET',
    path: '/',
    handler: () => '你好，世界'
  },
  {
    path: '/user',
    children: [
      {
        method: 'POST',
        path: '/sign-in',
        handler: () => '登录'
      },
      {
        method: 'POST',
        path: '/sign-up',
        handler: () => '注册'
      },
      {
        method: 'POST',
        path: '/profile',
        handler: () => '个人资料'
      }
    ]
  }
])
</script>

# 路由

Web 服务器使用请求的 **路径和 HTTP 方法** 来查找正确的资源，这被称为 **"路由"**。

在 Vafast 中，我们通过定义路由配置对象来定义路由，包括 HTTP 方法、路径和处理函数。

## 基本路由

### 定义路由

```typescript
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

### HTTP 方法

Vafast 支持所有标准的 HTTP 方法：

```typescript
const routes: any[] = [
  {
    method: 'GET',     // 获取资源
    path: '/users',
    handler: () => 'Get users'
  },
  {
    method: 'POST',    // 创建资源
    path: '/users',
    handler: async (req) => 'Create user'
  },
  {
    method: 'PUT',     // 更新资源
    path: '/users/:id',
    handler: async (req) => 'Update user'
  },
  {
    method: 'DELETE',  // 删除资源
    path: '/users/:id',
    handler: () => 'Delete user'
  },
  {
    method: 'PATCH',   // 部分更新
    path: '/users/:id',
    handler: () => 'Patch user'
  }
]
```

## 动态路由

### 路径参数

```typescript
{
  method: 'GET',
  path: '/users/:id',
  handler: (req, params) => `User ID: ${params?.id}`
}
```

### 多个参数

```typescript
{
  method: 'GET',
  path: '/users/:userId/posts/:postId',
  handler: (req, params) => `User ${params?.userId}, Post ${params?.postId}`
}
```

## 嵌套路由

Vafast 支持嵌套路由结构：

```typescript
const routes: any[] = [
  {
    path: '/api',
    children: [
      {
        method: 'GET',
        path: '/users',
        handler: () => 'Users API'
      },
      {
        method: 'GET',
        path: '/posts',
        handler: () => 'Posts API'
      }
    ]
  }
]
```

## 路由优先级

Vafast 按照以下优先级匹配路由：

1. **静态路径** - 完全匹配的路径
2. **动态路径** - 包含参数的路径
3. **嵌套路径** - 子路由

### 示例

<Playground :demo="demo10" />

在这个示例中：
- `/id/1` 是静态路径，优先级最高
- `/id/:id` 是动态路径，匹配其他 ID 值

## 路由组织

### 按功能分组

```typescript
const userRoutes = [
  {
    method: 'POST',
    path: '/sign-in',
    handler: () => '登录'
  },
  {
    method: 'POST',
    path: '/sign-up',
    handler: () => '注册'
  },
  {
    method: 'POST',
    path: '/profile',
    handler: () => '个人资料'
  }
]

const routes: any[] = [
  {
    path: '/user',
    children: userRoutes
  }
]
```

<Playground :demo="demo11" />

### 使用嵌套路由

<Playground :demo="demo12" />

## 错误处理

### 404 错误

```typescript
{
  method: 'GET',
  path: '/not-found',
  handler: () => new Response('Not found', { status: 404 })
}
```

<Playground :demo="demo5" />

## 完整示例

<Playground :demo="demo13" />

这个示例展示了如何组合多个路由，包括：
- 根路径处理
- 用户相关路由的嵌套组织
- 清晰的代码结构

## 最佳实践

### 1. 路由命名

使用描述性的路径名称：

```typescript
// 好的做法
{
  method: 'GET',
  path: '/users/:id/profile',
  handler: () => 'User profile'
}

// 避免
{
  method: 'GET',
  path: '/u/:i/p',
  handler: () => 'User profile'
}
```

### 2. 路由组织

按功能模块组织路由：

```typescript
const routes: any[] = [
  {
    path: '/api/v1',
    children: [
      {
        path: '/users',
        children: [
          { method: 'GET', path: '/', handler: () => 'List users' },
          { method: 'POST', path: '/', handler: () => 'Create user' },
          { method: 'GET', path: '/:id', handler: () => 'Get user' }
        ]
      },
      {
        path: '/posts',
        children: [
          { method: 'GET', path: '/', handler: () => 'List posts' },
          { method: 'POST', path: '/', handler: () => 'Create post' }
        ]
      }
    ]
  }
]
```

### 3. 参数验证

在路由处理函数中验证参数：

```typescript
{
  method: 'GET',
  path: '/users/:id',
  handler: (req, params) => {
    const id = params?.id
    
    if (!id || isNaN(Number(id))) {
      return new Response('Invalid user ID', { status: 400 })
    }
    
    return `User ID: ${id}`
  }
}
```

## 总结

Vafast 的路由系统提供了：

- ✅ 完整的 HTTP 方法支持
- ✅ 动态路径参数
- ✅ 嵌套路由结构
- ✅ 清晰的路由优先级
- ✅ 灵活的路由组织
- ✅ 类型安全的参数访问

### 下一步

- 查看 [中间件系统](/middleware) 了解如何增强路由功能
- 学习 [处理程序](/essential/handler) 了解路由处理函数的详细用法
- 探索 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
