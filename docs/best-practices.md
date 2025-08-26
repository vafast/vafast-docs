---
title: 最佳实践 - Vafast
---

# 最佳实践

本文档提供了使用 Vafast 框架开发应用的最佳实践和设计模式。遵循这些建议将帮助您构建更高质量、更易维护的应用程序。

## 项目结构

### 推荐的目录结构

```
src/
├── routes/           # 路由定义
│   ├── index.ts     # 主路由文件
│   ├── user.ts      # 用户相关路由
│   ├── admin.ts     # 管理相关路由
│   └── api.ts       # API 路由
├── middleware/       # 中间件
│   ├── auth.ts      # 身份验证中间件
│   ├── cors.ts      # CORS 中间件
│   ├── validation.ts # 验证中间件
│   └── index.ts     # 中间件导出
├── services/         # 业务逻辑服务
│   ├── userService.ts
│   ├── authService.ts
│   └── emailService.ts
├── models/           # 数据模型
│   ├── User.ts
│   ├── Post.ts
│   └── Comment.ts
├── utils/            # 工具函数
│   ├── validation.ts
│   ├── encryption.ts
│   └── helpers.ts
├── config/           # 配置文件
│   ├── database.ts
│   ├── redis.ts
│   └── app.ts
└── index.ts          # 应用入口
```

### 路由组织

```typescript
// routes/index.ts
import { userRoutes } from './user'
import { adminRoutes } from './admin'
import { apiRoutes } from './api'

export const routes: any[] = [
  {
    path: '/',
    component: () => import('../components/pages/Home.vue')
  },
  ...userRoutes,
  ...adminRoutes,
  ...apiRoutes
]
```

```typescript
// routes/user.ts
export const userRoutes: any[] = [
  {
    path: '/user',
    middleware: [authMiddleware],
    children: [
      {
        method: 'GET',
        path: '/profile',
        handler: userController.getProfile
      },
      {
        method: 'PUT',
        path: '/profile',
        handler: userController.updateProfile
      }
    ]
  }
]
```

## 代码组织

### 控制器模式

将路由处理逻辑分离到控制器中：

```typescript
// controllers/userController.ts
export class UserController {
  async getProfile(req: Request, params?: Record<string, string>) {
    try {
      const userId = (req as any).user.id
      const user = await userService.findById(userId)
      
      return new Response(JSON.stringify(user), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response('Failed to get profile', { status: 500 })
    }
  }
  
  async updateProfile(req: Request, params?: Record<string, string>) {
    try {
      const userId = (req as any).user.id
      const body = await req.json()
      
      // 验证数据
      const validatedData = await validateUserUpdate(body)
      
      const updatedUser = await userService.update(userId, validatedData)
      
      return new Response(JSON.stringify(updatedUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response('Failed to update profile', { status: 500 })
    }
  }
}

export const userController = new UserController()
```

### 服务层模式

将业务逻辑封装在服务中：

```typescript
// services/userService.ts
export class UserService {
  async findById(id: string) {
    // 数据库查询逻辑
    const user = await db.user.findUnique({ where: { id } })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    return user
  }
  
  async update(id: string, data: Partial<User>) {
    // 数据更新逻辑
    const updatedUser = await db.user.update({
      where: { id },
      data
    })
    
    return updatedUser
  }
  
  async delete(id: string) {
    // 数据删除逻辑
    await db.user.delete({ where: { id } })
  }
}

export const userService = new UserService()
```

### 中间件组织

将中间件按功能分组：

```typescript
// middleware/index.ts
export { authMiddleware } from './auth'
export { corsMiddleware } from './cors'
export { validationMiddleware } from './validation'
export { rateLimitMiddleware } from './rateLimit'
export { logMiddleware } from './log'

// 组合中间件
export const commonMiddleware = [
  logMiddleware,
  corsMiddleware,
  rateLimitMiddleware
]

export const protectedMiddleware = [
  ...commonMiddleware,
  authMiddleware
]
```

## 错误处理

### 统一错误处理

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}
```

### 错误处理中间件

```typescript
// middleware/errorHandler.ts
import { AppError } from '../utils/errors'

