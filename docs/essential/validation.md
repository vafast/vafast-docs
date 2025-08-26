---
title: 验证 - Vafast
head:
    - - meta
      - property: 'og:title'
        content: 验证 - Vafast

    - - meta
      - name: 'description'
        content: Schema 是严格类型的定义，用于推断 TypeScript 的类型和对传入请求及传出响应的数据验证。Vafast 的模式验证基于 Sinclair 的 TypeBox，一个用于数据验证的 TypeScript 库。

    - - meta
      - property: 'og:description'
        content: Schema 是严格类型的定义，用于推断 TypeScript 的类型和对传入请求及传出响应的数据验证。Vafast 的模式验证基于 Sinclair 的 TypeBox，一个用于数据验证的 TypeScript 库。
---

<script setup>
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

import Playground from '../components/nearl/playground.vue'
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'

const demo1 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/none',
    handler: createRouteHandler(() => 'hi')
  },
  {
    method: 'GET',
    path: '/query',
    handler: createRouteHandler(({ query }) => query.name),
    query: Type.Object({
      name: Type.String()
    })
  }
]))

const demo2 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/id/1',
    handler: createRouteHandler(() => '1')
  },
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(({ params }) => params.id),
    params: Type.Object({
      id: Type.Number()
    })
  }
]))

const demo3 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/query',
    handler: createRouteHandler(({ query }) => query.id),
    query: Type.Object({
      id: Type.Number()
    })
  }
]))

const demo4 = new Server(defineRoutes([
  {
    method: 'GET',
    path: '/query',
    handler: createRouteHandler(({ query }) => query),
    query: Type.Object({
      name: Type.Array(Type.String()),
      squad: Type.String()
    })
  }
]))
</script>

# 验证

创建 API 服务器的目的在于接收输入并对其进行处理。

JavaScript 允许任何数据成为任何类型。Vafast 提供了一个工具，可以对数据进行验证，以确保数据的格式正确。

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/id/:id',
    handler: createRouteHandler(({ params }) => params.id),
    params: Type.Object({
      id: Type.Number()
    })
  }
])
```

### TypeBox

**TypeBox** 是一个用于运行时、编译时和 OpenAPI 模式的类型安全模式构建器，用于生成 OpenAPI/Swagger 文档。

TypeBox 是一个非常快速、轻量且类型安全的 TypeScript 运行时验证库。Vafast 直接使用 TypeBox 进行验证，提供完整的类型安全。

我们认为验证应该由框架原生处理，而不是依赖用户为每个项目设置自定义类型。

### TypeScript

我们可以通过访问 TypeBox 的类型定义来获得完整的类型安全：

```typescript
import { Type } from '@sinclair/typebox'

const UserSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

// 自动推断类型
type User = Static<typeof UserSchema>
```

## 基本验证

### 请求体验证

```typescript
import { Type } from '@sinclair/typebox'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0, maximum: 150 }))
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      // body 已经通过验证，类型安全
      const { name, email, age } = body
      return { name, email, age: age || 18 }
    }),
    body: userSchema
  }
])
```

### 查询参数验证

```typescript
const searchSchema = Type.Object({
  q: Type.String({ minLength: 1 }),
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  sort: Type.Optional(Type.Union([
    Type.Literal('name'),
    Type.Literal('email'),
    Type.Literal('created_at')
  ]))
})

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/search',
    handler: createRouteHandler(({ query }) => {
      const { q, page = 1, limit = 10, sort = 'name' } = query
      return { query: q, page, limit, sort, results: [] }
    }),
    query: searchSchema
  }
])
```

### 路径参数验证

```typescript
const userParamsSchema = Type.Object({
  id: Type.Number({ minimum: 1 }),
  action: Type.Optional(Type.Union([
    Type.Literal('profile'),
    Type.Literal('settings'),
    Type.Literal('posts')
  ]))
})

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id/:action?',
    handler: createRouteHandler(({ params }) => {
      const { id, action = 'profile' } = params
      return `User ${id} ${action}`
    }),
    params: userParamsSchema
  }
])
```

## 高级验证

### 嵌套对象

```typescript
const addressSchema = Type.Object({
  street: Type.String(),
  city: Type.String(),
  country: Type.String(),
  postalCode: Type.String()
})

const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  address: addressSchema,
  phones: Type.Array(Type.String({ pattern: '^\\+?[1-9]\\d{1,14}$' }))
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      return createUser(body)
    }),
    body: userSchema
  }
])
```

### 联合类型

```typescript
const userInputSchema = Type.Union([
  Type.Object({
    type: Type.Literal('create'),
    data: Type.Object({
      name: Type.String(),
      email: Type.String({ format: 'email' })
    })
  }),
  Type.Object({
    type: Type.Literal('update'),
    id: Type.Number(),
    data: Type.Partial(Type.Object({
      name: Type.String(),
      email: Type.String({ format: 'email' })
    }))
  })
])

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      if (body.type === 'create') {
        return createUser(body.data)
      } else {
        return updateUser(body.id, body.data)
      }
    }),
    body: userInputSchema
  }
])
```

### 条件验证

```typescript
const conditionalSchema = Type.Object({
  type: Type.Union([
    Type.Literal('individual'),
    Type.Literal('company')
  ]),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  companyName: Type.Conditional(
    Type.Ref('type'),
    Type.Literal('company'),
    Type.String({ minLength: 1 }),
    Type.Never()
  ),
  ssn: Type.Conditional(
    Type.Ref('type'),
    Type.Literal('individual'),
    Type.String({ pattern: '^\\d{3}-\\d{2}-\\d{4}$' }),
    Type.Never()
  )
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/accounts',
    handler: createRouteHandler(({ body }) => {
      return createAccount(body)
    }),
    body: conditionalSchema
  }
])
```

## 自定义验证

### 自定义验证器

```typescript
const customStringSchema = Type.String({
  minLength: 1,
  maxLength: 100,
  pattern: '^[a-zA-Z0-9_]+$',
  errorMessage: 'Username must contain only letters, numbers, and underscores'
})

