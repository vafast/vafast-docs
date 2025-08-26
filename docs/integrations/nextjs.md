---
title: Next.js 集成 - Vafast
---

# Next.js 集成

Vafast 可以与 Next.js 无缝集成，为您提供强大的后端 API 和现代化的前端开发体验。

## 项目结构

```
my-vafast-nextjs-app/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── api/                 # Vafast API 路由
│   │   ├── routes.ts        # 路由定义
│   │   ├── server.ts        # Vafast 服务器
│   │   └── types.ts         # 类型定义
│   └── lib/                 # 共享库
├── package.json
└── next.config.js
```

## 安装依赖

```bash
bun add vafast @vafast/cors @vafast/helmet
bun add -D @types/node
```

## 创建 Vafast API 服务器

```typescript
// src/api/server.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'
import { routes } from './routes'

export const app = createRouteHandler(routes)
  .use(cors({
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000'] 
      : [process.env.NEXT_PUBLIC_APP_URL],
    credentials: true
  }))
  .use(helmet())

export const handler = app.handler
```

## 定义 API 路由

```typescript
// src/api/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

export const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/users',
    handler: createRouteHandler(async () => {
      // 模拟数据库查询
      const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ]
      
      return { users }
    })
  },
  
  {
    method: 'POST',
    path: '/api/users',
    handler: createRouteHandler(async ({ body }) => {
      // 创建新用户
      const newUser = {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
      
      return { user: newUser }, { status: 201 }
    }),
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      email: Type.String({ format: 'email' })
    })
  },
  
  {
    method: 'GET',
    path: '/api/users/:id',
    handler: createRouteHandler(async ({ params }) => {
      const userId = parseInt(params.id)
      
      // 模拟数据库查询
      const user = { id: userId, name: 'John Doe', email: 'john@example.com' }
      
      if (!user) {
        return { error: 'User not found' }, { status: 404 }
      }
      
      return { user }
    }),
    params: Type.Object({
      id: Type.String({ pattern: '^\\d+$' })
    })
  }
])
```

## 创建 API 路由处理器

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

## 类型定义

```typescript
// src/api/types.ts
import { Type } from '@sinclair/typebox'

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

## 前端集成

### 使用 API 路由

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

### 创建用户表单

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
        // 重定向到用户列表
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

## 中间件集成

### 认证中间件

```typescript
// src/api/middleware/auth.ts
import { NextFunction } from 'next/server'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authMiddleware = async (
  request: Request,
  next: NextFunction
) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    // 验证 JWT token
    const user = await verifyToken(token)
    ;(request as AuthenticatedRequest).user = user
    return next()
  } catch (error) {
    return new Response('Invalid token', { status: 401 })
  }
}

async function verifyToken(token: string) {
  // 实现 JWT 验证逻辑
  // 这里应该使用 @vafast/jwt 中间件
  return { id: '123', email: 'user@example.com', role: 'user' }
}
```

### 使用认证中间件

```typescript
// src/api/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { authMiddleware } from './middleware/auth'

export const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/profile',
    handler: createRouteHandler(async ({ request }) => {
      const user = (request as AuthenticatedRequest).user
      return { user }
    }),
    middleware: [authMiddleware]
  }
])
```

## 环境配置

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

## 开发和生产配置

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

## 测试

### API 测试

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

## 部署

### Vercel 部署

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

### Docker 部署

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

## 最佳实践

1. **类型安全**：使用 TypeBox 确保前后端类型一致
2. **错误处理**：实现统一的错误处理机制
3. **中间件顺序**：注意中间件的执行顺序
4. **环境配置**：根据环境配置不同的设置
5. **测试覆盖**：为 API 路由编写完整的测试
6. **性能优化**：使用适当的缓存和压缩策略

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [Next.js 文档](https://nextjs.org/docs) - Next.js 官方文档
- [中间件系统](/middleware) - 探索可用的中间件
- [类型验证](/patterns/type) - 了解类型验证系统
