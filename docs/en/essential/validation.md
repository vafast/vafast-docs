---
title: Validation - Vafast
description: 'Request validation in Vafast with TypeBox schemas: validate body, query, params, headers and cookies, get inferred types, built-in formats and automatic 422 errors.'
---

<script setup>
import Card from '../../components/nearl/card.vue'
import Deck from '../../components/nearl/card-deck.vue'
</script>

# Validation

The whole point of an API server is to receive input and process it.

JavaScript lets any data be any type. Vafast provides a tool to validate data and make sure it's in the right shape.

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

### TypeBox

**TypeBox** is a type-safe schema builder for runtime, compile time and OpenAPI schemas, and can be used to generate OpenAPI/Swagger docs.

TypeBox is a very fast, lightweight and type-safe TypeScript runtime validation library. Vafast uses TypeBox directly for validation, providing full type safety.

We believe validation should be handled natively by the framework, rather than relying on users to set up custom types for every project.

### TypeScript

You get full type safety by accessing TypeBox's type definitions:

```typescript
import { Type } from 'vafast'

const UserSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

// type is inferred automatically
type User = Static<typeof UserSchema>
```

### Built-in Format Validation

Vafast ships with common format validators that are registered automatically at startup, on par with Zod's built-in validations:

| Category | Format | Description |
|------|--------|------|
| **Identifiers** | `email`, `uuid`, `uuid-any`, `cuid`, `cuid2`, `ulid`, `nanoid`, `objectid`, `slug` | Various ID formats |
| **Network** | `url`, `uri`, `ipv4`, `ipv6`, `ip`, `cidr`, `hostname` | Network addresses |
| **Date/time** | `date`, `time`, `date-time`, `datetime`, `duration` | ISO 8601 formats |
| **Phone numbers** | `phone` (China), `phone-cn`, `phone-e164` (international) | Phone numbers |
| **Encodings** | `base64`, `base64url`, `jwt` | Encoding formats |
| **Colors** | `hex-color`, `rgb-color`, `color` | Color values |
| **Other** | `emoji`, `semver`, `credit-card` | Special formats |

**Example:**

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

**Custom formats:**

```typescript
import { registerFormat, Patterns } from 'vafast'

// register a custom format
registerFormat('order-id', (v) => /^ORD-\d{8}$/.test(v))

// use the built-in regexes (exported for external use)
const isEmail = Patterns.EMAIL.test('test@example.com')
```

> **Source:** `src/utils/formats.ts`

## Basic Validation

### Request Body Validation

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
      // body has been validated and is type-safe
      const { name, email, age } = body
      return { name, email, age: age || 18 }
    }
  })
])
```

### Query Parameter Validation

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

### Path Parameter Validation

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

## Advanced Validation

### Nested Objects

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

### Union Types

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

### Conditional Validation

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

## Custom Validation

### Custom Validators

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

### Async Validation

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
      // async validation
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

## Error Handling

### Schema Validation Failures (422)

When a `defineRoute` `schema` fails validation, Vafast **automatically returns HTTP 422** (not 400):

```json
HTTP 422 Unprocessable Entity

{
  "code": 422,
  "message": "Request validation failed",
  "details": [
    {
      "location": "body",
      "path": "/email",
      "field": "email",
      "message": "Expected string to match 'email' format",
      "value": "invalid"
    }
  ]
}
```

| Field | Description |
|------|------|
| `details[].location` | Where validation failed: `body` / `query` / `params` / `headers` / `cookies` |
| `details[].path` | JSON Pointer, e.g. `/receiver/name`, `/orderIds/0` |
| `details[].field` | Field path, e.g. `receiver.name`, `orderIds.0` |
| `details[].message` | Original TypeBox message in English; the server does not translate it |
| `details[].value` | Optional; the actual value that triggered the error |

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
      // never reached when validation fails
      return createUser(body)
    }
  })
])
```

### Business Errors

For business errors, `throw err.xxx()` in the handler; the framework's `errorHandler` converts them to JSON (**without** `details`):

```typescript
import { defineRoute, Type, err } from 'vafast'

defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: userSchema },
  handler: ({ body }) => {
    if (emailExists(body.email)) throw err.conflict('Email already exists')
    return createUser(body)
  },
})
```

## Performance

### Precompiled Validators

::: tip Recommended
The framework precompiles schemas automatically; no manual precompilation needed.
:::

```typescript
// the framework precompiles schemas internally
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => createUser(body)
  })
])
```

### Use defineRoute's Built-in Validation (Recommended)

The framework has built-in high-performance validation and caches compiled validators automatically:

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

## Best Practices

### 1. Use Descriptive Error Messages

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

### 2. Reuse Validation Schemas

```typescript
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

### 3. Use defineRoute's Built-in Validation (Recommended)

::: tip
Writing validation middleware by hand is not recommended; the `schema` field of `defineRoute` is more concise and type-safe.
:::

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: userSchema },
    handler: ({ body }) => createUser(body)  // body is validated and type-safe
  })
])
```

## Summary

Vafast's validation system provides:

- ✅ Full type safety based on TypeBox
- ✅ Runtime data validation
- ✅ Automatic error handling
- ✅ Performance optimizations
- ✅ Flexible validation rules
- ✅ Middleware integration

### Next Steps

- Read [Routing](/en/routing) to learn how to organize routes
- Learn about [Handlers](/en/essential/handler) to see how requests are processed
- Explore the [Middleware System](/en/middleware) to extend functionality
- See [Best Practices](/en/essential/best-practice) for more development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).