const customNumberSchema = Type.Number({
  minimum: 0,
  maximum: 100,
  multipleOf: 5,
  errorMessage: 'Score must be a multiple of 5 between 0 and 100'
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/scores',
    handler: createRouteHandler(({ body }) => {
      return saveScore(body)
    }),
    body: Type.Object({
      username: customStringSchema,
      score: customNumberSchema
    })
  }
])
```

### 异步验证

```typescript
const asyncValidationSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  username: Type.String({ minLength: 3, maxLength: 20 })
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(async ({ body }) => {
      // 异步验证
      const emailExists = await checkEmailExists(body.email)
      if (emailExists) {
        return new Response('Email already exists', { status: 400 })
      }
      
      const usernameExists = await checkUsernameExists(body.username)
      if (usernameExists) {
        return new Response('Username already exists', { status: 400 })
      }
      
      return createUser(body)
    }),
    body: asyncValidationSchema
  }
])
```

## 错误处理

### 验证错误

当验证失败时，Vafast 会自动返回 400 错误：

```typescript
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      // 如果验证失败，这里不会执行
      return createUser(body)
    }),
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      email: Type.String({ format: 'email' })
    })
  }
])
```

### 自定义错误处理

```typescript
const errorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    if (error.name === 'ValidationError') {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.details
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new Response('Internal server error', { status: 500 })
  }
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      return createUser(body)
    }),
    body: userSchema,
    middleware: [errorHandler]
  }
])
```

## 性能优化

### 预编译验证器

```typescript
import { TypeCompiler } from '@sinclair/typebox/compiler'

// 预编译验证器以提高性能
const userValidator = TypeCompiler.Compile(userSchema)

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      // 使用预编译的验证器
      const isValid = userValidator.Check(body)
      if (!isValid) {
        return new Response('Invalid data', { status: 400 })
      }
      
      return createUser(body)
    })
  }
])
```

### 缓存验证结果

```typescript
const validationCache = new Map<string, boolean>()

const cachedValidation = (schema: any) => {
  return async (req: Request, next: () => Promise<Response>) => {
    const body = await req.json()
    const cacheKey = JSON.stringify(body)
    
    if (validationCache.has(cacheKey)) {
      return await next()
    }
    
    const isValid = Type.Is(schema, body)
    if (isValid) {
      validationCache.set(cacheKey, true)
      return await next()
    } else {
      return new Response('Invalid data', { status: 400 })
    }
  }
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      return createUser(body)
    }),
    middleware: [cachedValidation(userSchema)]
  }
])
```

## 最佳实践

### 1. 使用描述性的错误消息

```typescript
const userSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    errorMessage: 'Name is required'
  }),
  email: Type.String({
    format: 'email',
    errorMessage: 'Please provide a valid email address'
  }),
  age: Type.Number({
    minimum: 0,
    maximum: 150,
    errorMessage: 'Age must be between 0 and 150'
  })
})
```

### 2. 重用验证模式

```typescript
// 基础模式
const baseUserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

// 创建用户模式
const createUserSchema = baseUserSchema

// 更新用户模式
const updateUserSchema = Type.Partial(baseUserSchema)

// 用户列表查询模式
const userQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String())
})
```

### 3. 验证中间件

```typescript
const validateBody = (schema: any) => {
  return async (req: Request, next: () => Promise<Response>) => {
    try {
      const body = await req.json()
      const isValid = Type.Is(schema, body)
      
      if (!isValid) {
        return new Response('Invalid request body', { status: 400 })
      }
      
      // 将验证后的数据添加到请求中
      ;(req as any).validatedBody = body
      
      return await next()
    } catch (error) {
      return new Response('Invalid JSON', { status: 400 })
    }
  }
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    middleware: [validateBody(userSchema)],
    handler: createRouteHandler(({ req }) => {
      const userData = (req as any).validatedBody
      return createUser(userData)
    })
  }
])
```

## 测试验证

您可以使用 Playground 组件来测试不同的验证配置：

<Playground :demo="demo1" />

<Playground :demo="demo2" />

<Playground :demo="demo3" />

<Playground :demo="demo4" />

## 总结

Vafast 的验证系统提供了：

- ✅ 基于 TypeBox 的完整类型安全
- ✅ 运行时数据验证
- ✅ 自动错误处理
- ✅ 性能优化选项
- ✅ 灵活的验证规则
- ✅ 中间件集成支持

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [处理程序](/essential/handler) 了解如何处理请求
- 探索 [中间件系统](/middleware) 了解如何增强功能
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。