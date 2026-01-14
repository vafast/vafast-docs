---
title: Bearer 中间件 - Vafast
---

# Bearer 中间件

用于 [Vafast](https://github.com/vafastjs/vafast) 的中间件，用于获取 Bearer 令牌。

## 安装

通过以下命令安装：

```bash
npm install @vafast/bearer
```

## 基本用法

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { bearer } from '@vafast/bearer'

// 定义路由处理器
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return { message: 'Bearer Token API' }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/sign',
    middleware: [bearer()],
    handler: ({ bearer: bearerToken }) => {
      // 访问 bearer 令牌，具有完整的类型安全
      if (!bearerToken) {
        return {
          error: 'Unauthorized',
          message: 'Bearer token required'
        }
      }
      return { token: bearerToken }
    }
  })
])

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default { fetch: server.fetch }
```

> **新框架用法说明**：
> - 使用 `defineRoute` 定义路由
> - Bearer 中间件通过 `middleware` 字段应用
> - Handler 自动获得 `bearer` 参数的类型推断

## 配置选项

### BearerOptions

```typescript
interface BearerOptions {
  extract: {
    /**
     * 确定从请求体中提取令牌的字段名
     * @default 'access_token'
     */
    body?: string
    
    /**
     * 确定从查询参数中提取令牌的字段名
     * @default 'access_token'
     */
    query?: string
    
    /**
     * 确定哪种类型的认证应该是 Bearer 令牌
     * @default 'Bearer'
     */
    header?: string
  }
}
```

## 令牌提取策略

该中间件按照以下优先级从请求中提取 Bearer 令牌：

1. **Authorization 头部** - 默认格式：`Bearer <token>`
2. **查询参数** - 默认参数名：`access_token`
3. **请求体** - 默认字段名：`access_token`（仅非 GET 请求）

## 使用模式

### 1. 基本认证检查

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { bearer } from '@vafast/bearer'
import { err } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/protected',
    middleware: [bearer()],
    handler: ({ bearer: bearerToken }) => {
      if (!bearerToken) {
        throw err.unauthorized('Bearer token required')
      }
      
      // 验证令牌逻辑
      if (!isValidToken(bearerToken)) {
        throw err.unauthorized('Invalid token')
      }
      
      return { message: 'Access granted', user: getUserFromToken(bearerToken) }
    }
  })
])
```

### 2. 自定义令牌提取

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { bearer } from '@vafast/bearer'

// 自定义令牌提取配置
const customBearer = bearer({
  extract: {
    body: 'token',           // 从请求体的 'token' 字段提取
    query: 'auth_token',     // 从查询参数的 'auth_token' 提取
    header: 'Token'          // 从 'Token' 头部提取
  }
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    middleware: [customBearer],
    handler: ({ bearer: bearerToken }) => {
      // 现在可以从自定义字段中获取令牌
      return { receivedToken: bearerToken }
    }
  })
])

const server = new Server(routes)

export default {
  fetch: server.fetch
}
```

### 3. 中间件链式应用

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { bearer } from '@vafast/bearer'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/user',
    middleware: [bearer()],
    handler: ({ bearer: bearerToken }) => {
      return { user: getUserProfile(bearerToken) }
    }
  })
])

const server = new Server(routes)

// 使用 server.useGlobalMiddleware() 应用全局中间件（推荐）
server.useGlobalMiddleware(cors())
server.useGlobalMiddleware(bearer())

export default {
  fetch: server.fetch
}
```

### 4. 条件中间件应用

```typescript
import { bearer, createTypedHandler } from '@vafast/bearer'

const routes = [
  defineRoute({
    method: 'GET',
    path: '/public',
    handler: () => {
      return { message: 'Public endpoint' }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/private',
    middleware: [bearer()],
    handler: ({ bearer: bearerToken }) => {
      return { message: 'Private endpoint', token: bearerToken }
    }
  })
])

const server = new Server(routes)

// 方式一：使用 server.useGlobalMiddleware()（推荐，适用于所有路由）
server.useGlobalMiddleware(bearer())

export default {
  fetch: server.fetch
}

// 方式二：条件应用（高级用法，仅在特殊场景下使用）
// export default {
//   fetch: (req: Request) => {
//     const url = new URL(req.url)
//     
//     // 只为私有端点应用 bearer 中间件
//     if (url.pathname.startsWith('/private')) {
//       return bearer()(req, () => server.fetch(req))
//     }
//     
//     return server.fetch(req)
//   }
// }
```

