---
title: Swagger 中间件 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Swagger 中间件 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 的中间件，提供 Swagger/OpenAPI 文档生成和 UI 展示功能，支持 Scalar 和 Swagger UI 两种界面。开始时请使用 "bun add @vafast/swagger" 安装中间件。

  - - meta
    - name: 'og:description'
      content: Vafast 的中间件，提供 Swagger/OpenAPI 文档生成和 UI 展示功能，支持 Scalar 和 Swagger UI 两种界面。开始时请使用 "bun add @vafast/swagger" 安装中间件。
---

# Swagger 中间件

该中间件为 [Vafast](https://github.com/vafastjs/vafast) 提供了完整的 Swagger/OpenAPI 文档生成和 UI 展示功能，支持 Scalar 和 Swagger UI 两种界面，让 API 文档更加专业和易用。

## 安装

安装命令：
```bash
bun add @vafast/swagger
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

// 创建 Swagger 中间件
const swaggerMiddleware = swagger({
    provider: 'scalar',
    documentation: {
        info: {
            title: 'My API',
            version: '1.0.0'
        }
    }
})

// 定义路由
const routes = [
    {
        method: 'GET',
        path: '/api/',
        handler: createRouteHandler(() => {
            return { message: 'Hello API' }
        })
    }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用 Swagger 中间件
export default {
    fetch: (req: Request) => {
        return swaggerMiddleware(req, () => server.fetch(req))
    }
}
```

## 配置选项

### VafastSwaggerConfig

```typescript
interface VafastSwaggerConfig<Path extends string = '/swagger'> {
  /** 文档提供者，默认：'scalar' */
  provider?: 'scalar' | 'swagger-ui'
  
  /** Scalar 版本，默认：'latest' */
  scalarVersion?: string
  
  /** Scalar CDN 地址，默认：官方 CDN */
  scalarCDN?: string
  
  /** Scalar 配置选项 */
  scalarConfig?: Record<string, any>
  
  /** OpenAPI 文档配置 */
  documentation?: OpenAPIDocumentation
  
  /** Swagger UI 版本，默认：'4.18.2' */
  version?: string
  
  /** 是否排除静态文件，默认：true */
  excludeStaticFile?: boolean
  
  /** 文档路径，默认：'/swagger' */
  path?: Path
  
  /** OpenAPI 规范路径，默认：'${path}/json' */
  specPath?: string
  
  /** 排除的路径或方法 */
  exclude?: string | RegExp | (string | RegExp)[]
  
  /** Swagger UI 选项 */
  swaggerOptions?: Record<string, any>
  
  /** 主题配置 */
  theme?: string | { light: string; dark: string }
  
  /** 是否启用自动暗色模式，默认：true */
  autoDarkMode?: boolean
  
  /** 排除的 HTTP 方法，默认：['OPTIONS'] */
  excludeMethods?: string[]
  
  /** 排除的标签 */
  excludeTags?: string[]
}
```

### OpenAPIDocumentation

```typescript
interface OpenAPIDocumentation {
  /** API 基本信息 */
  info?: OpenAPIInfo
  
  /** API 标签 */
  tags?: OpenAPITag[]
  
  /** 组件定义 */
  components?: OpenAPIComponents
  
  /** API 路径定义 */
  paths?: Record<string, any>
}

interface OpenAPIInfo {
  title?: string
  description?: string
  version?: string
}

interface OpenAPITag {
  name: string
  description?: string
}

interface OpenAPISchema {
  type: string
  properties?: Record<string, any>
  required?: string[]
}

interface OpenAPISecurityScheme {
  type: string
  scheme?: string
  bearerFormat?: string
  description?: string
}

interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema>
  securitySchemes?: Record<string, OpenAPISecurityScheme>
}
```

## 使用模式

### 1. 基本 Scalar 文档

```typescript
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

const swaggerMiddleware = swagger({
    provider: 'scalar',
    documentation: {
        info: {
            title: 'Vafast API',
            description: 'A modern TypeScript web framework API',
            version: '1.0.0'
        },
        tags: [
            {
                name: 'Users',
                description: 'User management endpoints'
            },
            {
                name: 'Auth',
                description: 'Authentication endpoints'
            }
        ]
    }
})

const routes = [
    {
        method: 'GET',
        path: '/api/users',
        handler: createRouteHandler(() => {
            return { users: [] }
        })
    }
]

const server = new Server(routes)

export default {
    fetch: (req: Request) => {
        return swaggerMiddleware(req, () => server.fetch(req))
    }
}
```

### 2. Swagger UI 文档

```typescript
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

const swaggerMiddleware = swagger({
    provider: 'swagger-ui',
    version: '4.18.2',
    documentation: {
        info: {
            title: 'Vafast API',
            description: 'API documentation with Swagger UI',
            version: '1.0.0'
        }
    },
    swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        filter: true
    },
    theme: 'https://unpkg.com/swagger-ui-dist@4.18.2/swagger-ui.css',
    autoDarkMode: true
})

const routes = [
    {
        method: 'GET',
        path: '/api/health',
        handler: createRouteHandler(() => {
            return { status: 'OK' }
        })
    }
]

const server = new Server(routes)

export default {
    fetch: (req: Request) => {
        return swaggerMiddleware(req, () => server.fetch(req))
    }
}
```

### 3. 自定义路径和配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

const swaggerMiddleware = swagger({
    provider: 'scalar',
    path: '/docs',                    // 自定义文档路径
    specPath: '/docs/openapi.json',   // 自定义规范路径
    scalarVersion: '1.0.0',           // 指定 Scalar 版本
    scalarCDN: 'https://cdn.example.com/scalar', // 自定义 CDN
    scalarConfig: {
        theme: 'light',
        search: true,
        navigation: true
    },
    documentation: {
        info: {
            title: 'Custom API',
            version: '2.0.0'
        }
    }
})

const routes = [
    {
        method: 'GET',
        path: '/api/data',
        handler: createRouteHandler(() => {
            return { data: 'example' }
        })
    }
]

const server = new Server(routes)

export default {
    fetch: (req: Request) => {
        return swaggerMiddleware(req, () => server.fetch(req))
    }
}
```

### 4. 完整的 API 文档

```typescript
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

const swaggerMiddleware = swagger({
    provider: 'scalar',
    documentation: {
        info: {
            title: 'Complete API',
            description: 'A comprehensive API with full documentation',
            version: '1.0.0'
        },
        tags: [
            {
                name: 'Users',
                description: 'User management operations'
            },
            {
                name: 'Posts',
                description: 'Blog post operations'
            },
            {
                name: 'Auth',
                description: 'Authentication and authorization'
            }
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string', minLength: 3 },
                        email: { type: 'string', format: 'email' },
                        createdAt: { type: 'string', format: 'date-time' }
                    },
                    required: ['username', 'email']
                },
                Post: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        title: { type: 'string', minLength: 1 },
                        content: { type: 'string', minLength: 10 },
                        authorId: { type: 'string', format: 'uuid' },
                        published: { type: 'boolean', default: false }
                    },
                    required: ['title', 'content', 'authorId']
                }
            },
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>'
                },
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'Enter your API key'
                }
            }
        },
        paths: {
            '/api/users': {
                get: {
                    summary: 'Get all users',
                    tags: ['Users'],
                    responses: {
                        '200': {
                            description: 'List of users',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    summary: 'Create a new user',
                    tags: ['Users'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'User created successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
})

const routes = [
    {
        method: 'GET',
        path: '/api/users',
        handler: createRouteHandler(() => {
            return { users: [] }
        })
    },
    {
        method: 'POST',
        path: '/api/users',
        handler: createRouteHandler(async (req: Request) => {
            const userData = await req.json()
            return { ...userData, id: 'generated-id' }
        })
    }
]

const server = new Server(routes)

export default {
    fetch: (req: Request) => {
        return swaggerMiddleware(req, () => server.fetch(req))
    }
}
```

### 5. 中间件集成

```typescript
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

// 创建 Swagger 中间件
const swaggerMiddleware = swagger({
    provider: 'scalar',
    path: '/api-docs',
    documentation: {
        info: {
            title: 'Middleware API',
            version: '1.0.0'
        }
    }
})

// 定义路由
const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return { message: 'API is running' }
        })
    },
    {
        method: 'GET',
        path: '/api/status',
        handler: createRouteHandler(() => {
            return { status: 'healthy', timestamp: new Date().toISOString() }
        })
    }
]

