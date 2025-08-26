---
title: 中间件和装饰器 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: 中间件和装饰器 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 提供了强大的中间件系统和请求装饰器，允许您为请求处理流程添加自定义逻辑和扩展功能。

  - - meta
    - property: 'og:description'
      content: Vafast 提供了强大的中间件系统和请求装饰器，允许您为请求处理流程添加自定义逻辑和扩展功能。
---

# 中间件和装饰器

Vafast 提供了强大的中间件系统和请求装饰器，允许您为请求处理流程添加自定义逻辑和扩展功能。

虽然 Vafast 没有 ElysiaJS 的宏系统，但它提供了更灵活和标准的中间件模式，以及强大的请求装饰器功能。

## 中间件系统

Vafast 的中间件系统基于标准的 Web 标准，每个中间件都是一个函数，接受 `Request` 和 `next` 函数：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 基本中间件
const loggingMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  
  const response = await next()
  
  const duration = Date.now() - startTime
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${response.status} (${duration}ms)`)
  
  return response
}

// 认证中间件
const authMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const token = req.headers.get('authorization')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 验证 token 并添加到请求中
  try {
    const user = await validateToken(token)
    ;(req as any).user = user
    return await next()
  } catch (error) {
    return new Response('Invalid token', { status: 401 })
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  },
  {
    method: 'GET',
    path: '/protected',
    handler: createRouteHandler(({ req }) => {
      const user = (req as any).user
      return `Hello ${user.name}!`
    }),
    middleware: [authMiddleware] // 路由特定中间件
  }
])

const server = new Server(routes)

// 全局中间件
server.use(loggingMiddleware)

export default { fetch: server.fetch }
```

## 中间件工厂

创建可配置的中间件：

```typescript
// 创建可配置的中间件
const createAuthMiddleware = (options: {
  required?: boolean
  roles?: string[]
  permissions?: string[]
}) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const token = req.headers.get('authorization')
    
    if (!token && options.required) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    if (!token && !options.required) {
      return await next()
    }
    
    try {
      const user = await validateToken(token)
      
      // 检查角色权限
      if (options.roles && !options.roles.includes(user.role)) {
        return new Response('Insufficient permissions', { status: 403 })
      }
      
      // 检查具体权限
      if (options.permissions && !options.permissions.some(p => user.permissions.includes(p))) {
        return new Response('Insufficient permissions', { status: 403 })
      }
      
      ;(req as any).user = user
      return await next()
    } catch (error) {
      return new Response('Invalid token', { status: 401 })
    }
  }
}

// 使用中间件工厂
const adminAuth = createAuthMiddleware({
  required: true,
  roles: ['admin'],
  permissions: ['read:users', 'write:users']
})

const userAuth = createAuthMiddleware({
  required: true,
  roles: ['user', 'admin']
})

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/admin/users',
    handler: createRouteHandler(() => 'Admin users'),
    middleware: [adminAuth]
  },
  {
    method: 'GET',
    path: '/profile',
    handler: createRouteHandler(() => 'User profile'),
    middleware: [userAuth]
  }
])
```

## 请求装饰器

Vafast 允许您通过中间件扩展请求对象，添加自定义属性和方法：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 用户装饰器中间件
const userDecorator = async (req: Request, next: () => Promise<Response>) => {
  // 扩展请求对象
  ;(req as any).getUser = () => {
    return (req as any).user
  }
  
  ;(req as any).isAuthenticated = () => {
    return !!(req as any).user
  }
  
  ;(req as any).hasRole = (role: string) => {
    const user = (req as any).user
    return user && user.role === role
  }
  
  ;(req as any).hasPermission = (permission: string) => {
    const user = (req as any).user
    return user && user.permissions.includes(permission)
  }
  
  return await next()
}

