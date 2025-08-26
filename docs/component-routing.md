---
title: 组件路由 - Vafast
---

# 组件路由

Vafast 的组件路由系统是一个强大的功能，它允许您将 Vue 组件与路由关联，创建声明式的组件路由。这对于构建单页应用（SPA）和混合应用非常有用。

## 什么是组件路由？

组件路由允许您：

- 将 Vue 组件与特定路径关联
- 实现客户端路由功能
- 创建单页应用体验
- 支持嵌套组件路由
- 应用中间件到组件路由

## 基本组件路由

### 创建组件路由

```typescript
import { ComponentServer } from 'vafast'

const routes: any[] = [
  {
    path: '/',
    component: () => import('./components/Home.vue')
  },
  {
    path: '/about',
    component: () => import('./components/About.vue')
  }
]

const server = new ComponentServer(routes)
export default { fetch: server.fetch }
```

### 组件路由结构

```typescript
interface ComponentRoute {
  path: string
  component: () => Promise<any>
  middleware?: Middleware[]
}
```

## 组件定义

### 基本组件

```vue
<!-- components/Home.vue -->
<template>
  <div class="home">
    <h1>欢迎来到 Vafast</h1>
    <p>这是一个高性能的 TypeScript Web 框架</p>
  </div>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}
</style>
```

### 动态组件

```vue
<!-- components/UserProfile.vue -->
<template>
  <div class="user-profile">
    <h2>用户资料</h2>
    <p>用户 ID: {{ userId }}</p>
    <p>用户名: {{ username }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const userId = ref('')
const username = ref('')

onMounted(() => {
  // 从路由参数获取用户信息
  const urlParams = new URLSearchParams(window.location.search)
  userId.value = urlParams.get('id') || 'unknown'
  username.value = urlParams.get('name') || 'unknown'
})
</script>
```

## 嵌套组件路由

Vafast 支持嵌套组件路由，允许您创建复杂的组件层次结构。

### 基本嵌套

```typescript
const routes: any[] = [
  {
    path: '/dashboard',
    component: () => import('./components/Dashboard.vue'),
    children: [
      {
        path: '/overview',
        component: () => import('./components/dashboard/Overview.vue')
      },
      {
        path: '/users',
        component: () => import('./components/dashboard/Users.vue')
      },
      {
        path: '/settings',
        component: () => import('./components/dashboard/Settings.vue')
      }
    ]
  }
]
```

### 嵌套组件实现

```vue
<!-- components/Dashboard.vue -->
<template>
  <div class="dashboard">
    <nav class="sidebar">
      <router-link to="/dashboard/overview">概览</router-link>
      <router-link to="/dashboard/users">用户</router-link>
      <router-link to="/dashboard/settings">设置</router-link>
    </nav>
    
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// Dashboard 组件逻辑
</script>
```

### 深层嵌套

```typescript
const routes: any[] = [
  {
    path: '/admin',
    component: () => import('./components/Admin.vue'),
    children: [
      {
        path: '/users',
        component: () => import('./components/admin/Users.vue'),
        children: [
          {
            path: '/list',
            component: () => import('./components/admin/users/UserList.vue')
          },
          {
            path: '/create',
            component: () => import('./components/admin/users/CreateUser.vue')
          },
          {
            path: '/:id',
            component: () => import('./components/admin/users/UserDetail.vue')
          }
        ]
      }
    ]
  }
]
```

## 中间件支持

组件路由支持中间件，允许您在组件渲染前后执行自定义逻辑。

### 组件级中间件

```typescript
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  return next()
}

const routes: any[] = [
  {
    path: '/admin',
    component: () => import('./components/Admin.vue'),
    middleware: [authMiddleware],
    children: [
      {
        path: '/users',
        component: () => import('./components/admin/Users.vue')
      }
    ]
  }
]
```

### 全局中间件

```typescript
const logMiddleware = async (req: Request, next: () => Promise<Response>) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
}

const routes: any[] = [
  {
    path: '/',
    middleware: [logMiddleware], // 应用到所有子路由
    children: [
      {
        path: '/home',
        component: () => import('./components/Home.vue')
      },
      {
        path: '/about',
        component: () => import('./components/About.vue')
      }
    ]
  }
]
```

## 动态路由参数

组件路由支持动态参数，允许您根据 URL 参数动态渲染组件。

### 参数传递

```typescript
const routes: any[] = [
  {
    path: '/user/:id',
    component: () => import('./components/UserDetail.vue')
  },
  {
    path: '/post/:postId/comment/:commentId',
    component: () => import('./components/CommentDetail.vue')
  }
]
```

### 组件中获取参数

```vue
<!-- components/UserDetail.vue -->
<template>
  <div class="user-detail">
    <h2>用户详情</h2>
    <p>用户 ID: {{ userId }}</p>
    <p>用户名: {{ username }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const userId = ref('')
const username = ref('')

onMounted(() => {
  // 从 URL 获取参数
  const pathParts = window.location.pathname.split('/')
  userId.value = pathParts[2] || 'unknown'
  
  // 模拟获取用户数据
  fetchUserData(userId.value)
})

const fetchUserData = async (id: string) => {
  try {
    const response = await fetch(`/api/users/${id}`)
    const user = await response.json()
    username.value = user.name
  } catch (error) {
    console.error('Failed to fetch user data:', error)
  }
}
</script>
```

