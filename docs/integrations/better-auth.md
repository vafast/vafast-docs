---
title: Better Auth 集成 - Vafast
---

# Better Auth 集成

Better Auth 是一个现代化的身份验证库，专为现代 Web 应用设计。它提供了一整套全面的功能，并包括一个中间件生态系统，可以简化添加高级功能。

## 安装

```bash
npm install better-auth
```

## 基本设置

首先，创建一个 Better Auth 配置文件：

```typescript
// src/auth/config.ts
import { BetterAuth } from 'better-auth'
import { VafastAdapter } from 'better-auth/adapters/vafast'

export const auth = new BetterAuth({
  adapter: VafastAdapter({
    // 数据库配置
    database: {
      url: process.env.DATABASE_URL,
      type: 'postgresql'
    },
    
    // 会话配置
    session: {
      secret: process.env.SESSION_SECRET,
      expiresIn: 60 * 60 * 24 * 7, // 7天
      updateAge: 60 * 60 * 24 // 1天
    },
    
    // 认证配置
    auth: {
      providers: ['credentials', 'oauth'],
      pages: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        error: '/auth/error'
      }
    }
  })
})
```

## 在 Vafast 中使用

```typescript
// src/index.ts
import { Server, defineRoute, defineRoutes, err, Type } from 'vafast'
import { auth } from './auth/config'
import { authMiddleware } from './auth/middleware'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/user',
    handler: async ({ request }) => {
      const session = await auth.api.getSession(request)
      if (!session) {
        throw err.unauthorized('Unauthorized')
      }
      return { user: session.user }
    },
    middleware: [authMiddleware]
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/auth/signin',
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 6 })
      })
    },
    handler: async ({ body, request }) => {
      const result = await auth.api.signIn('credentials', {
        email: body.email,
        password: body.password,
        request
      })
      
      if (result.error) {
        throw err.badRequest(result.error)
      }
      
      return { success: true, user: result.user }
    }
  })
])

const server = new Server(routes)
server.use(authMiddleware)
```

## 认证中间件

创建认证中间件来保护路由：

```typescript
// src/auth/middleware.ts
import { err } from 'vafast'
import { auth } from './config'

import { defineMiddleware } from 'vafast'

export const authMiddleware = defineMiddleware(async (request, next) => {
  const session = await auth.api.getSession(request)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 通过 next 传递用户信息
  return await next({ user: session.user })
})

export const requireAuth = (handler: Function) => {
  return async (request: Request) => {
    const session = await auth.api.getSession(request)
    
    if (!session) {
      throw err.unauthorized('Authentication required')
    }
    
    // 将用户信息添加到请求上下文
    request.user = session.user
    
    return handler(request)
  }
}
```

## 路由保护

使用中间件保护需要认证的路由：

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import { authMiddleware } from './auth/middleware'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/profile',
    middleware: [authMiddleware],
    handler: ({ user }) => {
      // user 现在可用，自动有类型
      return { profile: user }
    }
  }),
  
  defineRoute({
    method: 'PUT',
    path: '/api/profile',
    schema: {
      body: Type.Object({
        name: Type.Optional(Type.String()),
        bio: Type.Optional(Type.String())
      })
    },
    middleware: [authMiddleware],
    handler: async ({ body, user }) => {
      const updatedProfile = await updateProfile(user.id, body)
      return { profile: updatedProfile }
    }
  })
])
```

> **新框架用法说明**：
> - 使用 `defineMiddleware` 定义中间件，通过 `next({ user })` 传递上下文
> - Handler 自动获得类型推断，无需手动类型断言

## OAuth 集成

配置 OAuth 提供商：

```typescript
// src/auth/config.ts
import { BetterAuth } from 'better-auth'
import { VafastAdapter } from 'better-auth/adapters/vafast'
import { GoogleProvider } from 'better-auth/providers/google'
import { GitHubProvider } from 'better-auth/providers/github'

export const auth = new BetterAuth({
  adapter: VafastAdapter({
    // ... 其他配置
    
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      }),
      
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET
      })
    ]
  })
})
```

## 会话管理

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { auth } from './auth/config'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/api/auth/signout',
    handler: async ({ request }) => {
      await auth.api.signOut(request)
      return { success: true }
    }
  }),
  
  defineRoute({
    method: 'GET',
    path: '/api/auth/session',
    handler: async ({ request }) => {
      const session = await auth.api.getSession(request)
      return { session }
    }
  })
])
```

## 角色和权限

Better Auth 支持基于角色的访问控制：

```typescript
// src/auth/config.ts
export const auth = new BetterAuth({
  adapter: VafastAdapter({
    // ... 其他配置
    
    callbacks: {
      session: async ({ session, user }) => {
        if (session.user) {
          session.user.role = user.role
          session.user.permissions = user.permissions
        }
        return session
      }
    }
  })
})
```

使用角色保护路由：

```typescript
import { defineRoute, defineRoutes, defineMiddleware, err } from 'vafast'

const requireRole = (role: string) => {
  return defineMiddleware(async (request, next) => {
    const session = await auth.api.getSession(request)
    
    if (!session || session.user.role !== role) {
      throw err.forbidden('Insufficient permissions')
    }
    
    return await next({ user: session.user })
  })
}

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/admin/users',
    middleware: [requireRole('admin')],
    handler: async ({ user }) => {
      // user 自动有类型
      const users = await getAllUsers()
      return { users }
    }
  })
])
```

## 错误处理

```typescript
import { defineRoute, defineRoutes, err, Type } from 'vafast'
import { auth } from './auth/config'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/api/auth/signin',
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 6 })
      })
    },
    handler: async ({ body, request }) => {
      const result = await auth.api.signIn('credentials', {
        email: body.email,
        password: body.password,
        request
      })
      
      if (result.error) {
        throw err.badRequest(result.error)
      }
      
      return { success: true, user: result.user }
    }
  })
])
```

## 与 CORS 集成

要配置 CORS，您可以使用 `@vafast/cors` 中的 `cors` 中间件。

```typescript
import { Server } from 'vafast'
import { cors } from '@vafast/cors'
import { auth } from './auth/config'

const routes = defineRoutes([
  // 你的路由定义
])

const server = new Server(routes)
server.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}))
server.use(auth.middleware)
```

## 环境变量

创建 `.env` 文件：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# 会话密钥
SESSION_SECRET="your-super-secret-key-here"

# OAuth 提供商
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# 其他配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 最佳实践

1. **安全配置**：使用强密码和 HTTPS
2. **会话管理**：定期轮换会话密钥
3. **错误处理**：不要暴露敏感信息
4. **日志记录**：记录认证事件用于审计
5. **速率限制**：防止暴力攻击

## 相关链接

- [Better Auth 文档](https://better-auth.com) - 官方文档
- [Vafast 中间件](/middleware) - 探索其他可用的中间件
- [Auth Middleware](/middleware/auth-middleware) - 微服务认证与路由类型包装
- [安全指南](/essential/security) - 安全最佳实践