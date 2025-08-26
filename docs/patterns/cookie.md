---
title: Cookie 处理 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Cookie 处理 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 提供了简单而强大的 Cookie 处理功能，支持读取、设置和删除 Cookie，以及各种 Cookie 属性的配置。

  - - meta
    - property: 'og:description'
      content: Vafast 提供了简单而强大的 Cookie 处理功能，支持读取、设置和删除 Cookie，以及各种 Cookie 属性的配置。
---

# Cookie 处理

Vafast 提供了简单而强大的 Cookie 处理功能，支持读取、设置和删除 Cookie，以及各种 Cookie 属性的配置。

## 基本用法

在 Vafast 中，您可以通过请求对象访问 Cookie，并通过响应对象设置 Cookie：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(({ req }) => {
      // 读取 Cookie
      const cookies = req.headers.get('cookie')
      const sessionId = getCookieValue(cookies, 'sessionId')
      
      if (sessionId) {
        return `Welcome back! Session: ${sessionId}`
      } else {
        return 'Welcome! Please log in.'
      }
    })
  },
  {
    method: 'POST',
    path: '/login',
    handler: createRouteHandler(async ({ req }) => {
      const body = await req.json()
      const { username, password } = body
      
      // 验证用户...
      if (username === 'admin' && password === 'password') {
        const sessionId = generateSessionId()
        
        // 创建响应并设置 Cookie
        const response = new Response('Login successful', { status: 200 })
        response.headers.set('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=3600`)
        
        return response
      }
      
      return new Response('Invalid credentials', { status: 401 })
    })
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## Cookie 工具函数

创建实用的 Cookie 处理函数：

```typescript
// Cookie 工具函数
export class CookieUtils {
  // 解析 Cookie 字符串
  static parse(cookieString: string | null): Record<string, string> {
    if (!cookieString) return {}
    
    return cookieString
      .split(';')
      .map(cookie => cookie.trim().split('='))
      .reduce((acc, [key, value]) => {
        if (key && value) {
          acc[decodeURIComponent(key)] = decodeURIComponent(value)
        }
        return acc
      }, {} as Record<string, string>)
  }
  
  // 获取特定 Cookie 值
  static get(cookieString: string | null, name: string): string | undefined {
    const cookies = this.parse(cookieString)
    return cookies[name]
  }
  
  // 创建 Set-Cookie 头
  static set(name: string, value: string, options: CookieOptions = {}): string {
    const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]
    
    if (options.domain) parts.push(`Domain=${options.domain}`)
    if (options.path) parts.push(`Path=${options.path}`)
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`)
    if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`)
    if (options.httpOnly) parts.push('HttpOnly')
    if (options.secure) parts.push('Secure')
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
    
    return parts.join('; ')
  }
  
  // 删除 Cookie
  static delete(name: string, options: CookieOptions = {}): string {
    return this.set(name, '', {
      ...options,
      maxAge: 0,
      expires: new Date(0)
    })
  }
}

interface CookieOptions {
  domain?: string
  path?: string
  maxAge?: number
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

// 使用 Cookie 工具函数
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/profile',
    handler: createRouteHandler(({ req }) => {
      const cookies = req.headers.get('cookie')
      const sessionId = CookieUtils.get(cookies, 'sessionId')
      
      if (!sessionId) {
        return new Response('Unauthorized', { status: 401 })
      }
      
      // 验证 session 并返回用户信息
      return { username: 'admin', email: 'admin@example.com' }
    })
  },
  {
    method: 'POST',
    path: '/logout',
    handler: createRouteHandler(() => {
      const response = new Response('Logged out successfully')
      
      // 删除 Cookie
      response.headers.set('Set-Cookie', CookieUtils.delete('sessionId', { path: '/' }))
      
      return response
    })
  }
])
```

## 中间件方式处理 Cookie

创建专门的 Cookie 中间件：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// Cookie 中间件
const cookieMiddleware = async (req: Request, next: () => Promise<Response>) => {
  // 解析 Cookie 并添加到请求对象
  const cookieString = req.headers.get('cookie')
  ;(req as any).cookies = CookieUtils.parse(cookieString)
  
  // 添加 Cookie 方法到请求对象
  ;(req as any).getCookie = (name: string) => {
    return (req as any).cookies[name]
  }
  
  ;(req as any).hasCookie = (name: string) => {
    return !!(req as any).cookies[name]
  }
  
  const response = await next()
  
  // 处理响应中的 Cookie 设置
  const cookiesToSet = (req as any)._cookiesToSet || []
  
  if (cookiesToSet.length > 0) {
    cookiesToSet.forEach((cookie: string) => {
      response.headers.append('Set-Cookie', cookie)
    })
  }
  
  return response
}

// 扩展的 Cookie 中间件
const enhancedCookieMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const cookieString = req.headers.get('cookie')
  ;(req as any).cookies = CookieUtils.parse(cookieString)
  
  // 添加响应 Cookie 设置方法
  ;(req as any).setCookie = (name: string, value: string, options: CookieOptions = {}) => {
    if (!(req as any)._cookiesToSet) {
      ;(req as any)._cookiesToSet = []
    }
    
    const cookieString = CookieUtils.set(name, value, options)
    ;(req as any)._cookiesToSet.push(cookieString)
  }
  
  ;(req as any).deleteCookie = (name: string, options: CookieOptions = {}) => {
    if (!(req as any)._cookiesToSet) {
      ;(req as any)._cookiesToSet = []
    }
    
    const cookieString = CookieUtils.delete(name, options)
    ;(req as any)._cookiesToSet.push(cookieString)
  }
  
  return await next()
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(({ req }) => {
      // 使用中间件添加的 Cookie 方法
      const sessionId = (req as any).getCookie('sessionId')
      
      if (sessionId) {
        return `Welcome back! Session: ${sessionId}`
      }
      
      return 'Welcome! Please log in.'
    })
  },
  {
    method: 'POST',
    path: '/login',
    handler: createRouteHandler(async ({ req }) => {
      const body = await req.json()
      const { username, password } = body
      
      if (username === 'admin' && password === 'password') {
        const sessionId = generateSessionId()
        
        // 使用中间件添加的 setCookie 方法
        ;(req as any).setCookie('sessionId', sessionId, {
          httpOnly: true,
          path: '/',
          maxAge: 3600,
          secure: true,
          sameSite: 'Strict'
        })
        
        return 'Login successful'
      }
      
      return new Response('Invalid credentials', { status: 401 })
    })
  }
])

