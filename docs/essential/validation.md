---
title: 验证 - Vafast
---

<script setup>
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'
</script>

# 验证

创建 API 服务器的目的在于接收输入并对其进行处理。

JavaScript 允许任何数据成为任何类型。Vafast 提供了一个工具，可以对数据进行验证，以确保数据的格式正确。

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/id/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: ({ params }) => params.id
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

> **新框架用法说明**：
> - Schema 验证在路由配置的 `schema` 字段中定义
> - Handler 直接是函数，不再需要 `createHandler` 包装
> - 所有路由必须使用 `defineRoute` 包装

### TypeBox

**TypeBox** 是一个用于运行时、编译时和 OpenAPI 模式的类型安全模式构建器，用于生成 OpenAPI/Swagger 文档。

TypeBox 是一个非常快速、轻量且类型安全的 TypeScript 运行时验证库。Vafast 直接使用 TypeBox 进行验证，提供完整的类型安全。

我们认为验证应该由框架原生处理，而不是依赖用户为每个项目设置自定义类型。

### TypeScript

我们可以通过访问 TypeBox 的类型定义来获得完整的类型安全：

```typescript
import { Type } from 'vafast'

const UserSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

// 自动推断类型
type User = Static<typeof UserSchema>
```

### 内置 Format 验证

Vafast 内置了常用的 format 验证器，框架启动时自动注册，对标 Zod 的内置验证：

| 分类 | Format | 说明 |
|------|--------|------|
| **标识符** | `email`, `uuid`, `uuid-any`, `cuid`, `cuid2`, `ulid`, `nanoid`, `objectid`, `slug` | 各种 ID 格式 |
| **网络** | `url`, `uri`, `ipv4`, `ipv6`, `ip`, `cidr`, `hostname` | 网络地址 |
| **日期时间** | `date`, `time`, `date-time`, `datetime`, `duration` | ISO 8601 格式 |
| **手机号** | `phone` (中国), `phone-cn`, `phone-e164` (国际) | 电话号码 |
| **编码** | `base64`, `base64url`, `jwt` | 编码格式 |
| **颜色** | `hex-color`, `rgb-color`, `color` | 颜色值 |
| **其他** | `emoji`, `semver`, `credit-card` | 特殊格式 |

**使用示例：**

```typescript
import { Type } from 'vafast'

const UserSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  uuid: Type.String({ format: 'uuid' }),
  website: Type.String({ format: 'url' }),
  phone: Type.String({ format: 'phone-e164' }),
  createdAt: Type.String({ format: 'date-time' })
})
```

**自定义 Format：**

```typescript
import { registerFormat, Patterns } from 'vafast'

// 注册自定义 format
registerFormat('order-id', (v) => /^ORD-\d{8}$/.test(v))

// 使用内置正则（供外部使用）
const isEmail = Patterns.EMAIL.test('test@example.com')
```

> **源码位置：** `src/utils/formats.ts`

## 基本验证

### 请求体验证

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0, maximum: 150 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => {
      // body 已经通过验证，类型安全
      const { name, email, age } = body
      return { name, email, age: age || 18 }
    }
  })
])
```

> **新框架用法说明**：
> - Schema 验证通过 `schema` 字段定义，不再使用 `body`、`query` 等独立字段
> - Handler 直接接收验证后的数据，自动获得类型推断

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
  defineRoute({
    method: 'GET',
    path: '/search',
    schema: { query: searchSchema },
    handler: ({ query }) => {
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
  defineRoute({
    method: 'GET',
    path: '/users/:id/:action?',
    schema: { params: userParamsSchema },
    handler: ({ params }) => {
      const { id, action = 'profile' } = params
      return `User ${id} ${action}`
    }
  })
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
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => {
      return createUser(body)
    }
  })
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
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userInputSchema },
    handler: ({ body }) => {
      if (body.type === 'create') {
        return createUser(body.data)
      } else {
        return updateUser(body.id, body.data)
      }
    }
  })
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
  defineRoute({
    method: 'POST',
    path: '/accounts',
    schema: { body: conditionalSchema },
    handler: ({ body }) => {
      return createAccount(body)
    }
  })
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
  defineRoute({
    method: 'POST',
    path: '/scores',
    schema: {
      body: Type.Object({
        username: customStringSchema,
        score: customNumberSchema
      })
    },
    handler: ({ body }) => {
      return saveScore(body)
    }
  })
])
```

### 异步验证

```typescript
import { defineRoute, defineRoutes, err, Type } from 'vafast'

const asyncValidationSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  username: Type.String({ minLength: 3, maxLength: 20 })
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: asyncValidationSchema },
    handler: async ({ body }) => {
      // 异步验证
      const emailExists = await checkEmailExists(body.email)
      if (emailExists) {
        throw err.conflict('Email already exists')
      }
      
      const usernameExists = await checkUsernameExists(body.username)
      if (usernameExists) {
        throw err.conflict('Username already exists')
      }
      
      return createUser(body)
    }
  })
])
```

> **新框架用法说明**：
> - Schema 验证在 `schema` 字段中定义
> - Handler 可以是异步函数，直接处理业务逻辑
> - 不再使用 `createHandler` 的两参数形式

## 错误处理

### 验证错误

当验证失败时，Vafast 会自动返回 400 错误：

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
      email: Type.String({ format: 'email' })
    })
    },
    handler: ({ body }) => {
      // 如果验证失败，这里不会执行
      return createUser(body)
    }
  })
])
```

### 自定义错误处理

::: tip
框架内置了验证错误处理，通常无需手动编写错误处理中间件。
:::

```typescript
import { defineRoute, defineRoutes, defineMiddleware, json } from 'vafast'

const errorHandler = defineMiddleware(async (req, next) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof Error && error.message.includes('验证失败')) {
      return json({ error: 'Validation failed', message: error.message }, 400)
    }
    return json({ error: 'Internal server error' }, 500)
  }
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => createUser(body),
    middleware: [errorHandler]
  })
])
```

## 性能优化

### 预编译验证器

::: tip 推荐
框架内部已自动预编译 Schema，无需手动预编译。
:::

```typescript
// 框架内部会自动预编译 schema
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => createUser(body)
  })
])
```

### 使用 defineRoute 内置验证（推荐）

框架已内置高性能验证，自动缓存编译后的验证器：

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => createUser(body)
  })
])
```

> **新框架用法说明**：
> - Schema 验证在路由配置的 `schema` 字段中定义
> - 框架自动预编译和缓存验证器，无需手动处理
> - Handler 直接接收验证后的数据，自动获得类型推断

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

### 3. 使用 defineRoute 内置验证（推荐）

::: tip
不推荐手动编写验证中间件，使用 `defineRoute` 的 `schema` 字段更简洁、类型安全。
:::

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => createUser(body)  // body 已验证且类型安全
  })
])
```

> **新框架用法说明**：
> - Schema 验证在路由配置的 `schema` 字段中定义
> - Handler 直接接收验证后的数据，自动获得类型推断
> - 不再使用 `createHandler` 的两参数形式

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