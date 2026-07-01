---
title: 最佳实践 - Vafast
---

# 最佳实践

Vafast 是一个与模式无关的框架，选择何种编码模式由您和您的团队决定。

本页面是关于如何结合 MVC 模式 [(Model-View-Controller)](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) 遵循 Vafast 结构最佳实践的指南，但也可以适用于任何您喜欢的编码模式。

## 文件夹结构

Vafast 对文件夹结构没有固定看法，留给您 **自行决定** 如何组织代码。

然而，**如果您没有具体结构的想法**，我们推荐基于功能的文件夹结构。每个功能模块拥有自己的文件夹，里面包含路由、服务和模型。

```
| src
  | modules
	| auth
      | routes.ts (路由定义)
	  | service.ts (服务)
	  | model.ts (模型)
	| user
      | routes.ts (路由定义)
	  | service.ts (服务)
	  | model.ts (模型)
  | utils
	| a
	  | index.ts
	| b
	  | index.ts
  | index.ts (入口文件)
```

这种结构使您更容易找到和管理代码，并将相关代码集中在一起。

下面是一个如何将代码分布到基于功能文件夹结构的示例：

::: code-group

```typescript [auth/routes.ts]
// 路由定义处理 HTTP 相关，如路由、请求验证
import { defineRoute, defineRoutes, Type } from 'vafast'
import { AuthService } from './service'
import { AuthModel } from './model'

export const authRoutes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/auth/sign-in',
    schema: { body: AuthModel.signInBody },
    handler: async ({ body }) => {
      const response = await AuthService.signIn(body)
      return response
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/auth/sign-up',
    schema: { body: AuthModel.signUpBody },
    handler: async ({ body }) => {
      const user = await AuthService.signUp(body)
      return user
    }
  })
])
```

```typescript [auth/service.ts]
// 服务处理业务逻辑，解耦于路由定义
import type { Static } from 'vafast'
import { AuthModel } from './model'

type SignInBody = Static<typeof AuthModel.signInBody>
type SignUpBody = Static<typeof AuthModel.signUpBody>

export abstract class AuthService {
  static async signIn({ username, password }: SignInBody) {
    const user = await db.user.findUnique({ where: { username } })

    if (!user || !await verifyPassword(password, user.password)) {
      throw new Error('Invalid username or password')
    }

		return {
			username,
      token: await generateToken(user.id)
		}
  }

  static async signUp({ username, password, email }: SignUpBody) {
    const hashedPassword = await hashPassword(password)
    
    return await db.user.create({
      data: { username, password: hashedPassword, email }
    })
	}
}
```

```typescript [auth/model.ts]
// 模型定义请求和响应的数据结构和验证
import { Type } from 'vafast'

export const AuthModel = {
  signInBody: Type.Object({
    username: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 6 }),
  }),

  signUpBody: Type.Object({
    username: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 6 }),
    email: Type.String({ format: 'email' }),
  }),

  signInResponse: Type.Object({
    username: Type.String(),
    token: Type.String(),
  }),
}
```

```typescript [index.ts]
// 入口文件：组合所有路由
import { Server, serve } from 'vafast'
import { authRoutes } from './modules/auth/routes'
import { userRoutes } from './modules/user/routes'

const server = new Server([
  ...authRoutes,
  ...userRoutes,
])

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
```

:::

每个文件的职责如下：
- **路由（Routes）**：处理 HTTP 路由、请求验证和响应。
- **服务（Service）**：处理业务逻辑，完全解耦于框架。
- **模型（Model）**：定义请求和响应的数据结构及验证 Schema。

您可以随意调整此结构以满足自己的需求，使用任何您喜欢的编码模式。

## 路由组织

### ✅ 推荐：使用 defineRoutes 定义路由

使用 `defineRoutes` 定义路由数组，获得更好的类型推断：

```typescript
import { defineRoute, defineRoutes } from 'vafast'

export const userRoutes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => getUsers()
  }),
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: ({ params }) => getUserById(params.id)
  })
])
```

### ✅ 推荐：按功能模块分组路由

将相关路由放在同一模块中，便于维护：

```typescript
// modules/user/routes.ts
export const userRoutes = defineRoutes([
  { method: 'GET', path: '/users', handler: ... },
  { method: 'GET', path: '/users/:id', handler: ... },
  { method: 'POST', path: '/users', handler: ... },
])

// modules/post/routes.ts
export const postRoutes = defineRoutes([
  { method: 'GET', path: '/posts', handler: ... },
  { method: 'GET', path: '/posts/:id', handler: ... },
])
```