// 缓存装饰器中间件
const cacheDecorator = (cache: Map<string, any>) => {
  return async (req: Request, next: () => Promise<Response>) => {
    ;(req as any).cache = {
      get: (key: string) => cache.get(key),
      set: (key: string, value: any) => cache.set(key, value),
      delete: (key: string) => cache.delete(key),
      clear: () => cache.clear()
    }
    
    return await next()
  }
}

// 数据库装饰器中间件
const databaseDecorator = (db: any) => {
  return async (req: Request, next: () => Promise<Response>) => {
    ;(req as any).db = db
    
    ;(req as any).query = async (sql: string, params: any[] = []) => {
      return await db.query(sql, params)
    }
    
    ;(req as any).transaction = async (callback: (req: Request) => Promise<any>) => {
      return await db.transaction(async () => {
        return await callback(req)
      })
    }
    
    return await next()
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/user/:id',
    handler: createRouteHandler(async ({ req, params }) => {
      // 使用装饰器添加的方法
      if (!(req as any).isAuthenticated()) {
        return new Response('Unauthorized', { status: 401 })
      }
      
      if (!(req as any).hasPermission('read:users')) {
        return new Response('Insufficient permissions', { status: 403 })
      }
      
      // 使用数据库装饰器
      const user = await (req as any).query('SELECT * FROM users WHERE id = ?', [params.id])
      
      // 使用缓存装饰器
      const cacheKey = `user:${params.id}`
      let cachedUser = (req as any).cache.get(cacheKey)
      
      if (!cachedUser) {
        cachedUser = user[0]
        (req as any).cache.set(cacheKey, cachedUser)
      }
      
      return cachedUser
    })
  }
])

const server = new Server(routes)

// 应用装饰器中间件
server.use(userDecorator)
server.use(cacheDecorator(new Map()))
server.use(databaseDecorator(/* 数据库连接 */))

export default { fetch: server.fetch }
```

## 中间件组合

组合多个中间件创建复杂的处理流程：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 中间件组合器
const composeMiddleware = (...middlewares: any[]) => {
  return async (req: Request, next: () => Promise<Response>) => {
    let index = 0
    
    const executeNext = async (): Promise<Response> => {
      if (index >= middlewares.length) {
        return await next()
      }
      
      const middleware = middlewares[index++]
      return await middleware(req, executeNext)
    }
    
    return await executeNext()
  }
}

// 条件中间件
const conditionalMiddleware = (
  condition: (req: Request) => boolean,
  middleware: any
) => {
  return async (req: Request, next: () => Promise<Response>) => {
    if (condition(req)) {
      return await middleware(req, next)
    }
    return await next()
  }
}

// 重试中间件
const retryMiddleware = (maxRetries: number = 3) => {
  return async (req: Request, next: () => Promise<Response>) => {
    let lastError: Error
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await next()
      } catch (error) {
        lastError = error as Error
        
        if (i === maxRetries) {
          throw lastError
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
    
    throw lastError!
  }
}

// 限流中间件
const rateLimitMiddleware = (options: {
  windowMs: number
  max: number
  keyGenerator?: (req: Request) => string
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return async (req: Request, next: () => Promise<Response>) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const requestData = requests.get(key)
    
    if (!requestData || now > requestData.resetTime) {
      requests.set(key, { count: 1, resetTime: now + options.windowMs })
    } else {
      requestData.count++
      
      if (requestData.count > options.max) {
        return new Response('Too Many Requests', { status: 429 })
      }
    }
    
    return await next()
  }
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/data',
    handler: createRouteHandler(async ({ req }) => {
      // 使用数据库查询
      const data = await (req as any).query('SELECT * FROM data')
      return data
    }),
    middleware: [
      // 组合多个中间件
      composeMiddleware(
        rateLimitMiddleware({ windowMs: 60000, max: 100 }),
        retryMiddleware(3),
        conditionalMiddleware(
          (req) => req.headers.get('x-debug') === 'true',
          async (req: Request, next: () => Promise<Response>) => {
            console.log('Debug mode enabled')
            return await next()
          }
        )
      )
    ]
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## 类型安全的装饰器

使用 TypeScript 确保装饰器的类型安全：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 扩展 Request 类型
interface ExtendedRequest extends Request {
  user?: {
    id: string
    name: string
    role: string
    permissions: string[]
  }
  cache?: {
    get: (key: string) => any
    set: (key: string, value: any) => void
    delete: (key: string) => void
    clear: () => void
  }
  db?: {
    query: (sql: string, params?: any[]) => Promise<any>
    transaction: (callback: () => Promise<any>) => Promise<any>
  }
  isAuthenticated: () => boolean
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
}

// 类型安全的中间件
const typedUserDecorator = async (req: ExtendedRequest, next: () => Promise<Response>) => {
  req.isAuthenticated = () => !!req.user
  req.hasRole = (role: string) => req.user?.role === role
  req.hasPermission = (permission: string) => req.user?.permissions.includes(permission) || false
  
  return await next()
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/admin',
    handler: createRouteHandler(({ req }: { req: ExtendedRequest }) => {
      if (!req.isAuthenticated()) {
        return new Response('Unauthorized', { status: 401 })
      }
      
      if (!req.hasRole('admin')) {
        return new Response('Insufficient permissions', { status: 403 })
      }
      
      return 'Admin panel'
    })
  }
])

const server = new Server(routes)
server.use(typedUserDecorator)

export default { fetch: server.fetch }
```

