---
title: 类型 - Vafast
---

<script setup>
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'
</script>

# 类型

这是在 Vafast 中编写验证类型的常见模式。

<Deck>
    <Card title="基本类型" href="#primitive-type">
    	常见的 TypeBox API
    </Card>
    <Card title="Vafast 类型" href="#vafast-type">
   		Vafast 和 HTTP 的专用类型
    </Card>
    <Card title="Vafast 行为" href="#vafast-behavior">
  		TypeBox 与 Vafast 的集成
    </Card>
</Deck>

## 基本类型

TypeBox API 是围绕 TypeScript 类型设计的，并与之类似。

有许多熟悉的名称和行为与 TypeScript 对应项交叉，例如 **String**、**Number**、**Boolean** 和 **Object**，以及更高级的功能，如 **Intersect**、**KeyOf** 和 **Tuple**，以增强灵活性。

如果你熟悉 TypeScript，创建 TypeBox 模式的行为就像编写 TypeScript 类型一样，只是它在运行时提供实际的类型验证。

要创建第一个模式，从 TypeBox 导入 **Type**，并从最基本的类型开始：

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const BodySchema = Type.String()

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/',
    // schema 会自动验证并返回 422 错误（含 details）
    schema: { body: BodySchema },
    handler: ({ body }) => `Hello ${body}`
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

这段代码告诉 Vafast 验证传入的 HTTP 主体，确保主体是一个字符串。如果它是字符串，则可以在请求管道和处理程序中流动。

如果形状不匹配，将抛出验证错误。

### 基本类型

TypeBox 提供具有与 TypeScript 类型相同行为的基本原始类型。

以下表格列出了最常见的基本类型：

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>TypeScript</td>
</tr>

<tr>
<td>

```typescript
Type.String()
```

</td>
<td>

```typescript
string
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Number()
```

</td>
<td>

```typescript
number
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Boolean()
```

</td>
<td>

```typescript
boolean
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Null()
```

</td>
<td>

```typescript
null
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Undefined()
```

</td>
<td>

```typescript
undefined
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Any()
```

</td>
<td>

```typescript
any
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Unknown()
```

</td>
<td>

```typescript
unknown
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Never()
```

</td>
<td>

```typescript
never
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Void()
```

</td>
<td>

```typescript
void
```

</td>
</tr>

<tr>
<td>

```typescript
Type.Symbol()
```

</td>
<td>

```typescript
symbol
```

</td>
</tr>

<tr>
<td>

```typescript
Type.BigInt()
```

</td>
<td>

```typescript
bigint
```

</td>
</tr>
</tbody>
</table>

### 字符串类型

TypeBox 提供了多种字符串验证选项：

```typescript
import { Type } from 'vafast'

// 基本字符串
const basicString = Type.String()

// 带长度限制的字符串
const limitedString = Type.String({ 
  minLength: 1, 
  maxLength: 100 
})

// 带正则表达式的字符串
const emailString = Type.String({ 
  format: 'email' 
})

// 带枚举值的字符串
const statusString = Type.Union([
  Type.Literal('active'),
  Type.Literal('inactive'),
  Type.Literal('pending')
])
```

### 数字类型

```typescript
import { Type } from 'vafast'

// 基本数字
const basicNumber = Type.Number()

// 带范围限制的数字
const ageNumber = Type.Number({ 
  minimum: 0, 
  maximum: 150 
})

// 整数
const integerNumber = Type.Integer()

// 正数
const positiveNumber = Type.Number({ 
  minimum: 0, 
  exclusiveMinimum: true 
})
```

### 对象类型

```typescript
import { Type } from 'vafast'

// 基本对象
const userObject = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number())
})

// 嵌套对象
const addressObject = Type.Object({
  street: Type.String(),
  city: Type.String(),
  country: Type.String()
})

const userWithAddress = Type.Object({
  ...userObject.properties,
  address: addressObject
})
```

### 数组类型

```typescript
import { Type } from 'vafast'

// 基本数组
const stringArray = Type.Array(Type.String())

// 带长度限制的数组
const limitedArray = Type.Array(Type.Number(), {
  minItems: 1,
  maxItems: 10
})

// 元组类型
const tuple = Type.Tuple([
  Type.String(),
  Type.Number(),
  Type.Boolean()
])
```

## Vafast 类型

Vafast 使用 TypeBox 进行类型验证，提供了完整的类型安全。

