---
title: Testing - Vafast
description: 'Unit testing Vafast apps: test routes in-process with server.fetch, use Vitest or Bun test, mock middleware and verify type-safe responses without a network.'
---

# Unit Testing

As a WinterCG-compliant implementation, Vafast servers can be tested with the Request/Response classes.

Vafast provides a **Server.fetch** method that accepts a Web-standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and returns a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response), simulating an HTTP request.

Bun includes a built-in [test runner](https://bun.sh/docs/cli/test) that offers a Jest-like API through the `bun:test` module, making it easy to write unit tests.

Create **test/index.test.ts** in the project root with the following content:

```typescript
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'

describe('Vafast', () => {
    it('returns a response', async () => {
        const routes = defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/',
            handler: () => 'hi'
          })
        ])
        
        const server = new Server(routes)

        const response = await server
            .fetch(new Request('http://localhost/'))
            .then((res) => res.text())

        expect(response).toBe('hi')
    })
})
```

Then run the tests with **npm test**.

```bash
npm test
```

A new request to a Vafast server must be a fully valid URL, **not** a partial URL.

The request must provide a URL in the following format:

| URL                   | Valid |
| --------------------- | ----- |
| http://localhost/user | ✅    |
| /user                 | ❌    |

You can also use other test libraries such as Jest to write Vafast unit tests.

## Testing Routes

You can test different routes and HTTP methods:

```typescript
// test/routes.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'

describe('Vafast Routes', () => {
    const routes = defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/users/:id',
        handler: ({ params }) => `User ${params.id}`
      }),
      defineRoute({
        method: 'POST',
        path: '/users',
        handler: ({ body }) => ({ id: 1, ...body })
      })
    ])
    
    const server = new Server(routes)

    it('handles GET request with params', async () => {
        const response = await server
            .fetch(new Request('http://localhost/users/123'))
            .then((res) => res.text())

        expect(response).toBe('User 123')
    })

    it('handles POST request with body', async () => {
        const response = await server
            .fetch(new Request('http://localhost/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John', email: 'john@example.com' })
            }))
            .then((res) => res.json())

        expect(response).toEqual({
            id: 1,
            name: 'John',
            email: 'john@example.com'
        })
    })
})
```

## Testing Middleware

Test middleware behavior:

```typescript
// test/middleware.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes, defineMiddleware } from 'vafast'

describe('Vafast Middleware', () => {
    const loggingMiddleware = defineMiddleware(async (req, next) => {
        console.log(`${req.method} ${req.url}`)
        const response = await next()
        console.log(`Response: ${response.status}`)
        return response
    })

    const routes = defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/test',
        handler: () => 'Hello from middleware'
      })
    ])
    
    const server = new Server(routes)
    server.use(loggingMiddleware)

    it('executes middleware correctly', async () => {
        const response = await server
            .fetch(new Request('http://localhost/test'))
            .then((res) => res.text())

        expect(response).toBe('Hello from middleware')
    })
})
```

## Testing Validation

Test TypeBox validation:

```typescript
// test/validation.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes, Type } from 'vafast'

describe('Vafast Validation', () => {
    const userSchema = Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.String({ format: 'email' }),
        age: Type.Number({ minimum: 0 })
    })

    const routes = defineRoutes([
      defineRoute({
        method: 'POST',
        path: '/users',
        schema: { body: userSchema },
        handler: ({ body }) => ({ success: true, user: body })
      })
    ])
    
    const server = new Server(routes)

    it('validates valid request body', async () => {
        const response = await server
            .fetch(new Request('http://localhost/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'John',
                    email: 'john@example.com',
                    age: 25
                })
            }))
            .then((res) => res.json())

        expect(response.success).toBe(true)
        expect(response.user.name).toBe('John')
    })

    it('rejects invalid request body', async () => {
        const response = await server
            .fetch(new Request('http://localhost/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: '', // violates minLength: 1
                    email: 'invalid-email', // violates format: 'email'
                    age: -5 // violates minimum: 0
                })
            }))

        expect(response.status).toBe(422)
        const body = await response.json()
        expect(body.code).toBe(422)
        expect(body.details).toBeArray()
    })
})
```

## Testing Error Handling

Test error handling logic:

```typescript
// test/error-handling.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'

describe('Vafast Error Handling', () => {
    const routes = defineRoutes([
      defineRoute({
        method: 'GET',
        path: '/error',
        handler: () => {
            throw new Error('Something went wrong')
        }
      }),
      defineRoute({
        method: 'GET',
        path: '/not-found',
        handler: () => 'This should not be reached'
      })
    ])
    
    const server = new Server(routes)

    it('handles internal server errors', async () => {
        const response = await server
            .fetch(new Request('http://localhost/error'))

        expect(response.status).toBe(500)
    })

    it('returns 404 for non-existent routes', async () => {
        const response = await server
            .fetch(new Request('http://localhost/non-existent'))

        expect(response.status).toBe(404)
    })

    it('returns 405 for method not allowed', async () => {
        const response = await server
            .fetch(new Request('http://localhost/not-found', {
                method: 'POST'
            }))

        expect(response.status).toBe(405)
    })
})
```

## Integration Testing

Test the complete application flow:

```typescript
// test/integration.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'

describe('Vafast Integration', () => {
    let server: Server

    beforeAll(() => {
        const routes = defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/health',
            handler: () => ({ status: 'ok' })
          }),
          defineRoute({
            method: 'GET',
            path: '/users/:id',
            handler: ({ params }) => ({
                id: params.id,
                name: 'Test User',
                email: 'test@example.com'
            })
          }),
          defineRoute({
            method: 'POST',
            path: '/users',
            handler: ({ body }) => ({
                id: Date.now(),
                ...body,
                createdAt: new Date().toISOString()
            })
          })
        ])
        
        server = new Server(routes)
    })

    it('performs complete user CRUD flow', async () => {
        // 1. check health
        const healthResponse = await server
            .fetch(new Request('http://localhost/health'))
            .then((res) => res.json())

        expect(healthResponse.status).toBe('ok')

        // 2. create a user
        const createResponse = await server
            .fetch(new Request('http://localhost/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Integration Test User',
                    email: 'integration@example.com'
                })
            }))
            .then((res) => res.json())

        expect(createResponse.name).toBe('Integration Test User')
        expect(createResponse.id).toBeDefined()
        expect(createResponse.createdAt).toBeDefined()

        // 3. fetch the user
        const userId = createResponse.id
        const getUserResponse = await server
            .fetch(new Request(`http://localhost/users/${userId}`))
            .then((res) => res.json())

        expect(getUserResponse.id).toBe(userId)
        expect(getUserResponse.name).toBe('Integration Test User')
    })
})
```

## Test Configuration

Configure the test script in `package.json`:

```json
{
  "scripts": {
    "test": "npm test",
    "test:watch": "npm test --watch",
    "test:coverage": "npm test --coverage"
  }
}
```

## Testing Best Practices

1. **Isolate tests**: each test should run independently, without depending on another test's state
2. **Clean up resources**: clean up anything created during a test
3. **Mock external dependencies**: use mocks to isolate external services
4. **Test edge cases**: cover both the happy path and failure cases
5. **Keep tests simple**: each test should cover a single piece of functionality

## Summary

Vafast's testing story provides:

- ✅ Request/Response testing based on the WinterCG standard
- ✅ Full route testing support
- ✅ Middleware testing
- ✅ Validation testing
- ✅ Error handling testing
- ✅ Integration testing support

### Next Steps

- Read [Routing](/en/routing) to learn how to organize routes
- Learn the [Middleware System](/en/middleware) to extend functionality
- Explore [Validation](/en/essential/validation) for type safety
- See [Best Practices](/en/essential/best-practice) for more development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).
