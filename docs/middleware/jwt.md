---
title: JWT 中间件 - Vafast
---

# JWT 中间件

该中间件增强了在 [Vafast](https://github.com/vafastjs/vafast) 处理程序中使用 JWT 的支持。

## 安装

安装命令：
```bash
npm install @vafast/jwt
```

## 基本用法

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { jwt } from '@vafast/jwt'

// 创建 JWT 中间件
const jwtMiddleware = jwt({
    name: 'jwt',
    secret: 'your-secret-key-here',
    sub: 'auth',
    iss: 'your-domain.com',
    exp: '7d'
})

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/sign/:name',
    middleware: [jwtMiddleware],
    handler: async ({ req, params }) => {
      const name = params.name
      
      // 创建 JWT 令牌
      const token = await (req as any).jwt.sign({ name })
      
      return {
        data: `Sign in as ${name}`,
        headers: {
          'Set-Cookie': `auth=${token}; HttpOnly; Max-Age=${7 * 86400}; Path=/`
        }
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [jwtMiddleware],
    handler: async ({ req }) => {
      // 从 Cookie 中获取令牌
      const cookies = req.headers.get('cookie')
      const authCookie = cookies?.split(';').find((c) => c.trim().startsWith('auth='))
      const token = authCookie?.split('=')[1]
      
      // 验证 JWT 令牌
      const profile = await (req as any).jwt.verify(token)
      
      if (!profile) {
        return {
          status: 401,
          data: 'Unauthorized'
        }
      }
      
      return { message: `Hello ${profile.name}` }
    }
  })
])

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default { fetch: server.fetch }
```

## 配置选项

该中间件扩展了 [jose](https://github.com/panva/jose) 的配置。

### JWTOption

```typescript
interface JWTOption<Name extends string | undefined = 'jwt', Schema extends TSchema | undefined = undefined> {
    /** 注册方法的名称，默认为 'jwt' */
    name?: Name
    
    /** JWT 密钥 */
    secret: string | Uint8Array | JWK
    
    /** JWT 负载的严格类型验证 */
    schema?: Schema
    
    /** 签名算法，默认为 'HS256' */
    alg?: string
    
    /** JWT 类型，默认为 'JWT' */
    typ?: string
    
    /** 发行者声明 */
    iss?: string
    
    /** 主体声明 */
    sub?: string
    
    /** 受众声明 */
    aud?: string | string[]
    
    /** JWT ID 声明 */
    jti?: string
    
    /** "未生效" 声明 */
    nbf?: string | number
    
    /** 过期时间声明 */
    exp?: string | number
    
    /** "签发时间" 声明 */
    iat?: boolean
    