const server = new Server(routes)

// 创建中间件包装器
const createMiddlewareWrapper = (middleware: any, handler: any) => {
    return async (req: Request) => {
        return middleware(req, () => handler(req))
    }
}

// 导出带中间件的 fetch 函数
export default {
    fetch: createMiddlewareWrapper(swaggerMiddleware, server.fetch.bind(server))
}
```

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

// 创建 Swagger 中间件
const swaggerMiddleware = swagger({
    provider: 'scalar',
    scalarVersion: 'latest',
    scalarConfig: {
        theme: 'light',
        search: true,
        navigation: true,
        sidebar: true
    },
    documentation: {
        info: {
            title: 'Vafast Swagger Example',
            description: 'A complete example of Vafast with Swagger documentation',
            version: '0.8.1'
        },
        tags: [
            {
                name: 'Test',
                description: 'Test endpoints for demonstration'
            },
            {
                name: 'Users',
                description: 'User management endpoints'
            },
            {
                name: 'Files',
                description: 'File upload and management'
            }
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        username: { type: 'string', minLength: 3 },
                        email: { type: 'string', format: 'email' },
                        age: { type: 'number', minimum: 0 }
                    },
                    required: ['username', 'email']
                },
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            },
            securitySchemes: {
                JwtAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT Bearer token **_only_**'
                },
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'Enter your API key'
                }
            }
        },
        paths: {
            '/api/test': {
                get: {
                    summary: 'Test endpoint',
                    description: 'A simple test endpoint',
                    tags: ['Test'],
                    responses: {
                        '200': {
                            description: 'Successful response',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/users': {
                get: {
                    summary: 'Get all users',
                    tags: ['Users'],
                    security: [{ JwtAuth: [] }],
                    responses: {
                        '200': {
                            description: 'List of users',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized'
                        }
                    }
                },
                post: {
                    summary: 'Create a new user',
                    tags: ['Users'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'User created successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        },
                        '400': {
                            description: 'Bad request'
                        }
                    }
                }
            }
        }
    },
    swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        filter: true,
        showExtensions: true
    }
})

// 定义 API 路由
const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return {
                message: 'Vafast Swagger Example API',
                version: '1.0.0',
                documentation: '/swagger',
                openapi: '/swagger/json'
            }
        })
    },
    {
        method: 'GET',
        path: '/api/test',
        handler: createRouteHandler(() => {
            return {
                success: true,
                message: 'Test endpoint working',
                data: { timestamp: new Date().toISOString() }
            }
        })
    },
    {
        method: 'GET',
        path: '/api/users',
        handler: createRouteHandler(() => {
            return [
                { username: 'john_doe', email: 'john@example.com', age: 30 },
                { username: 'jane_smith', email: 'jane@example.com', age: 25 }
            ]
        })
    },
    {
        method: 'POST',
        path: '/api/users',
        handler: createRouteHandler(async (req: Request) => {
            const userData = await req.json()
            return {
                ...userData,
                id: `user_${Date.now()}`,
                createdAt: new Date().toISOString()
            }
        })
    },
    {
        method: 'GET',
        path: '/api/health',
        handler: createRouteHandler(() => {
            return {
                status: 'healthy',
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        })
    }
]

// 创建服务器
const server = new Server(routes)

// 导出带 Swagger 中间件的 fetch 函数
export default {
    fetch: (req: Request) => {
        return swaggerMiddleware(req, () => server.fetch(req))
    }
}

console.log('🚀 Vafast Swagger Example Server 启动成功！')
console.log('📚 API 文档：/swagger')
console.log('🔗 OpenAPI 规范：/swagger/json')
console.log('🌐 健康检查：/api/health')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, createRouteHandler } from 'vafast'
import { swagger } from '@vafast/swagger'

describe('Vafast Swagger Plugin', () => {
    it('should create swagger middleware', () => {
        const swaggerMiddleware = swagger({
            provider: 'scalar',
            documentation: {
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                }
            }
        })

        expect(swaggerMiddleware).toBeDefined()
        expect(typeof swaggerMiddleware).toBe('function')
    })

    it('should serve Scalar documentation page', async () => {
        const swaggerMiddleware = swagger({
            provider: 'scalar',
            path: '/docs'
        })

        const app = new Server([
            {
                method: 'GET',
                path: '/',
                handler: createRouteHandler(() => {
                    return 'Hello, API!'
                })
            }
        ])

        // 应用中间件
        const wrappedFetch = (req: Request) => {
            return swaggerMiddleware(req, () => app.fetch(req))
        }

        // 测试访问 Scalar 文档页面
        const res = await wrappedFetch(new Request('http://localhost/docs'))
        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toContain('text/html')

        const html = await res.text()
        expect(html).toContain('scalar')
    })

    it('should serve OpenAPI specification', async () => {
        const swaggerMiddleware = swagger({
            provider: 'scalar',
            path: '/docs',
            specPath: '/docs/json'
        })

        const app = new Server([
            {
                method: 'GET',
                path: '/',
                handler: createRouteHandler(() => {
                    return 'Hello, API!'
                })
            }
        ])

        // 应用中间件
        const wrappedFetch = (req: Request) => {
            return swaggerMiddleware(req, () => app.fetch(req))
        }

        // 测试访问 OpenAPI 规范
        const res = await wrappedFetch(
            new Request('http://localhost/docs/json')
        )
        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toContain('application/json')

        const spec = await res.json()
        expect(spec.openapi).toBe('3.0.3')
        expect(spec.info.title).toBe('Vafast API')
    })

    it('should handle custom documentation info', async () => {
        const swaggerMiddleware = swagger({
            provider: 'scalar',
            documentation: {
                info: {
                    title: 'Custom API',
                    description: 'Custom API description',
                    version: '2.0.0'
                },
                tags: [
                    {
                        name: 'Users',
                        description: 'User management endpoints'
                    }
                ]
            }
        })

        const app = new Server([])
        const wrappedFetch = (req: Request) => {
            return swaggerMiddleware(req, () => app.fetch(req))
        }

        const res = await wrappedFetch(
            new Request('http://localhost/swagger/json')
        )
        const spec = await res.json()

        expect(spec.info.title).toBe('Custom API')
        expect(spec.info.description).toBe('Custom API description')
        expect(spec.info.version).toBe('2.0.0')
        expect(spec.tags).toHaveLength(1)
        expect(spec.tags[0].name).toBe('Users')
    })

    it('should handle Swagger UI provider', async () => {
        const swaggerMiddleware = swagger({
            provider: 'swagger-ui',
            version: '4.18.2'
        })

        const app = new Server([])
        const wrappedFetch = (req: Request) => {
            return swaggerMiddleware(req, () => app.fetch(req))
        }

        const res = await wrappedFetch(new Request('http://localhost/swagger'))
        const html = await res.text()

        expect(res.status).toBe(200)
        expect(html).toContain('swagger-ui')
        expect(html).toContain('4.18.2')
    })

    it('should pass through non-swagger requests', async () => {
        const swaggerMiddleware = swagger({
            provider: 'scalar'
        })

        const app = new Server([
            {
                method: 'GET',
                path: '/api/data',
                handler: createRouteHandler(() => {
                    return { message: 'Data endpoint' }
                })
            }
        ])

        const wrappedFetch = (req: Request) => {
            return swaggerMiddleware(req, () => app.fetch(req))
        }

        const res = await wrappedFetch(
            new Request('http://localhost/api/data')
        )
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.message).toBe('Data endpoint')
    })

    it('should handle custom path configuration', async () => {
        const swaggerMiddleware = swagger({
            provider: 'scalar',
            path: '/custom-docs',
            specPath: '/custom-docs/spec'
        })

        const app = new Server([])
        const wrappedFetch = (req: Request) => {
            return swaggerMiddleware(req, () => app.fetch(req))
        }

        // 测试自定义文档路径
        const docsRes = await wrappedFetch(
            new Request('http://localhost/custom-docs')
        )
        expect(docsRes.status).toBe(200)

        // 测试自定义规范路径
        const specRes = await wrappedFetch(
            new Request('http://localhost/custom-docs/spec')
        )
        expect(specRes.status).toBe(200)
        expect(specRes.headers.get('content-type')).toContain('application/json')
    })
})
```

