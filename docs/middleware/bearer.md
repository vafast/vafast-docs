---
title: Bearer 中间件 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Bearer 中间件 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 的中间件，用于获取根据 RFC6750 指定的 Bearer 令牌。首先通过 "bun add @vafast/bearer" 安装该中间件。

  - - meta
    - name: 'og:description'
      content: Vafast 的中间件，用于获取根据 RFC6750 指定的 Bearer 令牌。首先通过 "bun add @vafast/bearer" 安装该中间件。
---

# Bearer 中间件

用于 [Vafast](https://github.com/vafastjs/vafast) 的中间件，用于获取 Bearer 令牌。

## 安装

通过以下命令安装：

```bash
bun add @vafast/bearer
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { bearer, createTypedHandler } from '@vafast/bearer'

// 定义路由处理器
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { message: 'Bearer Token API' }
    })
  },
  {
    method: 'GET',
    path: '/sign',
    handler: createTypedHandler({}, ({ bearer }) => {
      // 访问 bearer 令牌，具有完整的类型安全
      if (!bearer) {
        return {
          error: 'Unauthorized',
          message: 'Bearer token required'
        }
      }
      return { token: bearer }
    })
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用 bearer 中间件
export default {
  fetch: (req: Request) => {
    // 应用 bearer 中间件
    return bearer()(req, () => server.fetch(req))
  }
}
```

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
import { bearer, createTypedHandler } from '@vafast/bearer'

const routes = [
  {
    method: 'GET',
    path: '/protected',
    handler: createTypedHandler({}, ({ bearer }) => {
      if (!bearer) {
        return {
          status: 401,
          error: 'Unauthorized',
          message: 'Bearer token required'
        }
      }
      
      // 验证令牌逻辑
      if (!isValidToken(bearer)) {
        return {
          status: 401,
          error: 'Unauthorized',
          message: 'Invalid token'
        }
      }
      
      return { message: 'Access granted', user: getUserFromToken(bearer) }
    })
  }
]
```

### 2. 自定义令牌提取

```typescript
import { bearer, createTypedHandler } from '@vafast/bearer'

// 自定义令牌提取配置
const customBearer = bearer({
  extract: {
    body: 'token',           // 从请求体的 'token' 字段提取
    query: 'auth_token',     // 从查询参数的 'auth_token' 提取
    header: 'Token'          // 从 'Token' 头部提取
  }
})

const routes = [
  {
    method: 'POST',
    path: '/login',
    handler: createTypedHandler({}, ({ bearer }) => {
      // 现在可以从自定义字段中获取令牌
      return { receivedToken: bearer }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return customBearer(req, () => server.fetch(req))
  }
}
```

### 3. 中间件链式应用

```typescript
import { bearer, createTypedHandler } from '@vafast/bearer'
import { cors } from '@vafast/cors'

const routes = [
  {
    method: 'GET',
    path: '/api/user',
    handler: createTypedHandler({}, ({ bearer }) => {
      return { user: getUserProfile(bearer) }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    // 应用多个中间件
    return cors()(req, () => {
      return bearer()(req, () => server.fetch(req))
    })
  }
}
```

### 4. 条件中间件应用

```typescript
import { bearer, createTypedHandler } from '@vafast/bearer'

const routes = [
  {
    method: 'GET',
    path: '/public',
    handler: createRouteHandler(() => {
      return { message: 'Public endpoint' }
    })
  },
  {
    method: 'GET',
    path: '/private',
    handler: createTypedHandler({}, ({ bearer }) => {
      return { message: 'Private endpoint', token: bearer }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    const url = new URL(req.url)
    
    // 只为私有端点应用 bearer 中间件
    if (url.pathname.startsWith('/private')) {
      return bearer()(req, () => server.fetch(req))
    }
    
    return server.fetch(req)
  }
}
```

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { bearer, createTypedHandler } from '@vafast/bearer'

// 模拟用户验证函数
const validateToken = (token: string): boolean => {
  return token === 'valid-token-123'
}

const getUserFromToken = (token: string) => {
  return { id: 1, username: 'john_doe', email: 'john@example.com' }
}

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { message: 'Bearer Token Authentication API' }
    })
  },
  {
    method: 'POST',
    path: '/login',
    handler: createRouteHandler(async (req: Request) => {
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
    })
  },
  {
    method: 'GET',
    path: '/profile',
    handler: createTypedHandler({}, ({ bearer }) => {
      if (!bearer) {
        return {
          status: 401,
          error: 'Unauthorized',
          message: 'Bearer token required'
        }
      }
      
      if (!validateToken(bearer)) {
        return {
          status: 401,
          error: 'Unauthorized',
          message: 'Invalid token'
        }
      }
      
      const user = getUserFromToken(bearer)
      return {
        message: 'Profile retrieved successfully',
        user
      }
    })
  },
  {
    method: 'GET',
    path: '/admin',
    handler: createTypedHandler({}, ({ bearer }) => {
      if (!bearer) {
        return {
          status: 401,
          error: 'Unauthorized'
        }
      }
      
      // 检查管理员权限
      if (bearer !== 'admin-token-456') {
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
    })
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用 bearer 中间件
export default {
  fetch: (req: Request) => {
    return bearer()(req, () => server.fetch(req))
  }
}

console.log('🚀 Bearer Token API 服务器启动成功！')
console.log('📝 登录端点: POST /login')
console.log('👤 个人资料: GET /profile (需要 Bearer 令牌)')
console.log('🔒 管理面板: GET /admin (需要管理员令牌)')
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