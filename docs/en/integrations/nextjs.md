---
title: Next.js Integration - Vafast
description: 'Guide to integrating Vafast with Next.js: project structure, creating a Vafast API server and Next.js API route handler, type definitions and frontend integration.'
---

# Next.js Integration

Vafast integrates seamlessly with Next.js, giving you a powerful backend API and a modern frontend development experience.

## Project Structure

```
my-vafast-nextjs-app/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── api/                 # Vafast API routes
│   │   ├── routes.ts        # route definitions
│   │   ├── server.ts        # Vafast server
│   │   └── types.ts         # type definitions
│   └── lib/                 # shared libraries
├── package.json
└── next.config.js
```

## Installing Dependencies

```bash
# npm
npm install vafast @vafast/cors @vafast/helmet
npm install -D @types/node

# or with bun
npm install vafast @vafast/cors @vafast/helmet
npm install -D @types/node
```

## Creating the Vafast API Server

```typescript
// src/api/server.ts
import { Server } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'
import { routes } from './routes'

const server = new Server(routes)
server.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000'] 
    : [process.env.NEXT_PUBLIC_APP_URL],
  credentials: true
}))
server.use(helmet())

export const handler = server.fetch
```

## Defining API Routes

```typescript
// src/api/routes.ts
import { defineRoute, defineRoutes, err, Type } from 'vafast'

export const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    handler: async () => {
      // simulate a database query
      const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ]
      
      return { users }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/users',
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.String({ format: 'email' })
      })
    },
    handler: async ({ body }) => {
      // create a new user
      const newUser = {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
      
      return { user: newUser }
    }
  }),
  
  defineRoute({
    method: 'GET',
    path: '/api/users/:id',
    handler: async ({ params }) => {
      const userId = parseInt(params.id)
      
      // simulate a database query
      const user = { id: userId, name: 'John Doe', email: 'john@example.com' }
      
      if (!user) {
        throw err.notFound('User not found')
      }
      
      return { user }
    },
    schema: {
      params: Type.Object({
        id: Type.String({ pattern: '^\\d+$' })
      })
    }
  })
])
```

## Creating the API Route Handler

```typescript
// src/app/api/[...path]/route.ts
import { handler } from '@/api/server'

export async function GET(request: Request) {
  return handler(request)
}

export async function POST(request: Request) {
  return handler(request)
}

export async function PUT(request: Request) {
  return handler(request)
}

export async function DELETE(request: Request) {
  return handler(request)
}

export async function PATCH(request: Request) {
  return handler(request)
}
```

## Type Definitions

```typescript
// src/api/types.ts
import { Type } from 'vafast'

export const UserSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  createdAt: Type.String({ format: 'date-time' })
})

export const CreateUserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

export type User = typeof UserSchema.T
export type CreateUser = typeof CreateUserSchema.T
```

## Frontend Integration

### Using the API Routes

```typescript
// src/app/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { User } from '@/api/types'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching users:', error)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Creating a User Form

```typescript
// src/app/users/create/page.tsx
'use client'

import { useState } from 'react'
import { CreateUser } from '@/api/types'

export default function CreateUserPage() {
  const [formData, setFormData] = useState<CreateUser>({
    name: '',
    email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('User created:', result.user)
        // redirect to the user list
        window.location.href = '/users'
      } else {
        const error = await response.json()
        console.error('Error creating user:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div>
      <h1>Create User</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        
        <button type="submit">Create User</button>
      </form>
    </div>
  )
}
```

## Middleware Integration

### Auth Middleware

::: tip Recommended for production
For full user authentication, use [@vafast/auth-middleware](/en/middleware/auth-middleware) (`authWithApp`, `requireUser`). Below is how to integrate it in Next.js API routes.
:::

```typescript
// src/api/routes.ts
import { defineRoute, defineRoutes } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'

export const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [authWithApp],
    children: [
      defineAuthRouteWithApp({
        method: 'GET',
        path: '/profile',
        middleware: [requireUser],
        handler: ({ userInfo, app }) => ({
          userId: userInfo.id,
          appId: app.id,
        }),
      }),
    ],
  }),
])
```

If you only need simple JWT verification (no separate auth service), see [@vafast/jwt](/en/middleware/jwt) or write your own `defineMiddleware`.

## Environment Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['vafast']
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/[...path]'
      }
    ]
  }
}

module.exports = nextConfig
```

## Development and Production Config

```typescript
// src/api/config.ts
export const config = {
  development: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001']
    },
    logging: true
  },
  
  production: {
    cors: {
      origin: [process.env.NEXT_PUBLIC_APP_URL]
    },
    logging: false
  }
}

export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return config[env as keyof typeof config]
}
```

## Testing

### API Tests

```typescript
// src/api/__tests__/users.test.ts
import { describe, expect, it } from 'bun:test'
import { handler } from '../server'

describe('Users API', () => {
  it('should get users', async () => {
    const request = new Request('http://localhost/api/users')
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.users).toBeDefined()
    expect(Array.isArray(data.users)).toBe(true)
  })
  
  it('should create user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com'
    }
    
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.user.name).toBe(userData.name)
    expect(data.user.email).toBe(userData.email)
  })
})
```

## Deployment

### Vercel Deployment

```json
// vercel.json
{
  "functions": {
    "src/app/api/[...path]/route.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/[...path]"
    }
  ]
}
```

### Docker Deployment

**Node.js version (recommended):**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

**Bun version:**

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["bun", "server.js"]
```

## Best Practices

1. **Type safety**: use TypeBox to keep frontend and backend types consistent
2. **Error handling**: implement a unified error handling mechanism
3. **Middleware order**: pay attention to middleware execution order
4. **Environment config**: use different settings per environment
5. **Test coverage**: write thorough tests for API routes
6. **Performance**: use appropriate caching and compression strategies

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [Next.js docs](https://nextjs.org/docs) - official Next.js documentation
- [Middleware system](/en/middleware) - explore available middleware
- [Type validation](/en/patterns/type) - learn about the type validation system
