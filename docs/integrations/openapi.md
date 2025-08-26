---
title: OpenAPI - Vafast
---

# OpenAPI

Vafast 提供了一流的支持，并默认遵循 OpenAPI 模式。

Vafast 可以通过提供 Swagger 中间件自动生成 API 文档页面。

要生成 Swagger 页面，请安装中间件：
```bash
bun add @vafast/swagger
```

并将中间件注册到服务器：
```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

const routes = defineRoutes([
  // 你的路由定义
])

const app = createRouteHandler(routes)
  .use(swagger())
```

默认情况下，Vafast 使用 OpenAPI V3 模式和 [Scalar UI](http://scalar.com)。

有关 Swagger 中间件配置，请参见 [Swagger 中间件页面](/middleware/swagger)。

## 路由定义

我们通过提供模式类型添加路由信息。

然而，有时候仅定义类型并不能清楚表达路由的功能。您可以使用 `detail` 字段明确地定义路由的目的。

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'
import { swagger } from '@vafast/swagger'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/sign-in',
    handler: createRouteHandler(({ body }) => body),
    body: Type.Object(
      {
        username: Type.String(),
        password: Type.String({
          minLength: 8,
          description: '用户密码（至少 8 个字符）'
        })
      },
      {
        description: '期望的用户名和密码'
      }
    ),
    detail: {
      summary: '用户登录',
      tags: ['身份验证']
    }
  }
])

const app = createRouteHandler(routes)
  .use(swagger())
```

详细字段遵循 OpenAPI V3 定义，并默认具有自动补全和类型安全。

详细信息随后传递给 Swagger，以便将描述放入 Swagger 路由中。

### detail

`detail` 扩展了 [OpenAPI 操作对象](https://swagger.io/specification#operation-object)

详细字段是一个对象，可以用来描述有关该路由的 API 文档信息。

该字段可能包含以下内容：

### tags

该操作的标签数组。标签可用于根据资源或任何其他标识符逻辑分组操作。

### summary

该操作执行的简短摘要。

### description

该操作行为的详细解释。

### externalDocs

该操作的额外外部文档。

### operationId

用于唯一标识操作的字符串。该 ID 必须在 API 中所有描述的操作中唯一。operationId 值对大小写敏感。

### deprecated

声明该操作已被弃用。消费者应避免使用已声明的操作。默认值为 `false`。

### security

声明该操作的安全要求。

## 类型安全

Vafast 的 OpenAPI 集成提供了完整的类型安全：

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(({ params, query }) => {
      // params.id 和 query.page 都是类型安全的
      return { userId: params.id, page: query.page }
    }),
    params: Type.Object({
      id: Type.String({ description: '用户ID' })
    }),
    query: Type.Object({
      page: Type.Optional(Type.Number({ minimum: 1, description: '页码' }))
    }),
    detail: {
      summary: '获取用户信息',
      tags: ['用户管理'],
      description: '根据用户ID获取用户详细信息'
    }
  }
])
```

## 响应模式

您还可以定义响应模式：

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => {
      return { id: '123', ...body, createdAt: new Date() }
    }),
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      email: Type.String({ format: 'email' })
    }),
    response: Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String(),
      createdAt: Type.String({ format: 'date-time' })
    }),
    detail: {
      summary: '创建用户',
      tags: ['用户管理'],
      responses: {
        201: {
          description: '用户创建成功',
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
          description: '请求参数错误',
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
  }
])
```

## 中间件集成

Vafast 的 Swagger 中间件可以与其他中间件无缝集成：

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'

const routes = defineRoutes([
  // 你的路由定义
])

const app = createRouteHandler(routes)
  .use(cors())
  .use(helmet())
  .use(swagger({
    documentation: {
      info: {
        title: 'Vafast API',
        version: '1.0.0',
        description: 'Vafast 框架 API 文档'
      },
      tags: [
        { name: '用户管理', description: '用户相关操作' },
        { name: '身份验证', description: '登录注册等操作' }
      ]
    }
  }))
```

## 自定义配置

Swagger 中间件支持丰富的配置选项：

```typescript
import { swagger } from '@vafast/swagger'

app.use(swagger({
  documentation: {
    info: {
      title: '我的 API',
      version: '1.0.0',
      description: '这是一个使用 Vafast 框架构建的 API'
    },
    servers: [
      { url: 'http://localhost:3000', description: '开发环境' },
      { url: 'https://api.example.com', description: '生产环境' }
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

## 最佳实践

1. **使用描述性标签**：为相关路由使用一致的标签
2. **提供详细摘要**：每个路由都应该有清晰的 summary
3. **定义响应模式**：明确指定成功和错误的响应格式
4. **使用类型验证**：利用 TypeBox 的类型系统确保数据完整性
5. **版本控制**：在 API 文档中明确版本信息

## 相关链接

- [Swagger 中间件](/middleware/swagger) - 完整的 Swagger 配置选项
- [TypeBox 集成](/patterns/type) - 了解类型验证系统
- [路由定义](/essential/route) - 学习如何定义路由
- [中间件系统](/middleware) - 探索其他可用的中间件