### 请求体验证

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    // schema 自动验证 body，验证失败返回 422
    schema: { body: userSchema },
    handler: ({ body }) => ({ success: true, data: body })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 查询参数验证

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const querySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String())
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    // schema 自动解析和验证 query 参数
    schema: { query: querySchema },
    handler: ({ query }) => ({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? ''
    })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 路径参数验证

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const paramsSchema = Type.Object({
  id: Type.String({ minLength: 1 })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    // schema 自动验证 params
    schema: { params: paramsSchema },
    handler: ({ params }) => ({ userId: params.id })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### 头部验证

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const headersSchema = Type.Object({
  authorization: Type.String({ pattern: '^Bearer .+' })
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/secure',
    // schema 自动验证 headers
    schema: { headers: headersSchema },
    handler: ({ headers }) => {
      const token = headers.authorization.replace('Bearer ', '')
      return { token }
    }
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## Vafast 行为

Vafast 与 TypeBox 的集成提供了以下特性：

### 自动类型推断

```typescript
import { Type, type Static } from 'vafast'

// 定义模式
const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Number({ minimum: 0 })
})

// TypeScript 自动推断类型
type User = Static<typeof userSchema>
// 等同于: { name: string; email: string; age: number }
```

### 验证错误处理

使用 `defineRoute` 时，Schema 校验失败会自动返回 **HTTP 422**：

```json
{
  "code": 422,
  "message": "请求参数校验失败",
  "details": [
    {
      "location": "body",
      "path": "/email",
      "field": "email",
      "message": "Expected string to match 'email' format"
    }
  ]
}
```

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => ({ success: true, data: body })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

如果需要获取详细的验证错误信息，可以使用自定义错误处理中间件：

```typescript
import { Type } from 'vafast'
import { TypeCompiler } from '@sinclair/typebox/compiler'

// 自定义验证错误处理（高级用法）
const userValidator = TypeCompiler.Compile(userSchema)

const validateWithDetails = (data: unknown) => {
  const errors = [...userValidator.Errors(data)]
  if (errors.length > 0) {
    return {
      valid: false,
      errors: errors.map(e => ({
        path: e.path,
        message: e.message
      }))
    }
  }
  return { valid: true, errors: [] }
}
```

### 高级类型模式

#### 联合类型

```typescript
const statusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('inactive'),
  Type.Literal('pending')
])

const userStatusSchema = Type.Object({
  id: Type.Number(),
  status: statusSchema,
  updatedAt: Type.String({ format: 'date-time' })
})
```

#### 交叉类型

```typescript
const baseUserSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' })
})

const adminUserSchema = Type.Object({
  role: Type.Literal('admin'),
  permissions: Type.Array(Type.String())
})

const adminUser = Type.Intersect([baseUserSchema, adminUserSchema])
```

#### 递归类型

```typescript
import { Type } from 'vafast'

const commentSchema = Type.Recursive(This => Type.Object({
  id: Type.Number(),
  content: Type.String(),
  author: Type.String(),
  replies: Type.Array(This)
}))
```

### 性能优化

#### 预编译验证器

::: tip 推荐
`defineRoute` 内部已自动预编译 Schema，通常无需手动预编译。以下仅用于了解底层原理或脱离 Vafast 单独使用 TypeBox。
:::

```typescript
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String()
})

// 手动预编译（defineRoute 已内置，通常不需要）
const userValidator = TypeCompiler.Compile(userSchema)

// 使用预编译的验证器
const isValid = userValidator.Check({ name: 'John', email: 'john@example.com' })
```

## 最佳实践

### 1. 使用描述性的错误消息

```typescript
const userSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    error: 'Name is required'
  }),
  email: Type.String({
    format: 'email',
    error: 'Please provide a valid email address'
  }),
  age: Type.Number({
    minimum: 0,
    maximum: 150,
    error: 'Age must be between 0 and 150'
  })
})
```

### 2. 重用验证模式

```typescript
import { Type } from 'vafast'

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

### 3. 类型安全的路由定义

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'
import type { Static } from 'vafast'

// 定义模式
const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

type User = Static<typeof userSchema>

const paramsSchema = Type.Object({
  id: Type.String()
})

// 定义路由 - 使用 defineRoute 自动获得类型安全
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: { params: paramsSchema },
    handler: ({ params }) => ({ userId: params.id })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    // body 已经是完全类型安全的 User 类型
    handler: ({ body }) => ({ success: true, user: body })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## 总结

Vafast 的类型系统提供了：

- ✅ 基于 TypeBox 的完整类型安全
- ✅ 运行时数据验证
- ✅ 自动类型推断
- ✅ 灵活的验证规则
- ✅ 性能优化选项
- ✅ 错误处理支持

### 下一步

- 查看 [验证系统](/essential/validation) 了解完整的验证功能
- 学习 [路由系统](/routing) 了解如何组织路由
- 探索 [中间件系统](/middleware) 了解如何增强功能
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
