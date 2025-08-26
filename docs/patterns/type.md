---
title: 类型 - Vafast
head:
    - - meta
      - property: 'og:title'
        content: 类型 - Vafast

    - - meta
      - name: 'description'
        content: 模式是严格类型定义，用于推断 TypeScript 的类型和对传入请求及传出响应的数据验证。Vafast 的模式验证基于 Sinclair 的 TypeBox，这是一个用于数据验证的 TypeScript 库。

    - - meta
      - property: 'og:description'
        content: 模式是严格类型定义，用于推断 TypeScript 的类型和对传入请求及传出响应的数据验证。Vafast 的模式验证基于 Sinclair 的 TypeBox，这是一个用于数据验证的 TypeScript 库。
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

```typescript twoslash
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/',
    handler: createRouteHandler(({ body }) => `Hello ${body}`),
    body: Type.String()
  }
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
import { Type } from '@sinclair/typebox'

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
import { Type } from '@sinclair/typebox'

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
import { Type } from '@sinclair/typebox'

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
import { Type } from '@sinclair/typebox'

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
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      // body 已经通过验证，类型安全
      return createUser(body)
    }),
    body: userSchema
  }
])
```

### 查询参数验证

```typescript
const querySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String())
})

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createRouteHandler(({ query }) => {
      const { page = 1, limit = 10, search = '' } = query
      return searchUsers({ page, limit, search })
    }),
    query: querySchema
  }
])
```

### 路径参数验证

```typescript
const paramsSchema = Type.Object({
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
      return getUserData(id, action)
    }),
    params: paramsSchema
  }
])
```

### 头部验证

```typescript
const headersSchema = Type.Object({
  authorization: Type.String({ pattern: '^Bearer .+' }),
  'content-type': Type.Optional(Type.String()),
  'user-agent': Type.Optional(Type.String())
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/secure',
    handler: createRouteHandler(({ headers }) => {
      const token = headers.authorization.replace('Bearer ', '')
      return processSecureRequest(token)
    }),
    headers: headersSchema
  }
])
```

### Cookie 验证

```typescript
const cookiesSchema = Type.Object({
  sessionId: Type.String(),
  theme: Type.Optional(Type.Union([
    Type.Literal('light'),
    Type.Literal('dark')
  ]))
})

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/preferences',
    handler: createRouteHandler(({ cookies }) => {
      const { sessionId, theme = 'light' } = cookies
      return getUserPreferences(sessionId, theme)
    }),
    cookies: cookiesSchema
  }
])
```

## Vafast 行为

Vafast 与 TypeBox 的集成提供了以下特性：

### 自动类型推断

```typescript
import { Type } from '@sinclair/typebox'

// 定义模式
const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Number({ minimum: 0 })
})

// TypeScript 自动推断类型
type User = Static<typeof userSchema>
// 等同于: { name: string; email: string; age: number }

// 在处理器中使用
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }: { body: User }) => {
      // body 完全类型安全
      return createUser(body)
    }),
    body: userSchema
  }
])
```

### 验证错误处理

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      return createUser(body)
    }),
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      email: Type.String({ format: 'email' })
    }),
    // 自定义验证错误处理
    validationErrorHandler: (errors) => {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: errors
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
])
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

#### 条件类型

```typescript
const conditionalSchema = Type.Object({
  type: Type.Union([
    Type.Literal('individual'),
    Type.Literal('company')
  ]),
  name: Type.String(),
  // 条件字段
  ssn: Type.Conditional(
    Type.Ref('type'),
    Type.Literal('individual'),
    Type.String({ pattern: '^\\d{3}-\\d{2}-\\d{4}$' }),
    Type.Never()
  ),
  companyName: Type.Conditional(
    Type.Ref('type'),
    Type.Literal('company'),
    Type.String({ minLength: 1 }),
    Type.Never()
  )
})
```

#### 递归类型

```typescript
const commentSchema = Type.Object({
  id: Type.Number(),
  content: Type.String(),
  author: Type.String(),
  replies: Type.Array(Type.Recursive(() => commentSchema))
})
```

### 性能优化

#### 预编译验证器

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

#### 缓存验证结果

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

### 3. 类型安全的路由定义

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

// 定义类型
interface User {
  id: number
  name: string
  email: string
}

// 定义模式
const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

// 定义路由
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(({ params }) => {
      const userId = Number(params.id)
      return getUserById(userId)
    }),
    params: Type.Object({
      id: Type.Number({ minimum: 1 })
    })
  },
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      // body 完全类型安全
      return createUser(body)
    }),
    body: userSchema
  }
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
- 学习 [路由系统](/essential/route) 了解如何组织路由
- 探索 [中间件系统](/middleware) 了解如何增强功能
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。