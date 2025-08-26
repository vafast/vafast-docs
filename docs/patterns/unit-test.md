---
title: 测试 - Vafast
head:
    - - meta
      - property: 'og:title'
        content: 测试 - Vafast

    - - meta
      - name: 'description'
        content: 您可以使用 `bun:test` 创建与 Vafast 的单元测试。Vafast 服务器实例具有一个 `fetch` 方法，它接受 `Request` 并返回 `Response`，与创建 HTTP 请求相同。

    - - meta
      - name: 'og:description'
        content: 您可以使用 `bun:test` 创建与 Vafast 的单元测试。Vafast 服务器实例具有一个 `fetch` 方法，它接受 `Request` 并返回 `Response`，与创建 HTTP 请求相同。
---

# 单元测试

作为 WinterCG 的合规实现，我们可以使用 Request/Response 类来测试 Vafast 服务器。

Vafast 提供了 **Server.fetch** 方法，该方法接受 Web 标准 [Request](https://developer.mozilla.org/zh-CN/docs/Web/API/Request) 并返回 [Response](https://developer.mozilla.org/zh-CN/docs/Web/API/Response)，模拟 HTTP 请求。

Bun 包含一个内置的 [测试运行器](https://bun.sh/docs/cli/test)，通过 `bun:test` 模块提供类似 Jest 的 API，便于创建单元测试。

在项目根目录下创建 **test/index.test.ts**，内容如下：

```typescript
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

describe('Vafast', () => {
    it('returns a response', async () => {
        const routes = defineRoutes([
          {
            method: 'GET',
            path: '/',
            handler: createRouteHandler(() => 'hi')
          }
        ])
        
        const server = new Server(routes)

        const response = await server
            .fetch(new Request('http://localhost/'))
            .then((res) => res.text())

        expect(response).toBe('hi')
    })
})
```

然后我们可以通过运行 **bun test** 来进行测试。

```bash
bun test
```

对 Vafast 服务器的新请求必须是一个完全有效的 URL，**不能**是 URL 的一部分。

请求必须提供如下格式的 URL：

| URL                   | 有效 |
| --------------------- | ----- |
| http://localhost/user | ✅    |
| /user                 | ❌    |

我们还可以使用其他测试库，如 Jest 或其他测试库来创建 Vafast 单元测试。

## 路由测试

我们可以测试不同的路由和 HTTP 方法：

```typescript
// test/routes.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

describe('Vafast Routes', () => {
    const routes = defineRoutes([
      {
        method: 'GET',
        path: '/users/:id',
        handler: createRouteHandler(({ params }) => `User ${params.id}`)
      },
      {
        method: 'POST',
        path: '/users',
        handler: createRouteHandler(({ body }) => ({ id: 1, ...body }))
      }
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

## 中间件测试

测试中间件的功能：

```typescript
// test/middleware.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

describe('Vafast Middleware', () => {
    const loggingMiddleware = async (req: Request, next: () => Promise<Response>) => {
        console.log(`${req.method} ${req.url}`)
        const response = await next()
        console.log(`Response: ${response.status}`)
        return response
    }

    const routes = defineRoutes([
      {
        method: 'GET',
        path: '/test',
        handler: createRouteHandler(() => 'Hello from middleware')
      }
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

## 验证测试

测试 TypeBox 验证功能：

```typescript
// test/validation.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

describe('Vafast Validation', () => {
    const userSchema = Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.String({ format: 'email' }),
        age: Type.Number({ minimum: 0 })
    })

    const routes = defineRoutes([
      {
        method: 'POST',
        path: '/users',
        handler: createRouteHandler(({ body }) => ({ success: true, user: body })),
        body: userSchema
      }
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
                    name: '', // 违反 minLength: 1
                    email: 'invalid-email', // 违反 format: 'email'
                    age: -5 // 违反 minimum: 0
                })
            }))

        expect(response.status).toBe(400)
    })
})
```

## 错误处理测试

测试错误处理逻辑：

```typescript
// test/error-handling.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

describe('Vafast Error Handling', () => {
    const routes = defineRoutes([
      {
        method: 'GET',
        path: '/error',
        handler: createRouteHandler(() => {
            throw new Error('Something went wrong')
        })
      },
      {
        method: 'GET',
        path: '/not-found',
        handler: createRouteHandler(() => 'This should not be reached')
      }
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

## 集成测试

测试完整的应用流程：

```typescript
// test/integration.test.ts
import { describe, expect, it } from 'bun:test'
import { Server, defineRoutes, createRouteHandler } from 'vafast'

describe('Vafast Integration', () => {
    let server: Server

    beforeAll(() => {
        const routes = defineRoutes([
          {
            method: 'GET',
            path: '/health',
            handler: createRouteHandler(() => ({ status: 'ok' }))
          },
          {
            method: 'GET',
            path: '/users/:id',
            handler: createRouteHandler(({ params }) => ({
                id: params.id,
                name: 'Test User',
                email: 'test@example.com'
            }))
          },
          {
            method: 'POST',
            path: '/users',
            handler: createRouteHandler(({ body }) => ({
                id: Date.now(),
                ...body,
                createdAt: new Date().toISOString()
            }))
          }
        ])
        
        server = new Server(routes)
    })

    it('performs complete user CRUD flow', async () => {
        // 1. 检查健康状态
        const healthResponse = await server
            .fetch(new Request('http://localhost/health'))
            .then((res) => res.json())

        expect(healthResponse.status).toBe('ok')

        // 2. 创建用户
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

        // 3. 获取用户
        const userId = createResponse.id
        const getUserResponse = await server
            .fetch(new Request(`http://localhost/users/${userId}`))
            .then((res) => res.json())

        expect(getUserResponse.id).toBe(userId)
        expect(getUserResponse.name).toBe('Integration Test User')
    })
})
```

## 测试配置

在 `package.json` 中配置测试脚本：

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

## 测试最佳实践

1. **隔离测试**：每个测试应该独立运行，不依赖其他测试的状态
2. **清理资源**：在测试后清理任何创建的资源
3. **模拟外部依赖**：使用 mock 来隔离外部服务
4. **测试边界情况**：测试正常流程和异常情况
5. **保持测试简单**：每个测试只测试一个功能点

## 总结

Vafast 的测试系统提供了：

- ✅ 基于 WinterCG 标准的 Request/Response 测试
- ✅ 完整的路由测试支持
- ✅ 中间件测试能力
- ✅ 验证系统测试
- ✅ 错误处理测试
- ✅ 集成测试支持

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强功能
- 探索 [验证系统](/essential/validation) 了解类型安全
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