## 中间件测试

测试中间件和装饰器：

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

describe('Middleware and Decorators', () => {
  it('should apply global middleware', async () => {
    const log: string[] = []
    
    const loggingMiddleware = async (req: Request, next: () => Promise<Response>) => {
      log.push('before')
      const response = await next()
      log.push('after')
      return response
    }
    
    const routes = defineRoutes([
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => 'Hello')
      }
    ])
    
    const server = new Server(routes)
    server.use(loggingMiddleware)
    
    const response = await server.fetch(new Request('http://localhost/'))
    
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Hello')
    expect(log).toEqual(['before', 'after'])
  })
  
  it('should apply route-specific middleware', async () => {
    const log: string[] = []
    
    const routeMiddleware = async (req: Request, next: () => Promise<Response>) => {
      log.push('route middleware')
      return await next()
    }
    
    const routes = defineRoutes([
      {
        method: 'GET',
        path: '/protected',
        handler: createRouteHandler(() => 'Protected'),
        middleware: [routeMiddleware]
      }
    ])
    
    const server = new Server(routes)
    
    const response = await server.fetch(new Request('http://localhost/protected'))
    
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Protected')
    expect(log).toEqual(['route middleware'])
  })
  
  it('should decorate request object', async () => {
    const userDecorator = async (req: Request, next: () => Promise<Response>) => {
      ;(req as any).user = { id: '1', name: 'Test User' }
      ;(req as any).isAuthenticated = () => true
      
      return await next()
    }
    
    const routes = defineRoutes([
      {
        method: 'GET',
        path: '/profile',
        handler: createRouteHandler(({ req }) => {
          const user = (req as any).user
          const isAuth = (req as any).isAuthenticated()
          
          return { user, isAuthenticated: isAuth }
        })
      }
    ])
    
    const server = new Server(routes)
    server.use(userDecorator)
    
    const response = await server.fetch(new Request('http://localhost/profile'))
    const data = await response.json()
    
    expect(data.user).toEqual({ id: '1', name: 'Test User' })
    expect(data.isAuthenticated).toBe(true)
  })
})
```

## 总结

Vafast 的中间件和装饰器系统提供了：

- ✅ 标准的中间件模式
- ✅ 可配置的中间件工厂
- ✅ 请求对象装饰器
- ✅ 中间件组合和条件执行
- ✅ 类型安全的装饰器
- ✅ 完整的测试支持
- ✅ 灵活的中间件链

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强功能
- 探索 [验证系统](/essential/validation) 了解类型安全
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
