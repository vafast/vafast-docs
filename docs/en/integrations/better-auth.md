---
title: Better Auth Integration - Vafast
description: 'Integrate Better Auth with Vafast: installation and setup, auth middleware, route protection, OAuth sign-in and session management, and how it differs from @vafast/auth-middleware.'
---

# Better Auth Integration

Better Auth is a modern authentication library designed for modern web apps. It provides a comprehensive set of features and includes a plugin ecosystem that makes adding advanced functionality easy.

## How It Differs from @vafast/auth-middleware

| | Better Auth | [@vafast/auth-middleware](/en/middleware/auth-middleware) |
|---|---|---|
| **Use case** | Build complete auth inside your app (sign-up/sign-in/OAuth/sessions) | Microservices connecting to an existing auth service |
| **Data storage** | Ships its own adapters and connects directly to your database | No local user table; verifies JWTs / API keys remotely |
| **Typical project** | Standalone full-stack apps, SaaS that needs OAuth | Multi-tenant APIs, backend services isolated per app |

The two can coexist: a full-stack app manages users with Better Auth, while business microservices use `@vafast/auth-middleware` to verify tokens issued by the auth service.

## Installation

```bash
npm install better-auth
```

## Basic Setup

First, create a Better Auth config file:

```typescript
// src/auth/config.ts
import { BetterAuth } from 'better-auth'
import { VafastAdapter } from 'better-auth/adapters/vafast'

export const auth = new BetterAuth({
  adapter: VafastAdapter({
    // database config
    database: {
      url: process.env.DATABASE_URL,
      type: 'postgresql'
    },
    
    // session config
    session: {
      secret: process.env.SESSION_SECRET,
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24 // 1 day
    },
    
    // auth config
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

## Using It in Vafast

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
```

Attach the auth middleware at the **route level**; there's no need to register `server.use(authMiddleware)` globally as well.

## Auth Middleware

Create an auth middleware to protect routes:

```typescript
// src/auth/middleware.ts
import { err } from 'vafast'
import { auth } from './config'

import { defineMiddleware } from 'vafast'

export const authMiddleware = defineMiddleware(async (request, next) => {
  const session = await auth.api.getSession(request)
  
  if (!session) {
    throw err.unauthorized('Unauthorized')
  }
  
  return await next({ user: session.user })
})

export const requireAuth = (handler: Function) => {
  return async (request: Request) => {
    const session = await auth.api.getSession(request)
    
    if (!session) {
      throw err.unauthorized('Authentication required')
    }
    
    // add the user info to the request context
    request.user = session.user
    
    return handler(request)
  }
}
```

## Route Protection

Use the middleware to protect routes that require authentication:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import { authMiddleware } from './auth/middleware'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/profile',
    middleware: [authMiddleware],
    handler: ({ user }) => {
      // user is now available and typed automatically
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

> **Notes on the new framework API**:
> - Define middleware with `defineMiddleware` and pass context via `next({ user })`
> - Handlers get type inference automatically, no manual type assertions needed

## OAuth Integration

Configure OAuth providers:

```typescript
// src/auth/config.ts
import { BetterAuth } from 'better-auth'
import { VafastAdapter } from 'better-auth/adapters/vafast'
import { GoogleProvider } from 'better-auth/providers/google'
import { GitHubProvider } from 'better-auth/providers/github'

export const auth = new BetterAuth({
  adapter: VafastAdapter({
    // ... other config
    
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

## Session Management

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

## Roles and Permissions

Better Auth supports role-based access control:

```typescript
// src/auth/config.ts
export const auth = new BetterAuth({
  adapter: VafastAdapter({
    // ... other config
    
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

Protect routes with roles:

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
      // user is typed automatically
      const users = await getAllUsers()
      return { users }
    }
  })
])
```

## Error Handling

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

## CORS Integration

To configure CORS, you can use the `cors` middleware from `@vafast/cors`.

```typescript
import { Server } from 'vafast'
import { cors } from '@vafast/cors'
import { auth } from './auth/config'

const routes = defineRoutes([
  // your route definitions
])

const server = new Server(routes)
server.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}))
server.use(auth.middleware)
```

## Environment Variables

Create a `.env` file:

```env
# database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# session secret
SESSION_SECRET="your-super-secret-key-here"

# OAuth providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# other config
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## Best Practices

1. **Secure configuration**: use strong secrets and HTTPS
2. **Session management**: rotate session secrets regularly
3. **Error handling**: don't expose sensitive information
4. **Logging**: log auth events for auditing
5. **Rate limiting**: prevent brute-force attacks

## Related Links

- [Better Auth docs](https://better-auth.com) - official documentation
- [Vafast middleware](/en/middleware) - explore other available middleware
- [Auth Middleware](/en/middleware/auth-middleware) - microservice auth and route type wrapping
- [Best practices](/en/essential/best-practice) - project conventions and production hardening