export const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    console.error('Error:', error)
    
    if (error instanceof AppError) {
      return new Response(JSON.stringify({
        error: error.message,
        code: error.code,
        statusCode: error.statusCode
      }), {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 未知错误
    return new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

## 数据验证

### 使用 Zod 进行验证

```typescript
// utils/validation.ts
import { z } from 'zod'

export const userCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
  password: z.string().min(8)
})

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true })

export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
```

### 验证中间件

```typescript
// middleware/validation.ts
import { z } from 'zod'

export const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, next: () => Promise<Response>) => {
    try {
      const body = await req.json()
      const validatedData = schema.parse(body)
      
      // 将验证后的数据添加到请求中
      ;(req as any).validatedBody = validatedData
      
      return next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          error: 'Validation failed',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response('Invalid JSON', { status: 400 })
    }
  }
}

export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, next: () => Promise<Response>) => {
    try {
      const url = new URL(req.url)
      const queryParams = Object.fromEntries(url.searchParams.entries())
      const validatedData = schema.parse(queryParams)
      
      ;(req as any).validatedQuery = validatedData
      
      return next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          error: 'Query validation failed',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return next()
    }
  }
}
```

## 安全性最佳实践

### 身份验证

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken'

export const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization header')
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    
    ;(req as any).user = decoded
    
    return next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token')
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired')
    }
    
    throw error
  }
}
```

### 速率限制

```typescript
// middleware/rateLimit.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const key = `${ip}:${Math.floor(now / windowMs)}`
    
    const current = rateLimitMap.get(key)
    
    if (current && current.resetTime > now) {
      if (current.count >= maxRequests) {
        return new Response(JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
          }
        })
      }
      current.count++
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    }
    
    return next()
  }
}
```

### 输入清理

```typescript
// utils/sanitization.ts
import DOMPurify from 'isomorphic-dompurify'

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html)
}

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}
```

## 性能优化

### 路由缓存

```typescript
// utils/cache.ts
const routeCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const cacheKey = `${req.method}:${req.url}`
    const cached = routeCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return new Response(cached.data, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`
        }
      })
    }
    
    const response = await next()
    
    if (response.status === 200) {
      const data = await response.clone().text()
      routeCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      })
    }
    
    return response
  }
}
```

### 数据库查询优化

```typescript
// services/userService.ts
export class UserService {
  async findByIdWithPosts(id: string) {
    // 使用 include 避免 N+1 查询
    const user = await db.user.findUnique({
      where: { id },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })
    
    return user
  }
  
  async findManyWithPagination(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.user.count()
    ])
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
}
```

## 测试策略

### 单元测试

```typescript
// tests/services/userService.test.ts
import { test, expect, describe, beforeEach } from 'bun:test'
import { UserService } from '../../src/services/userService'

describe('UserService', () => {
  let userService: UserService
  
  beforeEach(() => {
    userService = new UserService()
  })
  
  test('should create user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    }
    
    const user = await userService.create(userData)
    
    expect(user.name).toBe(userData.name)
    expect(user.email).toBe(userData.email)
    expect(user.password).not.toBe(userData.password) // 应该被哈希
  })
  
  test('should throw error for duplicate email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'password123'
    }
    
    await expect(userService.create(userData)).rejects.toThrow('Email already exists')
  })
})
```

### 集成测试

```typescript
// tests/integration/user.test.ts
import { test, expect, describe, beforeAll, afterAll } from 'bun:test'
import { Server } from 'vafast'
import { userRoutes } from '../../src/routes/user'

describe('User API Integration', () => {
  let server: Server
  
  beforeAll(() => {
    server = new Server(userRoutes)
  })
  
  test('GET /user/profile should return user profile', async () => {
    const req = new Request('http://localhost:3000/user/profile', {
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    })
    
    const response = await server.fetch(req)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('email')
  })
  
  test('PUT /user/profile should update user profile', async () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    }
    
    const req = new Request('http://localhost:3000/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    
    const response = await server.fetch(req)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.name).toBe(updateData.name)
    expect(data.email).toBe(updateData.email)
  })
})
```

## 环境配置

### 配置管理

```typescript
// config/app.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  REDIS_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
})

export const config = envSchema.parse(process.env)

export const isDevelopment = config.NODE_ENV === 'development'
export const isProduction = config.NODE_ENV === 'production'
export const isTest = config.NODE_ENV === 'test'
```

### 环境特定配置

```typescript
// config/database.ts
import { config } from './app'

export const databaseConfig = {
  url: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  pool: {
    min: isProduction ? 5 : 1,
    max: isProduction ? 20 : 5
  }
}
```

## 日志记录

### 结构化日志

```typescript
// utils/logger.ts
export class Logger {
  private formatMessage(level: string, message: string, meta?: any) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    })
  }
  
  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta))
  }
  
  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta))
  }
  
  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta))
  }
  
  debug(message: string, meta?: any) {
    if (isDevelopment) {
      console.log(this.formatMessage('debug', message, meta))
    }
  }
}

export const logger = new Logger()
```

### 请求日志中间件

```typescript
// middleware/log.ts
import { logger } from '../utils/logger'

export const logMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const start = Date.now()
  const method = req.method
  const url = req.url
  const userAgent = req.headers.get('user-agent')
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  
  logger.info('Request started', {
    method,
    url,
    userAgent,
    ip,
    timestamp: new Date().toISOString()
  })
  
  try {
    const response = await next()
    const duration = Date.now() - start
    
    logger.info('Request completed', {
      method,
      url,
      status: response.status,
      duration,
      timestamp: new Date().toISOString()
    })
    
    return response
  } catch (error) {
    const duration = Date.now() - start
    
    logger.error('Request failed', {
      method,
      url,
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}
```

## 总结

遵循这些最佳实践将帮助您：

- ✅ 构建可维护的代码结构
- ✅ 实现安全的应用程序
- ✅ 优化性能和用户体验
- ✅ 建立可靠的测试策略
- ✅ 管理环境配置
- ✅ 实现有效的日志记录

### 下一步

- 查看 [路由指南](/routing) 了解路由系统
- 学习 [中间件系统](/middleware) 了解中间件用法
- 探索 [组件路由](/component-routing) 了解组件路由功能
- 查看 [API 参考](/api) 获取完整的 API 文档

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
