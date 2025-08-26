---
title: Better Auth 集成 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Better Auth 集成 - Vafast

  - - meta
    - name: 'description'
      content: 在 Vafast 中集成 Better Auth 进行身份验证和授权管理，支持多种认证方式包括 OAuth、密码、魔法链接等。

  - - meta
    - property: 'og:description'
      content: 在 Vafast 中集成 Better Auth 进行身份验证和授权管理，支持多种认证方式包括 OAuth、密码、魔法链接等。
---

# Better Auth 集成

Better Auth 是一个现代化的身份验证库，专为现代 Web 应用设计。它提供了一整套全面的功能，并包括一个中间件生态系统，可以简化添加高级功能。

## 安装

```bash
bun add better-auth
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
import { defineRoutes, createRouteHandler } from 'vafast'
import { auth } from './auth/config'
import { authMiddleware } from './auth/middleware'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/user',
    handler: createRouteHandler(async ({ request }) => {
      const session = await auth.api.getSession(request)
      if (!session) {
        return { error: 'Unauthorized' }, { status: 401 }
      }
      return { user: session.user }
    }),
    middleware: [authMiddleware]
  },
  
  {
    method: 'POST',
    path: '/api/auth/signin',
    handler: createRouteHandler(async ({ body, request }) => {
      const result = await auth.api.signIn('credentials', {
        email: body.email,
        password: body.password,
        request
      })
      
      if (result.error) {
        return { error: result.error }, { status: 400 }
      }
      
      return { success: true, user: result.user }
    }),
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      password: Type.String({ minLength: 6 })
    })
  }
])

const app = createRouteHandler(routes)
  .use(authMiddleware)
```

## 认证中间件

创建认证中间件来保护路由：

```typescript
// src/auth/middleware.ts
import { auth } from './config'

export const authMiddleware = async (request: Request, next: () => Promise<Response>) => {
  const session = await auth.api.getSession(request)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 将用户信息添加到请求上下文
  request.user = session.user
  
  return next()
}

export const requireAuth = (handler: Function) => {
  return async (request: Request) => {
    const session = await auth.api.getSession(request)
    
    if (!session) {
      return { error: 'Authentication required' }, { status: 401 }
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
import { defineRoutes, createRouteHandler } from 'vafast'
import { requireAuth } from './auth/middleware'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/profile',
    handler: requireAuth(createRouteHandler(({ request }) => {
      // request.user 现在可用
      return { profile: request.user }
    }))
  },
  
  {
    method: 'PUT',
    path: '/api/profile',
    handler: requireAuth(createRouteHandler(async ({ body, request }) => {
      const updatedProfile = await updateProfile(request.user.id, body)
      return { profile: updatedProfile }
    })),
    body: Type.Object({
      name: Type.Optional(Type.String()),
      bio: Type.Optional(Type.String())
    })
  }
])
```

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
import { defineRoutes, createRouteHandler } from 'vafast'
import { auth } from './auth/config'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/api/auth/signout',
    handler: createRouteHandler(async ({ request }) => {
      await auth.api.signOut(request)
      return { success: true }
    })
  },
  
  {
    method: 'GET',
    path: '/api/auth/session',
    handler: createRouteHandler(async ({ request }) => {
      const session = await auth.api.getSession(request)
      return { session }
    })
  }
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
import { defineRoutes, createRouteHandler } from 'vafast'

const requireRole = (role: string) => {
  return async (request: Request) => {
    const session = await auth.api.getSession(request)
    
    if (!session || session.user.role !== role) {
      return { error: 'Insufficient permissions' }, { status: 403 }
    }
    
    request.user = session.user
    return true
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/admin/users',
    handler: createRouteHandler(async ({ request }) => {
      const authResult = await requireRole('admin')(request)
      if (authResult !== true) return authResult
      
      const users = await getAllUsers()
      return { users }
    })
  }
])
```

## 错误处理

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { auth } from './auth/config'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/api/auth/signin',
    handler: createRouteHandler(async ({ body, request }) => {
      try {
        const result = await auth.api.signIn('credentials', {
          email: body.email,
          password: body.password,
          request
        })
        
        if (result.error) {
          return { error: result.error }, { status: 400 }
        }
        
        return { success: true, user: result.user }
      } catch (error) {
        console.error('Authentication error:', error)
        return { error: 'Internal server error' }, { status: 500 }
      }
    })
  }
])
```

## 与 CORS 集成

要配置 CORS，您可以使用 `@vafast/cors` 中的 `cors` 中间件。

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { cors } from '@vafast/cors'
import { auth } from './auth/config'

const routes = defineRoutes([
  // 你的路由定义
])

const app = createRouteHandler(routes)
  .use(cors({
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true
  }))
  .use(auth.middleware)
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
- [认证最佳实践](/patterns/auth) - 了解认证模式
- [安全指南](/essential/security) - 安全最佳实践