## 完整示例

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { bearer } from '@vafast/bearer'

// 模拟用户验证函数
const validateToken = (token: string): boolean => {
  return token === 'valid-token-123'
}

const getUserFromToken = (token: string) => {
  return { id: 1, username: 'john_doe', email: 'john@example.com' }
}

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return { message: 'Bearer Token Authentication API' }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/login',
    handler: async (req: Request) => {
      const body = await req.json()
      const { username, password } = body
      
      // 简单的登录逻辑
      if (username === 'admin' && password === 'password') {
        return {
          message: 'Login successful',
          token: 'valid-token-123'
        }
      }
      
      return {
        status: 401,
        error: 'Invalid credentials'
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [bearer()],
    handler: ({ bearer: bearerToken }) => {
      if (!bearerToken) {
        return {
          status: 401,
          error: 'Unauthorized',
          message: 'Bearer token required'
        }
      }
      
      if (!validateToken(bearerToken)) {
        return {
          status: 401,
          error: 'Unauthorized',
          message: 'Invalid token'
        }
      }
      
      const user = getUserFromToken(bearerToken)
      return {
        message: 'Profile retrieved successfully',
        user
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [bearer()],
    handler: ({ bearer: bearerToken }) => {
      if (!bearerToken) {
        return {
          status: 401,
          error: 'Unauthorized'
        }
      }
      
      // 检查管理员权限
      if (bearerToken !== 'admin-token-456') {
        return {
          status: 403,
          error: 'Forbidden',
          message: 'Admin access required'
        }
      }
      
      return {
        message: 'Admin panel accessed',
        adminData: { users: 100, systemStatus: 'healthy' }
      }
    }
  })
])

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default { fetch: server.fetch }
```

console.log('Bearer Token API 服务器启动成功！')
console.log('登录端点: POST /login')
console.log('👤 个人资料: GET /profile (需要 Bearer 令牌)')
console.log('管理面板: GET /admin (需要管理员令牌)')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'

describe('Bearer Token API', () => {
  it('should require bearer token for protected routes', async () => {
    const res = await app.fetch(new Request('http://localhost/profile'))
    const data = await res.json()
    
    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
  
  it('should accept valid bearer token', async () => {
    const res = await app.fetch(new Request('http://localhost/profile', {
      headers: {
        'Authorization': 'Bearer valid-token-123'
      }
    }))
    const data = await res.json()
    
    expect(res.status).toBe(200)
    expect(data.message).toBe('Profile retrieved successfully')
    expect(data.user).toBeDefined()
  })
  
  it('should extract token from query parameters', async () => {
    const res = await app.fetch(new Request('http://localhost/profile?access_token=valid-token-123'))
    const data = await res.json()
    
    expect(res.status).toBe(200)
    expect(data.user).toBeDefined()
  })
})
```

## 特性

- ✅ **RFC6750 兼容**: 完全符合 Bearer 令牌规范
- ✅ **多种提取方式**: 支持头部、查询参数和请求体提取
- ✅ **类型安全**: 使用 `createTypedHandler` 提供完整的类型安全
- ✅ **灵活配置**: 可自定义令牌提取字段和头部名称
- ✅ **中间件集成**: 无缝集成到 Vafast 应用
- ✅ **高性能**: 轻量级实现，最小化性能开销

## 注意事项

1. **令牌验证**: 该中间件只负责提取令牌，不处理验证逻辑。开发者需要自己实现令牌验证。

2. **安全性**: 在生产环境中，确保使用 HTTPS 传输令牌，并实现适当的令牌过期和刷新机制。

3. **错误处理**: 建议在令牌无效时返回适当的 HTTP 状态码和错误信息。

4. **中间件顺序**: Bearer 中间件应该在路由处理之前应用，以确保令牌在处理器中可用。

## 相关链接

- [RFC6750 - OAuth 2.0 Bearer Token Usage](https://www.rfc-editor.org/rfc/rfc6750)
- [Vafast 官方文档](https://vafast.dev)
- [Bearer 认证最佳实践](https://oauth.net/2/bearer-tokens/)