## 特性

- ✅ **双界面支持**: 支持 Scalar 和 Swagger UI 两种文档界面
- ✅ **自动生成**: 自动生成 OpenAPI 3.0.3 规范
- ✅ **灵活配置**: 丰富的配置选项和自定义支持
- ✅ **中间件集成**: 无缝集成到 Vafast 应用
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **主题定制**: 支持自定义主题和暗色模式
- ✅ **CDN 配置**: 支持自定义 CDN 地址
- ✅ **路径配置**: 灵活的文档和规范路径配置

## 最佳实践

### 1. 选择合适的提供者

```typescript
// 现代、美观的界面，推荐用于生产环境
const scalarMiddleware = swagger({
    provider: 'scalar',
    scalarVersion: 'latest'
})

// 传统、功能丰富的界面，适合开发调试
const swaggerUIMiddleware = swagger({
    provider: 'swagger-ui',
    version: '4.18.2'
})
```

### 2. 结构化文档组织

```typescript
const swaggerMiddleware = swagger({
    provider: 'scalar',
    documentation: {
        info: {
            title: 'API Name',
            description: 'Clear API description',
            version: '1.0.0'
        },
        tags: [
            { name: 'Users', description: 'User management' },
            { name: 'Auth', description: 'Authentication' }
        ],
        components: {
            schemas: {
                // 定义可重用的数据模型
            },
            securitySchemes: {
                // 定义安全方案
            }
        }
    }
})
```