## 路由守卫

Vafast 的组件路由系统支持路由守卫，允许您在路由切换时执行自定义逻辑。

### 前置守卫

```typescript
const authGuard = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  
  if (!token) {
    // 重定向到登录页面
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/login' }
    })
  }
  
  // 验证 token
  try {
    const user = await validateToken(token)
    ;(req as any).user = user
    return next()
  } catch (error) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/login' }
    })
  }
}

const routes: any[] = [
  {
    path: '/profile',
    component: () => import('./components/Profile.vue'),
    middleware: [authGuard]
  }
]
```

### 后置守卫

```typescript
const logGuard = async (req: Request, next: () => Promise<Response>) => {
  const start = Date.now()
  const response = await next()
  const duration = Date.now() - start
  
  console.log(`Route ${req.url} took ${duration}ms`)
  
  return response
}
```

## 最佳实践

### 1. 组件组织

按功能模块组织组件：

```
components/
├── common/
│   ├── Header.vue
│   ├── Footer.vue
│   └── Sidebar.vue
├── pages/
│   ├── Home.vue
│   ├── About.vue
│   └── Contact.vue
├── dashboard/
│   ├── Dashboard.vue
│   ├── Overview.vue
│   └── Settings.vue
└── admin/
    ├── Admin.vue
    ├── Users.vue
    └── Reports.vue
```

### 2. 路由配置

将路由配置分离到不同文件：

```typescript
// routes/index.ts
import { userRoutes } from './user'
import { adminRoutes } from './admin'
import { dashboardRoutes } from './dashboard'

export const routes: any[] = [
  {
    path: '/',
    component: () => import('../components/pages/Home.vue')
  },
  {
    path: '/about',
    component: () => import('../components/pages/About.vue')
  },
  ...userRoutes,
  ...adminRoutes,
  ...dashboardRoutes
]
```

```typescript
// routes/user.ts
export const userRoutes: any[] = [
  {
    path: '/user',
    component: () => import('../components/user/UserLayout.vue'),
    children: [
      {
        path: '/profile',
        component: () => import('../components/user/Profile.vue')
      },
      {
        path: '/settings',
        component: () => import('../components/user/Settings.vue')
      }
    ]
  }
]
```

### 3. 懒加载

使用动态导入实现组件懒加载：

```typescript
const routes: any[] = [
  {
    path: '/dashboard',
    component: () => import('./components/Dashboard.vue'),
    children: [
      {
        path: '/analytics',
        component: () => import(/* webpackChunkName: "analytics" */ './components/Analytics.vue')
      }
    ]
  }
]
```

### 4. 错误处理

为组件路由添加错误处理：

```typescript
const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    console.error('Component routing error:', error)
    
    // 返回错误页面组件
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>页面加载失败</h1>
          <p>请稍后重试</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

const routes: any[] = [
  {
    path: '/',
    middleware: [errorHandler],
    children: [
      // 子路由
    ]
  }
]
```

## 实际应用示例

### 博客应用

```typescript
const blogRoutes: any[] = [
  {
    path: '/blog',
    component: () => import('./components/blog/BlogLayout.vue'),
    children: [
      {
        path: '/',
        component: () => import('./components/blog/BlogList.vue')
      },
      {
        path: '/:slug',
        component: () => import('./components/blog/BlogPost.vue')
      },
      {
        path: '/category/:category',
        component: () => import('./components/blog/CategoryPosts.vue')
      }
    ]
  }
]
```

### 管理面板

```typescript
const adminRoutes: any[] = [
  {
    path: '/admin',
    component: () => import('./components/admin/AdminLayout.vue'),
    middleware: [authMiddleware, adminMiddleware],
    children: [
      {
        path: '/dashboard',
        component: () => import('./components/admin/Dashboard.vue')
      },
      {
        path: '/users',
        component: () => import('./components/admin/Users.vue'),
        children: [
          {
            path: '/',
            component: () => import('./components/admin/users/UserList.vue')
          },
          {
            path: '/create',
            component: () => import('./components/admin/users/CreateUser.vue')
          },
          {
            path: '/:id',
            component: () => import('./components/admin/users/UserDetail.vue')
          }
        ]
      }
    ]
  }
]
```

## 总结

Vafast 的组件路由系统提供了：

- ✅ 声明式组件路由
- ✅ 嵌套路由支持
- ✅ 中间件集成
- ✅ 动态参数支持
- ✅ 路由守卫
- ✅ 懒加载支持
- ✅ 类型安全

### 下一步

- 查看 [路由指南](/routing) 了解基本路由系统
- 学习 [中间件系统](/middleware) 了解如何增强组件路由
- 探索 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
