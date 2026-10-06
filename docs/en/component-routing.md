---
title: Component Routing - Vafast
description: 'Vafast component routing: map routes to lazily imported components, nest component routes, share middleware and serve server-rendered pages with ComponentServer.'
---

# Component Routing

::: tip This is not a REST API intro
Component routing targets **Vue SPAs / hybrid rendering** and is a separate track from the `defineRoute` HTTP APIs in the [Tutorial](/en/tutorial). If you're writing backend endpoints, go through the Quick Start and Tutorial first.
:::

Vafast's component routing lets you associate Vue components with paths for declarative client-side routing and hybrid applications.

## What Is Component Routing?

Component routing lets you:

- Associate Vue components with specific paths
- Implement client-side routing
- Build single-page app experiences
- Support nested component routes
- Apply middleware to component routes

## Basic Component Routing

### Creating Component Routes

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

### Component Route Structure

```typescript
interface ComponentRoute {
  path: string
  component: () => Promise<any>
  middleware?: Middleware[]
}
```

## Defining Components

### Basic Component

```vue
<!-- components/Home.vue -->
<template>
  <div class="home">
    <h1>Welcome to Vafast</h1>
    <p>A high-performance TypeScript web framework</p>
  </div>
</template>

<script setup>
// component logic
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}
</style>
```

### Dynamic Component

```vue
<!-- components/UserProfile.vue -->
<template>
  <div class="user-profile">
    <h2>User Profile</h2>
    <p>User ID: {{ userId }}</p>
    <p>Username: {{ username }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const userId = ref('')
const username = ref('')

onMounted(() => {
  // get user info from route params
  const urlParams = new URLSearchParams(window.location.search)
  userId.value = urlParams.get('id') || 'unknown'
  username.value = urlParams.get('name') || 'unknown'
})
</script>
```

## Nested Component Routes

Vafast supports nested component routes, letting you build complex component hierarchies.

### Basic Nesting

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

### Implementing Nested Components

```vue
<!-- components/Dashboard.vue -->
<template>
  <div class="dashboard">
    <nav class="sidebar">
      <router-link to="/dashboard/overview">Overview</router-link>
      <router-link to="/dashboard/users">Users</router-link>
      <router-link to="/dashboard/settings">Settings</router-link>
    </nav>
    
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// Dashboard component logic
</script>
```

### Deep Nesting

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

## Middleware Support

Component routes support middleware, letting you run custom logic before and after a component renders.

### Component-Level Middleware

```typescript
import { defineMiddleware, json } from 'vafast'

const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return next()
})

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

### Global Middleware

```typescript
const logMiddleware = defineMiddleware(async (req, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  const response = await next()
  console.log(`Response: ${response.status}`)
  return response
})

const routes: any[] = [
  {
    path: '/',
    middleware: [logMiddleware], // applied to all child routes
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

## Dynamic Route Parameters

Component routes support dynamic parameters, so you can render components based on URL parameters.

### Passing Parameters

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

### Reading Parameters in a Component

```vue
<!-- components/UserDetail.vue -->
<template>
  <div class="user-detail">
    <h2>User Details</h2>
    <p>User ID: {{ userId }}</p>
    <p>Username: {{ username }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const userId = ref('')
const username = ref('')

onMounted(() => {
  // get params from the URL
  const pathParts = window.location.pathname.split('/')
  userId.value = pathParts[2] || 'unknown'
  
  // simulate fetching user data
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

## Route Guards

Vafast's component routing supports route guards, letting you run custom logic when routes change.

### Before Guards

```typescript
import { defineMiddleware, redirect } from 'vafast'

const authGuard = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  
  if (!token) {
    return redirect('/login')
  }
  
  try {
    const user = await validateToken(token)
    return next({ user })
  } catch {
    return redirect('/login')
  }
})

const routes: any[] = [
  {
    path: '/profile',
    component: () => import('./components/Profile.vue'),
    middleware: [authGuard]
  }
]
```

### After Guards

```typescript
import { defineMiddleware } from 'vafast'

const logGuard = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const response = await next()
  const duration = Date.now() - start
  
  console.log(`Route ${req.url} took ${duration}ms`)
  
  return response
})
```

## Best Practices

### 1. Component Organization

Organize components by feature module:

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

### 2. Route Configuration

Split route configuration into separate files:

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

### 3. Lazy Loading

Use dynamic imports to lazy-load components:

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

### Error Handling

`ComponentServer` also benefits from the framework's built-in `errorHandler`. In component routes, we recommend `throw err.xxx()` inside the handler:

```typescript
import { err, html } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/page',
  handler: async () => {
    try {
      return await renderPage()
    } catch (error) {
      // return an HTML error page if rendering fails
      return html(`<h1>Failed to load page</h1>`, 500)
    }
  },
})
```

If you want to catch component rendering errors in one place, attach custom middleware to a route group (no method), though handling them in leaf handlers is usually enough.

## Real-World Examples

### Blog App

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

### Admin Panel

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

## Summary

Vafast's component routing system provides:

- ✅ Declarative component routes
- ✅ Nested route support
- ✅ Middleware integration
- ✅ Dynamic parameter support
- ✅ Route guards
- ✅ Lazy loading
- ✅ Type safety

### Next Steps

- Read the [Routing Guide](/en/routing) for the basic routing system
- Learn the [Middleware System](/en/middleware) to enhance component routes
- Explore [Best Practices](/en/essential/best-practice) for more development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).