### ✅ 推荐：在入口文件组合路由

```typescript
import { Server, serve } from 'vafast'
import { userRoutes } from './modules/user/routes'
import { postRoutes } from './modules/post/routes'

const server = new Server([
  ...userRoutes,
  ...postRoutes,
])

serve({ fetch: server.fetch, port: 3000 })
```

## 服务层

服务是独立的工具/辅助函数集合，作为业务逻辑被解耦出来，供路由使用。

任何可以从路由处理函数中解耦的技术逻辑都可以放在 **服务** 中。

### ✅ 推荐：抽象不依赖请求的服务

建议将服务类或函数与 Vafast 解耦。

如果服务或函数不依赖 HTTP 请求，推荐将其抽象为静态类或函数：

```typescript
// services/math.ts
export abstract class MathService {
  static fibo(n: number): number {
    if (n < 2) return n
    return MathService.fibo(n - 1) + MathService.fibo(n - 2)
    }
}

// routes.ts
import { defineRoute, defineRoutes, Type } from 'vafast'
import { MathService } from './services/math'

export const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/fibo/:n',
    schema: { params: Type.Object({ n: Type.String() }) },
    handler: ({ params }) => MathService.fibo(parseInt(params.n))
  })
])
```

如果服务不需要存储属性，可以使用 `abstract class` 和 `static`，避免创建类实例。

### ✅ 推荐：依赖请求的逻辑使用中间件

如果逻辑依赖请求（如身份验证），推荐使用中间件：

```typescript
import { defineRoute, defineRoutes, defineMiddleware, json } from 'vafast'

// 身份验证中间件
const authMiddleware = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }
  
  const user = await verifyToken(token)
  if (!user) {
    return json({ error: 'Invalid token' }, 401)
  }
  
  // 通过 next 传递用户信息
  return await next({ user })
})

export const protectedRoutes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [authMiddleware],
    handler: ({ user }) => {
      // user 自动有类型
      return { id: user.id, username: user.username }
    }
  })
])
```

> **新框架用法说明**：
> - 使用 `defineMiddleware` 定义中间件
> - 通过 `next({ user })` 传递上下文
> - Handler 自动获得类型推断，无需手动类型断言

### ❌ 不推荐：在服务中处理 HTTP 响应

服务应该只处理业务逻辑，不要在服务中构造 HTTP 响应：

```typescript
// ❌ 不推荐
class UserService {
  static async getUser(id: string) {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return new Response('Not Found', { status: 404 }) // ❌
    }
    return user
  }
}

// ✅ 推荐
class UserService {
  static async getUser(id: string) {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      throw new Error('User not found') // 或返回 null
    }
    return user
  }
}

// 在路由中处理 HTTP 响应
{
  method: 'GET',
  path: '/users/:id',
  handler: async ({ params }) => {
    const user = await UserService.getUser(params.id)
    if (!user) {
      throw err.notFound('User not found')
    }
    return user
  }
})
```

## 模型（Schema）