const server = new Server(routes)
server.use(cookieMiddleware)
server.use(enhancedCookieMiddleware)

export default { fetch: server.fetch }
```

## 会话管理

实现完整的会话管理系统：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

interface Session {
  id: string
  userId: string
  username: string
  createdAt: Date
  expiresAt: Date
}

class SessionManager {
  private sessions = new Map<string, Session>()
  private readonly sessionTimeout = 24 * 60 * 60 * 1000 // 24小时
  
  createSession(userId: string, username: string): Session {
    const sessionId = this.generateSessionId()
    const now = new Date()
    
    const session: Session = {
      id: sessionId,
      userId,
      username,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.sessionTimeout)
    }
    
    this.sessions.set(sessionId, session)
    
    // 清理过期会话
    this.cleanupExpiredSessions()
    
    return session
  }
  
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId)
    
    if (session && session.expiresAt > new Date()) {
      return session
    }
    
    if (session) {
      this.sessions.delete(sessionId)
    }
    
    return undefined
  }
  
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }
  
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private cleanupExpiredSessions(): void {
    const now = new Date()
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId)
      }
    }
  }
}

const sessionManager = new SessionManager()

// 会话中间件
const sessionMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const cookieString = req.headers.get('cookie')
  const sessionId = CookieUtils.get(cookieString, 'sessionId')
  
  if (sessionId) {
    const session = sessionManager.getSession(sessionId)
    if (session) {
      ;(req as any).session = session
      ;(req as any).user = {
        id: session.userId,
        username: session.username
      }
    }
  }
  
  return await next()
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/login',
    handler: createRouteHandler(async ({ req }) => {
      const body = await req.json()
      const { username, password } = body
      
      // 验证用户...
      if (username === 'admin' && password === 'password') {
        const session = sessionManager.createSession('1', username)
        
        const response = new Response('Login successful')
        response.headers.set('Set-Cookie', CookieUtils.set('sessionId', session.id, {
          httpOnly: true,
          path: '/',
          maxAge: 24 * 60 * 60, // 24小时
          secure: true,
          sameSite: 'Strict'
        }))
        
        return response
      }
      
      return new Response('Invalid credentials', { status: 401 })
    })
  },
  {
    method: 'GET',
    path: '/profile',
    handler: createRouteHandler(({ req }) => {
      const user = (req as any).user
      
      if (!user) {
        return new Response('Unauthorized', { status: 401 })
      }
      
      return {
        id: user.id,
        username: user.username,
        message: 'Welcome to your profile!'
      }
    })
  },
  {
    method: 'POST',
    path: '/logout',
    handler: createRouteHandler(({ req }) => {
      const sessionId = CookieUtils.get(req.headers.get('cookie'), 'sessionId')
      
      if (sessionId) {
        sessionManager.deleteSession(sessionId)
      }
      
      const response = new Response('Logged out successfully')
      response.headers.set('Set-Cookie', CookieUtils.delete('sessionId', { path: '/' }))
      
      return response
    })
  }
])

const server = new Server(routes)
server.use(sessionMiddleware)

export default { fetch: server.fetch }
```