### 3. 安全配置

```typescript
const swaggerMiddleware = swagger({
    provider: 'scalar',
    documentation: {
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    }
})
```

### 4. 生产环境配置

```typescript
const swaggerMiddleware = swagger({
    provider: 'scalar',
    path: '/api/docs',           // 使用子路径
    excludeStaticFile: true,      // 排除静态文件
    scalarCDN: 'https://cdn.example.com/scalar', // 使用自己的 CDN
    documentation: {
        info: {
            title: 'Production API',
            version: process.env.API_VERSION || '1.0.0'
        }
    }
})
```

## 注意事项

1. **路径冲突**: 确保 Swagger 路径不与 API 路由冲突
2. **安全考虑**: 生产环境建议使用子路径，避免暴露在根路径
3. **CDN 配置**: 生产环境建议使用自己的 CDN 地址
4. **版本管理**: 保持 Swagger UI 和 Scalar 版本更新
5. **文档维护**: 及时更新 API 文档以保持同步
6. **性能影响**: 中间件会拦截所有请求，注意性能影响
7. **类型定义**: 充分利用 TypeScript 类型来生成准确的文档

## 版本信息

- **当前版本**: 0.0.1
- **Vafast 兼容性**: >= 0.1.12
- **OpenAPI 版本**: 3.0.3
- **支持界面**: Scalar (最新版本) + Swagger UI (4.18.2)

## 相关链接

- [OpenAPI 规范](https://swagger.io/specification/)
- [Scalar 官方文档](https://docs.scalar.com/)
- [Swagger UI 官方文档](https://swagger.io/tools/swagger-ui/)
- [Vafast 官方文档](https://vafast.dev)
- [GitHub 仓库](https://github.com/vafastjs/vafast-swagger)
- [问题反馈](https://github.com/vafastjs/vafast-swagger/issues)