    /** 其他 jose 支持的头部参数 */
    b64?: true
    crit?: string[]
    kid?: string
    x5t?: string
    x5c?: string[]
    x5u?: string
    jku?: string
    jwk?: JWK
    cty?: string
}
```

### 支持的算法

中间件支持以下签名算法：

- **HS256, HS384, HS512**: HMAC 算法
- **PS256, PS384, PS512**: RSA-PSS 算法
- **RS256, RS384, RS512**: RSA 算法
- **ES256, ES256K, ES384, ES512**: ECDSA 算法
- **EdDSA**: Edwards-curve 数字签名算法

## 使用模式

### 1. 基本 JWT 认证

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { jwt } from '@vafast/jwt'

const jwtMiddleware = jwt({
    name: 'jwt',
    secret: 'your-secret-key',
    exp: '1h',
    iss: 'your-app.com'
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const body = await req.json()
      const { username, password } = body
      
      // 验证用户凭据
      if (username === 'admin' && password === 'password') {
        const token = await (req as any).jwt.sign({
          username,
          role: 'admin',
          id: 1
        })
        
        return {
          message: 'Login successful',
          token,
          user: { username, role: 'admin' }
        }
      } else {
        return {
          status: 401,
          message: 'Invalid credentials'
        }
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/protected',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      if (!token) {
        return {
          status: 401,
          message: 'No token provided'
        }
      }
      
      const payload = await (req as any).jwt.verify(token)
      
      if (!payload) {
        return {
          status: 401,
          message: 'Invalid token'
        }
      }
      
      return {
        message: 'Access granted',
        user: payload
      }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 2. 带类型验证的 JWT

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { jwt } from '@vafast/jwt'
import { Type as t } from 'vafast'

// 定义用户模式
const UserSchema = t.Object({
    id: t.Number(),
    username: t.String(),
    email: t.String(),
    role: t.Union([t.Literal('user'), t.Literal('admin')])
})

const jwtMiddleware = jwt({
    name: 'jwt',
    secret: 'your-secret-key',
    exp: '24h',
    schema: UserSchema
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/register',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const body = await req.json()
      
      // 创建用户令牌
      const token = await (req as any).jwt.sign({
        id: 1,
        username: body.username,
        email: body.email,
        role: 'user'
      })
      
      return {
        message: 'User registered successfully',
        token,
        user: {
          id: 1,
          username: body.username,
          email: body.email,
          role: 'user'
        }
      }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 3. 多 JWT 实例

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { jwt } from '@vafast/jwt'

// 创建不同配置的 JWT 中间件
const accessTokenMiddleware = jwt({
    name: 'accessToken',
    secret: 'access-secret',
    exp: '15m',
    iss: 'your-app.com'
})

const refreshTokenMiddleware = jwt({
    name: 'refreshToken',
    secret: 'refresh-secret',
    exp: '7d',
    iss: 'your-app.com'
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/auth/login',
    middleware: [accessTokenMiddleware, refreshTokenMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const body = await req.json()
      const { username, password } = body
      
      if (username === 'admin' && password === 'password') {
        const accessToken = await (req as any).accessToken.sign({
          username,
          role: 'admin',
          type: 'access'
        })
        
        const refreshToken = await (req as any).refreshToken.sign({
          username,
          type: 'refresh'
        })
        
        return {
          message: 'Login successful',
          accessToken,
          refreshToken,
          expiresIn: '15m'
        }
      } else {
        return {
          status: 401,
          message: 'Invalid credentials'
        }
      }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/auth/refresh',
    middleware: [accessTokenMiddleware, refreshTokenMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const body = await req.json()
      const { refreshToken } = body
      
      const payload = await (req as any).refreshToken.verify(refreshToken)
      
      if (!payload || payload.type !== 'refresh') {
        return {
          status: 401,
          message: 'Invalid refresh token'
        }
      }
      
      // 生成新的访问令牌
      const newAccessToken = await (req as any).accessToken.sign({
        username: payload.username,
        role: 'admin',
        type: 'access'
      })
      
      return {
        message: 'Token refreshed',
        accessToken: newAccessToken,
        expiresIn: '15m'
      }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 4. 高级 JWT 配置

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { jwt } from '@vafast/jwt'

const advancedJwtMiddleware = jwt({
    name: 'jwt',
    secret: 'your-secret-key',
    alg: 'HS512',           // 使用更强的算法
    typ: 'JWT',
    iss: 'your-app.com',    // 发行者
    sub: 'authentication',  // 主题
    aud: ['web', 'mobile'], // 受众
    exp: '1h',              // 过期时间
    nbf: '0s',              // 立即生效
    iat: true,              // 包含签发时间
    jti: 'unique-id',       // JWT ID
    kid: 'key-1',           // 密钥 ID
    b64: true,              // Base64 编码
    crit: ['b64']           // 关键参数
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/auth/advanced',
    middleware: [advancedJwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const token = await (req as any).jwt.sign({
        username: 'admin',
        role: 'admin',
        permissions: ['read', 'write', 'delete']
      })
      
      return {
        message: 'Advanced JWT created',
        token,
        config: {
          algorithm: 'HS512',
          issuer: 'your-app.com',
          audience: ['web', 'mobile'],
          expiresIn: '1h'
        }
      }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## 完整示例

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { jwt } from '@vafast/jwt'
import { Type as t } from 'vafast'

// 定义用户模式
const UserSchema = t.Object({
    id: t.Number(),
    username: t.String(),
    email: t.String(),
    role: t.Union([t.Literal('user'), t.Literal('admin')])
})

// 创建 JWT 中间件
const jwtMiddleware = jwt({
    name: 'jwt',
    secret: 'your-super-secret-key-here',
    sub: 'authentication',
    iss: 'your-app.com',
    exp: '24h',
    schema: UserSchema
})

// 模拟用户数据库
const users = [
    { id: 1, username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { id: 2, username: 'user', email: 'user@example.com', password: 'user123', role: 'user' }
]

// 辅助函数：验证用户凭据
const validateUser = (username: string, password: string) => {
    return users.find(user => user.username === username && user.password === password)
}

// 辅助函数：从请求中提取令牌
const extractToken = (req: Request) => {
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }
    return null
}

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return { 
        message: 'Vafast JWT Authentication API',
        endpoints: [
          'POST /auth/register - 用户注册',
          'POST /auth/login - 用户登录',
          'GET /profile - 获取用户资料',
          'PUT /profile - 更新用户资料',
          'POST /auth/logout - 用户登出',
          'GET /admin - 管理员专用端点'
        ]
      }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/auth/register',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const body = await req.json()
      const { username, email, password } = body
      
      // 检查用户是否已存在
      if (users.find(user => user.username === username)) {
        return {
          status: 400,
          message: 'Username already exists'
        }
      }
      
      // 创建新用户
      const newUser = {
        id: users.length + 1,
        username,
        email,
        password,
        role: 'user' as const
      }
      
      users.push(newUser)
      
      // 生成 JWT 令牌
      const token = await (req as any).jwt.sign({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      })
      
      return {
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/auth/login',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const body = await req.json()
      const { username, password } = body
      
      const user = validateUser(username, password)
      
      if (!user) {
        return {
          status: 401,
          message: 'Invalid credentials'
        }
      }
      
      // 生成 JWT 令牌
      const token = await (req as any).jwt.sign({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      })
      
      return {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
                }
            }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const token = extractToken(req)
      
      if (!token) {
        return {
          status: 401,
          message: 'No token provided'
        }
      }
      
      const payload = await (req as any).jwt.verify(token)
      
      if (!payload) {
        return {
          status: 401,
          message: 'Invalid token'
        }
      }
      
      const user = users.find(u => u.id === payload.id)
      
      if (!user) {
        return {
          status: 404,
          message: 'User not found'
        }
      }
      
      return {
        message: 'Profile retrieved successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    }
  }),
  defineRoute({
    method: 'PUT',
    path: '/profile',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const token = extractToken(req)
      
      if (!token) {
        return {
          status: 401,
          message: 'No token provided'
        }
      }
      
      const payload = await (req as any).jwt.verify(token)
      
      if (!payload) {
        return {
          status: 401,
          message: 'Invalid token'
        }
      }
      
      const body = await req.json()
      const { email } = body
      
      const user = users.find(u => u.id === payload.id)
      
      if (!user) {
        return {
          status: 404,
          message: 'User not found'
        }
      }
      
      // 更新用户信息
      user.email = email
      
      return {
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [jwtMiddleware],
    handler: async ({ req }: { req: Request }) => {
      const token = extractToken(req)
      
      if (!token) {
        return {
          status: 401,
          message: 'No token provided'
        }
      }
      
      const payload = await (req as any).jwt.verify(token)
      
      if (!payload) {
        return {
          status: 401,
          message: 'Invalid token'
        }
      }
      
      if (payload.role !== 'admin') {
        return {
          status: 403,
          message: 'Access denied. Admin role required.'
        }
      }
      
      return {
        message: 'Admin access granted',
        adminData: {
          totalUsers: users.length,
          systemStatus: 'healthy',
          lastMaintenance: new Date().toISOString()
        }
      }
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/auth/logout',
    handler: async ({ req }: { req: Request }) => {
      // 在实际应用中，你可能需要将令牌加入黑名单
      return {
        message: 'Logout successful',
        note: 'Token has been invalidated'
      }
    }
  })
])

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default { fetch: server.fetch }

console.log('Vafast JWT Authentication API 服务器启动成功！')
console.log('用户注册: POST /auth/register')
console.log('用户登录: POST /auth/login')
console.log('👤 获取资料: GET /profile')
console.log('更新资料: PUT /profile')
console.log('👑 管理端点: GET /admin')
console.log('🚪 用户登出: POST /auth/logout')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'
import { jwt } from '@vafast/jwt'

describe('Vafast JWT Plugin', () => {
    it('should sign JWT tokens', async () => {
        const jwtMiddleware = jwt({
            name: 'jwt',
            secret: 'test-secret',
            sub: 'auth',
            iss: 'test.com',
            exp: '1h'
        })

        const app = new Server(defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/sign',
            middleware: [jwtMiddleware],
            handler: async ({ req }: { req: Request }) => {
              const token = await (req as any).jwt.sign({
                name: 'testuser'
              })
              return { token }
            }
            }
        ])

        const res = await app.fetch(new Request('http://localhost/sign'))
        const data = await res.json()

        expect(data.token).toBeDefined()
        expect(typeof data.token).toBe('string')
        expect(data.token.split('.')).toHaveLength(3) // JWT 有 3 个部分
    })

    it('should verify JWT tokens', async () => {
        const jwtMiddleware = jwt({
            name: 'jwt',
            secret: 'test-secret',
            sub: 'auth',
            iss: 'test.com',
            exp: '1h'
        })

        const app = new Server(defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/verify',
            middleware: [jwtMiddleware],
            handler: async ({ req }: { req: Request }) => {
              // 首先签名一个令牌
              const token = await (req as any).jwt.sign({
                name: 'testuser',
                id: 123
              })

              // 然后验证它
              const payload = await (req as any).jwt.verify(token)

              return { payload }
            }
          })
        ]))

        const res = await app.fetch(new Request('http://localhost/verify'))
        const data = await res.json()

        expect(data.payload).toBeDefined()
        expect(data.payload.name).toBe('testuser')
        expect(data.payload.id).toBe(123)
    })

    it('should handle invalid JWT tokens', async () => {
        const jwtMiddleware = jwt({
            name: 'jwt',
            secret: 'test-secret',
            sub: 'auth',
            iss: 'test.com',
            exp: '1h'
        })

        const app = new Server(defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/verify-invalid',
            middleware: [jwtMiddleware],
            handler: async ({ req }: { req: Request }) => {
              // 尝试验证无效令牌
              const payload = await (req as any).jwt.verify('invalid.token.here')

              return { payload }
            }
          })
        ]))

        const res = await app.fetch(new Request('http://localhost/verify-invalid'))
        const data = await res.json()

        expect(data.payload).toBe(false)
    })

    it('should handle missing tokens', async () => {
        const jwtMiddleware = jwt({
            name: 'jwt',
            secret: 'test-secret',
            sub: 'auth',
            iss: 'test.com',
            exp: '1h'
        })

        const app = new Server(defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/verify-missing',
            middleware: [jwtMiddleware],
            handler: async ({ req }: { req: Request }) => {
              // 尝试验证缺失的令牌
              const payload = await (req as any).jwt.verify()

                    return { payload }
                })
            }
        ])

        const res = await app.fetch(new Request('http://localhost/verify-missing'))
        const data = await res.json()

        expect(data.payload).toBe(false)
    })
})
```