## Cookie 安全配置

实现安全的 Cookie 配置：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 安全 Cookie 配置
const createSecureCookie = (name: string, value: string, options: CookieOptions = {}) => {
  return CookieUtils.set(name, value, {
    httpOnly: true,        // 防止 XSS 攻击
    secure: true,          // 仅通过 HTTPS 传输
    sameSite: 'Strict',    // 防止 CSRF 攻击
    path: '/',             // 限制 Cookie 路径
    maxAge: 3600,          // 1小时过期
    ...options
  })
}

// 环境相关的 Cookie 配置
const createEnvironmentCookie = (name: string, value: string, options: CookieOptions = {}) => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return CookieUtils.set(name, value, {
    httpOnly: true,
    secure: isProduction,      // 生产环境使用 HTTPS
    sameSite: isProduction ? 'Strict' : 'Lax',
    path: '/',
    maxAge: 3600,
    ...options
  })
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/auth/login',
    handler: createRouteHandler(async ({ req }) => {
      const body = await req.json()
      const { username, password } = body
      
      if (username === 'admin' && password === 'password') {
        const sessionId = generateSecureSessionId()
        
        const response = new Response('Login successful')
        response.headers.set('Set-Cookie', createSecureCookie('sessionId', sessionId))
        
        return response
      }
      
      return new Response('Invalid credentials', { status: 401 })
    })
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## Cookie 测试

测试 Cookie 功能：

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

describe('Cookie Handling', () => {
  it('should set and read cookies', async () => {
    const routes = defineRoutes([
      {
        method: 'POST',
        path: '/set-cookie',
        handler: createRouteHandler(({ req }) => {
          const body = (req as any).body
          const { name, value } = body
          
          const response = new Response('Cookie set')
          response.headers.set('Set-Cookie', CookieUtils.set(name, value))
          
          return response
        })
      },
      {
        method: 'GET',
        path: '/read-cookie',
        handler: createRouteHandler(({ req }) => {
          const cookies = req.headers.get('cookie')
          const sessionId = CookieUtils.get(cookies, 'sessionId')
          
          return { sessionId }
        })
      }
    ])
    
    const server = new Server(routes)
    
    // 设置 Cookie
    const setResponse = await server.fetch(new Request('http://localhost/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'sessionId', value: 'test123' })
    }))
    
    expect(setResponse.status).toBe(200)
    
    // 读取 Cookie
    const cookieHeader = setResponse.headers.get('Set-Cookie')
    const readResponse = await server.fetch(new Request('http://localhost/read-cookie', {
      headers: { cookie: cookieHeader }
    }))
    
    const data = await readResponse.json()
    expect(data.sessionId).toBe('test123')
  })
  
  it('should handle cookie deletion', async () => {
    const routes = defineRoutes([
      {
        method: 'POST',
        path: '/delete-cookie',
        handler: createRouteHandler(() => {
          const response = new Response('Cookie deleted')
          response.headers.set('Set-Cookie', CookieUtils.delete('sessionId', { path: '/' }))
          
          return response
        })
      }
    ])
    
    const server = new Server(routes)
    
    const response = await server.fetch(new Request('http://localhost/delete-cookie', {
      method: 'POST'
    }))
    
    expect(response.status).toBe(200)
    
    const cookieHeader = response.headers.get('Set-Cookie')
    expect(cookieHeader).toContain('Max-Age=0')
    expect(cookieHeader).toContain('Expires=')
  })
})
```

## 总结

Vafast 的 Cookie 处理系统提供了：

- ✅ 简单的 Cookie 读取和设置
- ✅ 完整的 Cookie 属性配置
- ✅ 安全的 Cookie 默认值
- ✅ 会话管理支持
- ✅ 中间件集成
- ✅ 类型安全的 API
- ✅ 完整的测试支持

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强功能
- 探索 [验证系统](/essential/validation) 了解类型安全
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
