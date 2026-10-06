---
title: OpenAPI - Vafast
description: 'Vafast OpenAPI support: auto-generate API docs with the Swagger middleware, type-safe route and response schema definitions, custom configuration and best practices.'
---

# OpenAPI

Vafast offers first-class support for, and follows, the OpenAPI schema by default.

Vafast can automatically generate an API documentation page through the Swagger middleware.

To generate a Swagger page, install the middleware:
```bash
npm install @vafast/swagger
```

And register the middleware with the server:
```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { swagger } from '@vafast/swagger'

const routes = defineRoutes([
  // your route definitions
])

const server = new Server(routes)
server.use(swagger())
```

> **Notes on the new framework API**:
> - Create a server instance with the `Server` class
> - Register global middleware with `server.use()`

By default, Vafast uses the OpenAPI V3 schema and [Scalar UI](http://scalar.com).

For Swagger middleware configuration, see the [Swagger middleware page](/en/middleware/swagger).

## Route Definitions

We add route information by providing schema types.

However, sometimes defining types alone doesn't make clear what a route does. You can use the `detail` field to explicitly describe the route's purpose.

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import { swagger } from '@vafast/swagger'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/sign-in',
    schema: {
      body: Type.Object(
        {
          username: Type.String(),
          password: Type.String({
            minLength: 8,
            description: 'User password (at least 8 characters)'
          })
        },
        {
          description: 'The expected username and password'
        }
      )
    },
    handler: ({ body }) => body,
    name: 'User login',
    description: 'Users sign in with a username and password'
  })
])

const server = new Server(routes)
server.use(swagger())
```

> **Notes on the new framework API**:
> - Schema validation is defined in the `schema` field
> - Route metadata uses the `name` and `description` fields

The detail fields follow the OpenAPI V3 definition, with auto-completion and type safety by default.

The details are then passed to Swagger, so the description appears in the Swagger route.

### detail

`detail` extends the [OpenAPI Operation Object](https://swagger.io/specification#operation-object)

The detail field is an object describing the route's API documentation.

It may contain the following:

### tags

A list of tags for the operation. Tags can be used to group operations logically by resource or any other identifier.

### summary

A short summary of what the operation does.

### description

A detailed explanation of the operation's behavior.

### externalDocs

Additional external documentation for the operation.

### operationId

A unique string identifying the operation. The ID must be unique among all operations described in the API. The operationId value is case-sensitive.

### deprecated

Declares the operation deprecated. Consumers should refrain from using it. The default is `false`.

### security

Declares the security requirements for the operation.

## Type Safety

Vafast's OpenAPI integration provides full type safety:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: {
      params: Type.Object({
        id: Type.String({ description: 'User ID' })
      }),
      query: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, description: 'Page number' }))
      })
    },
    handler: ({ params, query }) => {
      // both params.id and query.page are type-safe
      return { userId: params.id, page: query.page }
    },
    name: 'Get user info',
    description: 'Get user details by user ID'
  })
])
```

## Response Schemas

You can also define response schemas:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

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
      return { id: '123', ...body, createdAt: new Date() }
    },
    name: 'Create user',
    description: 'Create a new user',
    docs: {
      tags: ['User Management'],
      responses: {
        201: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: Type.Object({
                id: Type.String(),
                name: Type.String(),
                email: Type.String(),
                createdAt: Type.String()
              })
            }
          }
        },
        400: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: Type.Object({
                error: Type.String(),
                details: Type.Array(Type.String())
              })
            }
          }
        }
      }
    }
  })
])
```

> **Notes on the new framework API**:
> - Schema validation is defined in the `schema` field
> - API documentation info is defined in the `docs` field (`detail` is no longer used)

## Middleware Integration

Vafast's Swagger middleware integrates seamlessly with other middleware:

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { swagger } from '@vafast/swagger'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'

const routes = defineRoutes([
  // your route definitions
])

const server = new Server(routes)
server.use(cors())
server.use(helmet())
server.use(swagger({
    documentation: {
      info: {
        title: 'Vafast API',
        version: '1.0.0',
        description: 'Vafast framework API docs'
      },
      tags: [
        { name: 'User Management', description: 'User operations' },
        { name: 'Authentication', description: 'Sign-in, sign-up and related operations' }
      ]
    }
  }))
```

## Custom Configuration

The Swagger middleware supports a rich set of options:

```typescript
import { Server } from 'vafast'
import { swagger } from '@vafast/swagger'

const server = new Server(routes)

server.use(swagger({
  documentation: {
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'An API built with the Vafast framework'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://api.example.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  swagger: {
    path: '/swagger',
    uiConfig: {
      docExpansion: 'list',
      filter: true
    }
  }
}))
```

## Best Practices

1. **Use descriptive tags**: use consistent tags for related routes
2. **Provide detailed summaries**: every route should have a clear summary
3. **Define response schemas**: explicitly specify success and error response formats
4. **Use type validation**: rely on TypeBox's type system to ensure data integrity
5. **Versioning**: state version info clearly in the API docs

## Related Links

- [Swagger middleware](/en/middleware/swagger) - full Swagger configuration options
- [TypeBox integration](/en/patterns/type) - learn about the type validation system
- [Route definitions](/en/routing) - learn how to define routes
- [Middleware system](/en/middleware) - explore other available middleware