模型或 [DTO（数据传输对象）](https://en.wikipedia.org/wiki/Data_transfer_object) 使用 TypeBox（通过 vafast 导出的 `Type`）处理。

Vafast 内置验证系统能从代码推断类型并进行运行时校验。

### ✅ 推荐：使用 Type 定义 Schema

```typescript
import { Type, type Static } from 'vafast'

// 定义 Schema
export const UserSchema = Type.Object({
  username: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

// 获取 TypeScript 类型
export type User = Static<typeof UserSchema>
```

### ✅ 推荐：组织 Schema 到模型对象

将相关 Schema 归组到一个对象中，便于管理：

```typescript
import { Type } from 'vafast'

export const UserModel = {
  create: Type.Object({
    username: Type.String({ minLength: 1 }),
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 6 })
  }),
  
  update: Type.Object({
    username: Type.Optional(Type.String({ minLength: 1 })),
    email: Type.Optional(Type.String({ format: 'email' }))
  }),
  
  response: Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
    createdAt: Type.String()
  })
}
```

### ❌ 不推荐：使用类或接口定义模型

不要将类实例或接口用于模型声明，因为它们无法进行运行时验证：

```typescript
// ❌ 不推荐 - 无法运行时验证
class UserDto {
	username: string
	password: string
}

// ❌ 不推荐 - 只是类型，无法运行时验证
interface IUser {
	username: string
	password: string
}

// ✅ 推荐 - 可以运行时验证
const UserSchema = Type.Object({
  username: Type.String(),
  password: Type.String()
})
```

### ❌ 不推荐：把类型和 Schema 分开声明

不要把 Schema 和类型分开声明，应通过 Schema 的 `Static` 获取类型：

```typescript
// ❌ 不推荐 - 重复定义，容易不同步
const userSchema = Type.Object({
  username: Type.String(),
  password: Type.String()
})

type User = {
	username: string
	password: string
}

// ✅ 推荐 - 从 Schema 推断类型
const userSchema = Type.Object({
  username: Type.String(),
  password: Type.String()
})

type User = Static<typeof userSchema>
```

## 错误处理

### ✅ 推荐：使用 err() 错误工具函数

```typescript
import { defineRoute, defineRoutes, err } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: async ({ params }) => {
      const user = await db.user.findUnique({ where: { id: params.id } })
      
      if (!user) {
        // 使用 err() 抛出语义化错误
        throw err.notFound('用户不存在')
      }
      
      return user
    }
  })
])

// 框架内置错误处理器会自动捕获错误并返回：
// { "error": "NOT_FOUND", "message": "用户不存在" }
```

**常用错误方法：**

```typescript
throw err.badRequest('参数错误')      // 400
throw err.unauthorized('请先登录')    // 401
throw err.forbidden('无权限')         // 403
throw err.notFound('资源不存在')      // 404
throw err.conflict('资源冲突')        // 409
throw err.internal('服务器错误')      // 500
throw err('自定义错误', 422, 'TYPE')  // 自定义
```

### ✅ 推荐：扩展 VafastError 创建自定义错误类

```typescript
import { VafastError } from 'vafast'

// 继承 VafastError 创建业务错误
export class NotFoundError extends VafastError {
  constructor(resource: string) {
    super(`${resource} not found`, { 
      status: 404, 
      type: 'NOT_FOUND',
      expose: true 
    })
  }
}

export class UnauthorizedError extends VafastError {
  constructor(message = '未授权访问') {
    super(message, { 
      status: 401, 
      type: 'UNAUTHORIZED',
      expose: true 
    })
  }
}

export class ValidationError extends VafastError {
  constructor(message: string, public details?: Record<string, string>) {
    super(message, { 
      status: 400, 
      type: 'VALIDATION_ERROR',
      expose: true 
    })
  }
}

// 使用示例
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: async ({ params }) => {
      const user = await db.user.findUnique({ where: { id: params.id } })
      if (!user) throw new NotFoundError('User')
      return user
    }
  })
])
```

### ✅ 可选：自定义错误处理中间件

```typescript
import { json, VafastError } from 'vafast'

// 自定义错误处理（框架已内置，仅在需要特殊处理时使用）
const customErrorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    console.error('Error:', error)
    
    // VafastError 会被框架自动处理，这里可以处理其他类型的错误
    if (error instanceof SomeExternalLibraryError) {
      return json({ error: 'external_error', message: '外部服务错误' }, 502)
    }
    
    // 重新抛出让框架处理
    throw error
  }
}

const server = new Server(routes)
server.use(customErrorHandler)
```

## 测试

### ✅ 推荐：使用 server.fetch 测试路由

```typescript
import { describe, it, expect } from 'vitest'
import { Server, defineRoute, defineRoutes } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello World'
  })
])

const server = new Server(routes)

describe('Routes', () => {
  it('should return Hello World', async () => {
    const response = await server.fetch(new Request('http://localhost/'))
    const text = await response.text()
    
    expect(response.status).toBe(200)
    expect(text).toBe('Hello World')
  })
    })
```

### ✅ 推荐：服务层单独测试

```typescript
import { describe, it, expect } from 'vitest'
import { MathService } from './services/math'

describe('MathService', () => {
  it('should calculate fibonacci', () => {
    expect(MathService.fibo(0)).toBe(0)
    expect(MathService.fibo(1)).toBe(1)
    expect(MathService.fibo(10)).toBe(55)
  })
})
```

## 总结

| 推荐做法 | 原因 |
|---------|------|
| 使用 `defineRoutes` 定义路由 | 更好的类型推断 |
| 按功能模块分组代码 | 便于维护和查找 |
| 服务层解耦于框架 | 易于测试和重用 |
| 使用 `Type` 定义 Schema | 运行时验证 + 类型推断 |
| 使用中间件处理横切关注点 | 统一处理认证、日志、错误 |
| 使用 `server.fetch` 测试 | 完整的集成测试 |
