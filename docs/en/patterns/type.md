---
title: Types - Vafast
description: 'Vafast type system patterns: TypeBox primitive, string, number, object and array types, request validation, type inference and advanced union and recursive types.'
---

<script setup>
import Card from '../../components/nearl/card.vue'
import Deck from '../../components/nearl/card-deck.vue'
</script>

# Types

Here are the common patterns for writing validation types in Vafast.

<Deck>
    <Card title="Primitive Type" href="#primitive-type">
    	Common TypeBox APIs
    </Card>
    <Card title="Vafast Type" href="#vafast-type">
   		Types specific to Vafast and HTTP
    </Card>
    <Card title="Vafast Behavior" href="#vafast-behavior">
  		How TypeBox integrates with Vafast
    </Card>
</Deck>

## Primitive Type

The TypeBox API is designed around, and closely resembles, TypeScript types.

Many familiar names and behaviors overlap with their TypeScript counterparts, such as **String**, **Number**, **Boolean** and **Object**, along with more advanced features like **Intersect**, **KeyOf** and **Tuple** for flexibility.

If you know TypeScript, creating a TypeBox schema feels just like writing a TypeScript type, except it provides real type validation at runtime.

To create your first schema, import **Type** from TypeBox and start with the most basic type:

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const BodySchema = Type.String()

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/',
    // the schema validates automatically and returns a 422 error (with details)
    schema: { body: BodySchema },
    handler: ({ body }) => `Hello ${body}`
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

This code tells Vafast to validate the incoming HTTP body and make sure it's a string. If it is, it can flow through the request pipeline and handler.

If the shape doesn't match, a validation error is thrown.

### Basic Types

TypeBox provides basic primitive types that behave the same as TypeScript types.

The table below lists the most common basic types:

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

### String Types

TypeBox provides a variety of string validation options:

```typescript
import { Type } from 'vafast'

// basic string
const basicString = Type.String()

// string with length limits
const limitedString = Type.String({ 
  minLength: 1, 
  maxLength: 100 
})

// string with a regex
const emailString = Type.String({ 
  format: 'email' 
})

// string with enum values
const statusString = Type.Union([
  Type.Literal('active'),
  Type.Literal('inactive'),
  Type.Literal('pending')
])
```

### Number Types

```typescript
import { Type } from 'vafast'

// basic number
const basicNumber = Type.Number()

// number with range limits
const ageNumber = Type.Number({ 
  minimum: 0, 
  maximum: 150 
})

// integer
const integerNumber = Type.Integer()

// positive number
const positiveNumber = Type.Number({ 
  minimum: 0, 
  exclusiveMinimum: true 
})
```

### Object Types

```typescript
import { Type } from 'vafast'

// basic object
const userObject = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number())
})

// nested object
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

### Array Types

```typescript
import { Type } from 'vafast'

// basic array
const stringArray = Type.Array(Type.String())

// array with length limits
const limitedArray = Type.Array(Type.Number(), {
  minItems: 1,
  maxItems: 10
})

// tuple type
const tuple = Type.Tuple([
  Type.String(),
  Type.Number(),
  Type.Boolean()
])
```

## Vafast Type

Vafast uses TypeBox for type validation, providing full type safety.

### Request Body Validation

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
    // the schema validates body automatically; returns 422 on failure
    schema: { body: userSchema },
    handler: ({ body }) => ({ success: true, data: body })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### Query Parameter Validation

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
    // the schema parses and validates query params automatically
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

### Path Parameter Validation

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const paramsSchema = Type.Object({
  id: Type.String({ minLength: 1 })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    // the schema validates params automatically
    schema: { params: paramsSchema },
    handler: ({ params }) => ({ userId: params.id })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

### Header Validation

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

const headersSchema = Type.Object({
  authorization: Type.String({ pattern: '^Bearer .+' })
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/secure',
    // the schema validates headers automatically
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

## Vafast Behavior

Vafast's integration with TypeBox provides the following:

### Automatic Type Inference

```typescript
import { Type, type Static } from 'vafast'

// define the schema
const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Number({ minimum: 0 })
})

// TypeScript infers the type automatically
type User = Static<typeof userSchema>
// equivalent to: { name: string; email: string; age: number }
```

### Validation Error Handling

With `defineRoute`, schema validation failures automatically return **HTTP 422**:

```json
{
  "code": 422,
  "message": "Request validation failed",
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

If you need detailed validation error info, use a custom error handling middleware:

```typescript
import { Type } from 'vafast'
import { TypeCompiler } from '@sinclair/typebox/compiler'

// custom validation error handling (advanced)
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

### Advanced Type Patterns

#### Union Types

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

#### Intersection Types

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

#### Recursive Types

```typescript
import { Type } from 'vafast'

const commentSchema = Type.Recursive(This => Type.Object({
  id: Type.Number(),
  content: Type.String(),
  author: Type.String(),
  replies: Type.Array(This)
}))
```

### Performance

#### Precompiled Validators

::: tip Recommended
`defineRoute` already precompiles schemas internally, so manual precompilation is usually unnecessary. The following is only for understanding the internals or using TypeBox on its own outside Vafast.
:::

```typescript
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String(),
  email: Type.String()
})

// manual precompilation (built into defineRoute; usually not needed)
const userValidator = TypeCompiler.Compile(userSchema)

// use the precompiled validator
const isValid = userValidator.Check({ name: 'John', email: 'john@example.com' })
```

## Best Practices

### 1. Use Descriptive Error Messages

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

### 2. Reuse Validation Schemas

```typescript
import { Type } from 'vafast'

// base schema
const baseUserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

// create-user schema
const createUserSchema = baseUserSchema

// update-user schema
const updateUserSchema = Type.Partial(baseUserSchema)

// user list query schema
const userQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String())
})
```

### 3. Type-Safe Route Definitions

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'
import type { Static } from 'vafast'

// define the schema
const userSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' })
})

type User = Static<typeof userSchema>

const paramsSchema = Type.Object({
  id: Type.String()
})

// define routes - defineRoute gives you type safety automatically
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
    // body is already a fully type-safe User
    handler: ({ body }) => ({ success: true, user: body })
  })
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## Summary

Vafast's type system provides:

- ✅ Full type safety based on TypeBox
- ✅ Runtime data validation
- ✅ Automatic type inference
- ✅ Flexible validation rules
- ✅ Performance optimizations
- ✅ Error handling support

### Next Steps

- Read [Validation](/en/essential/validation) for the full validation features
- Learn [Routing](/en/routing) to see how to organize routes
- Explore the [Middleware System](/en/middleware) to extend functionality
- See [Best Practices](/en/essential/best-practice) for more development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).