## 特性

- ✅ **JWT 签名**: 支持创建和验证 JWT 令牌
- ✅ **多种算法**: 支持 HS256、RS256、ES256 等多种签名算法
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **模式验证**: 使用 TypeBox 进行负载验证
- ✅ **灵活配置**: 支持所有标准 JWT 声明
- ✅ **高性能**: 基于 jose 库的高性能实现
- ✅ **易于集成**: 无缝集成到 Vafast 应用

## 最佳实践

### 1. 密钥管理

```typescript
// 使用环境变量存储密钥
const jwtMiddleware = jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'fallback-secret',
    exp: '1h'
})

// 使用强密钥
const strongSecret = crypto.randomBytes(64).toString('hex')
```

### 2. 令牌过期策略

```typescript
const jwtMiddleware = jwt({
    name: 'jwt',
    secret: 'your-secret',
    exp: '15m',  // 访问令牌：15 分钟
    nbf: '0s',   // 立即生效
    iat: true    // 包含签发时间
})
```

### 3. 错误处理

```typescript
const payload = await (req as any).jwt.verify(token)

if (!payload) {
    return {
        status: 401,
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
    }
}
```

### 4. 安全考虑

```typescript
// 在生产环境中使用强算法
const productionJwt = jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET,
    alg: 'HS512',  // 使用更强的算法
    exp: '1h',
    iss: 'your-domain.com',
    aud: ['web', 'api']
})
```

## 注意事项

1. **密钥安全**: 确保 JWT 密钥的安全性，不要将其暴露在客户端代码中
2. **令牌过期**: 合理设置令牌过期时间，平衡安全性和用户体验
3. **算法选择**: 根据安全需求选择合适的签名算法
4. **负载大小**: JWT 令牌会增加请求大小，避免在负载中存储过多数据
5. **类型断言**: 当前版本需要使用类型断言 `(req as any).jwt` 来访问 JWT 方法

## 相关链接

- [JWT.io](https://jwt.io/) - JWT 调试器和文档
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [jose 库文档](https://github.com/panva/jose)
- [TypeBox 文档](https://github.com/sinclairzx81/typebox)
- [Vafast 官方文档](https://vafast.dev)