---
title: OpenTelemetry 中间件 - Vafast
---

# OpenTelemetry 中间件

该中间件为 [Vafast](https://github.com/vafastjs/vafast) 提供了完整的 OpenTelemetry 集成支持，包括分布式追踪、指标收集和日志聚合。

## 安装

安装命令：
```bash
npm install @vafast/opentelemetry
```

## 基本用法

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return 'Hello, Vafast with OpenTelemetry!'
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/health',
    handler: () => {
      return { status: 200, data: 'OK' }
    }
  })
])

// 创建服务器
const server = new Server(routes)

// 应用 OpenTelemetry 中间件
server.useGlobalMiddleware(opentelemetry({
  serviceName: 'example-app',
  instrumentations: []
}))

// 导出 fetch 函数
export default { fetch: server.fetch }
```

## 预加载配置（推荐）

为了获得最佳性能和完整的 OpenTelemetry 功能，建议使用预加载配置：

```typescript
// preload.ts
import * as otel from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import {
    BatchSpanProcessor,
    ConsoleSpanExporter,
    Span
} from '@opentelemetry/sdk-trace-node'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
    resource: new Resource({
        [SEMRESATTRS_SERVICE_NAME]: 'your-service-name'
    }),
    spanProcessors: [
        new BatchSpanProcessor(
            new OTLPTraceExporter({
                // 配置你的 OTLP 导出器
                // url: 'https://your-collector.com/v1/traces',
                // headers: {
                //     Authorization: `Bearer ${process.env.OTEL_TOKEN}`,
                // }
            })
        ),
        new BatchSpanProcessor(new ConsoleSpanExporter())
    ]
})

sdk.start()

console.log('OpenTelemetry SDK 已启动')
```

然后在你的主应用中：

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

// 导入预加载配置
import './preload'

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/users',
    handler: async () => {
      // 这个请求会自动被 OpenTelemetry 追踪
      return { users: ['Alice', 'Bob', 'Charlie'] }
    }
  })
])

const server = new Server(routes)

// 应用 OpenTelemetry 中间件
server.useGlobalMiddleware(opentelemetry({
  serviceName: 'your-service-name'
}))

export default { fetch: server.fetch }
```

## 配置选项

该中间件扩展了 OpenTelemetry NodeSDK 的参数选项。

### VafastOpenTelemetryOptions

```typescript
interface VafastOpenTelemetryOptions {
    /** 服务名称，用于标识追踪和指标 */
    serviceName?: string
    
    /** 自动检测环境中的资源 */
    autoDetectResources?: boolean
    
    /** 自定义上下文管理器 */
    contextManager?: ContextManager
    
    /** 自定义传播器 */
    textMapPropagator?: TextMapPropagator
    
    /** 指标读取器 */
    metricReader?: MetricReader
    
    /** 指标视图配置 */
    views?: View[]
    
    /** 自动检测的仪器 */
    instrumentations?: (Instrumentation | Instrumentation[])[]
    
    /** 资源配置 */
    resource?: IResource
    
    /** 资源探测器 */
    resourceDetectors?: Array<Detector | DetectorSync>
    
    /** 自定义采样器 */
    sampler?: Sampler
    
    /** 跨度处理器 */
    spanProcessors?: SpanProcessor[]
    
    /** 追踪导出器 */
    traceExporter?: SpanExporter
    
    /** 跨度限制 */
    spanLimits?: SpanLimits
}
```

## 使用模式

### 1. 基本追踪

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry, getTracer, startActiveSpan } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/data',
    handler: async () => {
      const tracer = getTracer()
      
      // 创建自定义跨度
            return tracer.startActiveSpan('fetch-data', async (span) => {
                try {
                    // 模拟数据获取
                    const data = await fetchDataFromDatabase()
                    
                    // 设置跨度属性
                    span.setAttributes({
                        'data.source': 'database',
                        'data.count': data.length
                    })
                    
                    return { data }
                } finally {
                    span.end()
                }
            })
        })
    }
]

const server = new Server(routes)

export default {
    fetch: (req: Request) => {
        return telemetryMiddleware(req, () => server.fetch(req))
    }
}

async function fetchDataFromDatabase() {
    // 模拟数据库查询
    return ['item1', 'item2', 'item3']
}
```

### 2. 自定义跨度和属性

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry, getTracer, setAttributes } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/api/users',
    handler: async ({ req }) => {
      const tracer = getTracer()
      
      return tracer.startActiveSpan('create-user', {
        attributes: {
          'http.method': 'POST',
          'http.route': '/api/users'
        }
      }, async (span) => {
        try {
          const body = await req.json()
          
          // 设置用户相关属性
          span.setAttributes({
            'user.email': body.email,
            'user.role': body.role
          })
          
          // 模拟用户创建
          const user = await createUser(body)
          
          // 记录成功事件
          span.addEvent('user.created', {
            'user.id': user.id,
            'user.email': user.email
          })
          
          return { success: true, user }
        } catch (error) {
          // 记录错误
          span.recordException(error as Error)
          throw error
        } finally {
          span.end()
        }
      })
    }
  })
])

const server = new Server(routes)

// 应用 OpenTelemetry 中间件
server.useGlobalMiddleware(opentelemetry({
  serviceName: 'custom-spans-app'
}))

export default { fetch: server.fetch }

async function createUser(userData: any) {
    // 模拟用户创建
    return {
        id: Math.random().toString(36).substr(2, 9),
        ...userData
    }
}
```

### 3. 分布式追踪

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry, getTracer, getCurrentSpan } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/orders/:id',
    handler: async ({ params }) => {
      const tracer = getTracer()
      
      return tracer.startActiveSpan('get-order', async (span) => {
        try {
          const orderId = params.id
          
          // 设置订单相关属性
          span.setAttributes({
            'order.id': orderId,
            'operation.type': 'read'
          })
          
          // 获取订单信息
          const order = await getOrder(orderId)
                    
                    // 获取用户信息（创建子跨度）
                    const user = await tracer.startActiveSpan('get-user', async (userSpan) => {
                        userSpan.setAttributes({
                            'user.id': order.userId
                        })
                        
                        const userData = await getUser(order.userId)
                        userSpan.end()
                        return userData
                    })
                    
                    // 获取产品信息（创建子跨度）
                    const products = await tracer.startActiveSpan('get-products', async (productsSpan) => {
                        productsSpan.setAttributes({
                            'products.count': order.productIds.length
                        })
                        
                        const productsData = await getProducts(order.productIds)
                        productsSpan.end()
                        return productsData
                    })
                    
                    return {
                        order,
                        user,
                        products
                    }
                } finally {
                    span.end()
                }
            })
        })
    }
]

const server = new Server(routes)

export default {
    fetch: (req: Request) => {
        return telemetryMiddleware(req, () => server.fetch(req))
    }
}

async function getOrder(orderId: string) {
    // 模拟获取订单
    return {
        id: orderId,
        userId: 'user123',
        productIds: ['prod1', 'prod2'],
        total: 299.99
    }
}

async function getUser(userId: string) {
    // 模拟获取用户
    return {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
    }
}

async function getProducts(productIds: string[]) {
    // 模拟获取产品
    return productIds.map(id => ({
        id,
        name: `Product ${id}`,
        price: 149.99
    }))
}
```

### 4. 错误追踪和监控

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry, getTracer } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/risky-operation',
    handler: async () => {
      const tracer = getTracer()
      
      return tracer.startActiveSpan('risky-operation', async (span) => {
        try {
          // 模拟有风险的操作
          const result = await performRiskyOperation()
          
          span.setAttributes({
            'operation.success': true,
            'operation.result': result
          })
          
          return { success: true, result }
        } catch (error) {
          // 详细记录错误信息
          span.setAttributes({
            'operation.success': false,
            'error.type': error.constructor.name,
            'error.message': error instanceof Error ? error.message : String(error)
          })
          
          // 记录异常
          span.recordException(error as Error)
          
          // 设置错误状态
          span.setStatus({
            code: 2, // ERROR
            message: error instanceof Error ? error.message : 'Unknown error'
          })
          
          throw error
        } finally {
          span.end()
        }
      })
    }
  })
])

const server = new Server(routes)

// 应用 OpenTelemetry 中间件
server.useGlobalMiddleware(opentelemetry({
  serviceName: 'error-tracking-app'
}))

export default { fetch: server.fetch }

async function performRiskyOperation() {
    // 模拟有风险的操作
    if (Math.random() > 0.5) {
        throw new Error('Operation failed due to random chance')
    }
    
    return 'Operation completed successfully'
}
```

## 完整示例

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry, getTracer, startActiveSpan } from '@vafast/opentelemetry'

// 导入预加载配置
import './preload'

// 模拟数据库操作
class UserService {
    async getUser(id: string) {
        const tracer = getTracer()
        
        return tracer.startActiveSpan('db.get-user', {
            attributes: {
                'db.operation': 'select',
                'db.table': 'users',
                'db.user.id': id
            }
        }, async (span) => {
            try {
                // 模拟数据库查询延迟
                await new Promise(resolve => setTimeout(resolve, 50))
                
                const user = {
                    id,
                    name: `User ${id}`,
                    email: `user${id}@example.com`
                }
                
                span.setAttributes({
                    'db.result.count': 1,
                    'db.user.found': true
                })
                
                return user
            } catch (error) {
                span.recordException(error as Error)
                throw error
            } finally {
                span.end()
            }
        })
    }
    
    async createUser(userData: any) {
        const tracer = getTracer()
        
        return tracer.startActiveSpan('db.create-user', {
            attributes: {
                'db.operation': 'insert',
                'db.table': 'users'
            }
        }, async (span) => {
            try {
                await new Promise(resolve => setTimeout(resolve, 100))
                
                const user = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...userData
                }
                
                span.setAttributes({
                    'db.result.count': 1,
                    'db.user.id': user.id
                })
                
                return user
            } catch (error) {
                span.recordException(error as Error)
                throw error
            } finally {
                span.end()
            }
        })
    }
}

class ProductService {
    async getProducts(ids: string[]) {
        const tracer = getTracer()
        
        return tracer.startActiveSpan('db.get-products', {
            attributes: {
                'db.operation': 'select',
                'db.table': 'products',
                'db.products.count': ids.length
            }
        }, async (span) => {
            try {
                await new Promise(resolve => setTimeout(resolve, 30))
                
                const products = ids.map(id => ({
                    id,
                    name: `Product ${id}`,
                    price: Math.random() * 1000
                }))
                
                span.setAttributes({
                    'db.result.count': products.length
                })
                
                return products
            } catch (error) {
                span.recordException(error as Error)
                throw error
            } finally {
                span.end()
            }
        })
    }
}

// 创建服务实例
const userService = new UserService()
const productService = new ProductService()

// 定义路由
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return {
        message: 'E-commerce API with OpenTelemetry',
        version: '1.0.0',
        endpoints: [
          'GET /api/users/:id - 获取用户信息',
          'POST /api/users - 创建用户',
          'GET /api/orders/:id - 获取订单详情',
          'POST /api/orders - 创建订单'
        ]
      }
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/api/users/:id',
    handler: async ({ params }) => {
            const tracer = getTracer()
            
            return tracer.startActiveSpan('api.get-user', {
                attributes: {
                    'http.method': 'GET',
                    'http.route': '/api/users/:id',
                    'user.id': params.id
                }
            }, async (span) => {
                try {
                    const user = await userService.getUser(params.id)
                    
                    span.setAttributes({
                        'response.status': 200,
                        'response.type': 'success'
                    })
                    
                    return {
                        success: true,
                        data: user
                    }
                } catch (error) {
                    span.setAttributes({
                        'response.status': 500,
                        'response.type': 'error'
                    })
                    
                    span.recordException(error as Error)
                    throw error
                } finally {
                    span.end()
                }
            })
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/api/users',
    handler: async ({ req }) => {
            const tracer = getTracer()
            
            return tracer.startActiveSpan('api.create-user', {
                attributes: {
                    'http.method': 'POST',
                    'http.route': '/api/users'
                }
            }, async (span) => {
                try {
                    const body = await req.json()
                    
                    span.setAttributes({
                        'user.email': body.email,
                        'user.role': body.role || 'user'
                    })
                    
                    const user = await userService.createUser(body)
                    
                    span.setAttributes({
                        'response.status': 201,
                        'response.type': 'success',
                        'user.id': user.id
                    })
                    
                    return {
                        success: true,
                        data: user,
                        message: 'User created successfully'
                    }
                } catch (error) {
                    span.setAttributes({
                        'response.status': 500,
                        'response.type': 'error'
                    })
                    
                    span.recordException(error as Error)
                    throw error
                } finally {
                    span.end()
                }
            })
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/api/orders/:id',
    handler: async ({ params }) => {
            const tracer = getTracer()
            
            return tracer.startActiveSpan('api.get-order', {
                attributes: {
                    'http.method': 'GET',
                    'http.route': '/api/orders/:id',
                    'order.id': params.id
                }
            }, async (span) => {
                try {
                    // 模拟获取订单
                    const order = {
                        id: params.id,
                        userId: 'user123',
                        productIds: ['prod1', 'prod2', 'prod3'],
                        total: 299.99,
                        status: 'completed'
                    }
                    
                    // 并行获取用户和产品信息
                    const [user, products] = await Promise.all([
                        userService.getUser(order.userId),
                        productService.getProducts(order.productIds)
                    ])
                    
                    const result = {
                        order,
                        user,
                        products
                    }
                    
                    span.setAttributes({
                        'response.status': 200,
                        'response.type': 'success',
                        'order.total': order.total,
                        'products.count': products.length
                    })
                    
                    return {
                        success: true,
                        data: result
                    }
                } catch (error) {
                    span.setAttributes({
                        'response.status': 500,
                        'response.type': 'error'
                    })
                    
                    span.recordException(error as Error)
                    throw error
                } finally {
                    span.end()
                }
            })
        })
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/api/orders',
    handler: async ({ req }) => {
      const tracer = getTracer()
      
      return tracer.startActiveSpan('api.create-order', {
        attributes: {
          'http.method': 'POST',
          'http.route': '/api/orders'
        }
      }, async (span) => {
        try {
          const body = await req.json()
          
          span.setAttributes({
            'order.user.id': body.userId,
            'order.products.count': body.productIds?.length || 0
          })
          
          // 验证用户存在
          const user = await userService.getUser(body.userId)
          
          // 获取产品信息
          const products = await productService.getProducts(body.productIds || [])
          
          // 计算总价
          const total = products.reduce((sum, product) => sum + product.price, 0)
          
          const order = {
            id: Math.random().toString(36).substr(2, 9),
            userId: body.userId,
            productIds: body.productIds || [],
            total,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
          
          span.setAttributes({
            'response.status': 201,
            'response.type': 'success',
            'order.id': order.id,
            'order.total': order.total
          })
          
          return {
            success: true,
            data: order,
            message: 'Order created successfully'
          }
        } catch (error) {
          span.setAttributes({
            'response.status': 500,
            'response.type': 'error'
          })
          
          span.recordException(error as Error)
          throw error
        } finally {
          span.end()
        }
      })
    }
  })
])

// 创建服务器
const server = new Server(routes)

// 应用 OpenTelemetry 中间件
server.useGlobalMiddleware(opentelemetry({
  serviceName: 'ecommerce-api',
  instrumentations: []
}))

// 导出 fetch 函数
export default { fetch: server.fetch }

console.log('E-commerce API with OpenTelemetry 服务器启动成功！')
console.log('所有请求都将被自动追踪和监控')
console.log('🔍 查看 Jaeger 或其他 OpenTelemetry 后端以获取追踪数据')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

describe('Vafast OpenTelemetry Plugin', () => {
    it('should create OpenTelemetry middleware', () => {
        const telemetryMiddleware = opentelemetry({
            serviceName: 'test-app',
            instrumentations: []
        })

        expect(telemetryMiddleware).toBeDefined()
        expect(typeof telemetryMiddleware).toBe('function')
    })

    it('should process requests through OpenTelemetry middleware', async () => {
        const app = new Server(defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/',
            handler: () => {
              return 'Hello, OpenTelemetry!'
            }
          })
        ]))

        // 应用中间件
        app.useGlobalMiddleware(opentelemetry({
          serviceName: 'test-app',
          instrumentations: []
        }))

        const res = await app.fetch(new Request('http://localhost/'))
        const data = await res.text()

        expect(data).toBe('Hello, OpenTelemetry!')
        expect(res.status).toBe(200)
    })

    it('should handle errors in OpenTelemetry middleware', async () => {
        const app = new Server(defineRoutes([
          defineRoute({
            method: 'GET',
            path: '/error',
            handler: () => {
              throw new Error('Test error')
            }
          })
        ]))

        // 应用中间件
        app.useGlobalMiddleware(opentelemetry({
          serviceName: 'test-app',
          instrumentations: []
        }))

        // 测试错误处理 - OpenTelemetry 中间件应该能够处理错误
        const result = await app.fetch(new Request('http://localhost/error'))
        // 如果中间件正确处理了错误，我们应该得到一个响应而不是抛出异常
        expect(result).toBeDefined()
    })

    it('should work with custom service name', () => {
        const telemetryMiddleware = opentelemetry({
            serviceName: 'custom-service',
            instrumentations: []
        })

        expect(telemetryMiddleware).toBeDefined()
    })

    it('should work with instrumentations', () => {
        const telemetryMiddleware = opentelemetry({
            serviceName: 'test-app',
            instrumentations: []
        })

        expect(telemetryMiddleware).toBeDefined()
    })

    it('should handle different HTTP methods', async () => {
        const telemetryMiddleware = opentelemetry({
            serviceName: 'test-app',
            instrumentations: []
        })

        const app = new Server(defineRoutes([
          defineRoute({
            method: 'POST',
            path: '/',
            handler: () => {
              return { message: 'POST request' }
            }
          })
        ]))

        // 应用中间件
        app.useGlobalMiddleware(opentelemetry({
          serviceName: 'test-app',
          instrumentations: []
        }))

        const res = await app.fetch(new Request('http://localhost/', {
            method: 'POST'
        }))
        const data = await res.json()

        expect(data.message).toBe('POST request')
        expect(res.status).toBe(200)
    })
})
```

## 特性

- ✅ **自动追踪**: 自动为所有 HTTP 请求创建追踪跨度
- ✅ **分布式追踪**: 支持跨服务调用链追踪
- ✅ **性能监控**: 自动收集请求响应时间、状态码等指标
- ✅ **错误追踪**: 自动捕获和记录异常信息
- ✅ **自定义跨度**: 支持创建自定义业务逻辑跨度
- ✅ **属性设置**: 支持为跨度添加自定义属性
- ✅ **上下文传播**: 支持 W3C Trace Context 和 Baggage 传播
- ✅ **多种导出器**: 支持 OTLP、Jaeger、Zipkin 等导出器
- ✅ **自动检测**: 支持自动检测 Node.js 环境资源
- ✅ **类型安全**: 完整的 TypeScript 类型支持

## 最佳实践

### 1. 使用预加载配置

```typescript
// 在应用启动前初始化 OpenTelemetry SDK
import './preload'

// 然后在你的应用中使用简化的配置
const telemetryMiddleware = opentelemetry({
    serviceName: 'your-service'
})
```

### 2. 合理的跨度命名

```typescript
// 使用有意义的跨度名称
tracer.startActiveSpan('db.query-users', async (span) => {
    // 数据库查询逻辑
})

tracer.startActiveSpan('api.process-order', async (span) => {
    // 订单处理逻辑
})
```

### 3. 设置有用的属性

```typescript
span.setAttributes({
    'user.id': userId,
    'order.total': orderTotal,
    'db.table': 'orders',
    'cache.hit': true
})
```

### 4. 错误处理

```typescript
try {
    // 业务逻辑
} catch (error) {
    span.recordException(error as Error)
    span.setStatus({
        code: 2, // ERROR
        message: error.message
    })
    throw error
}
```

### 5. 性能优化

```typescript
// 避免创建过多的小跨度
// 好的做法：为重要操作创建跨度
tracer.startActiveSpan('process-batch', async (span) => {
    for (const item of items) {
        // 处理单个项目，不需要为每个项目创建跨度
        await processItem(item)
    }
})

// 不好的做法：为每个小操作创建跨度
for (const item of items) {
    await tracer.startActiveSpan('process-item', async (span) => {
        await processItem(item)
        span.end()
    })
}
```

## 注意事项

1. **性能影响**: OpenTelemetry 会为每个请求创建追踪跨度，在生产环境中注意采样配置
2. **存储成本**: 追踪数据可能产生大量存储成本，合理配置数据保留策略
3. **敏感信息**: 避免在追踪属性中包含敏感信息（如密码、令牌等）
4. **采样策略**: 在高流量环境中使用适当的采样策略以控制数据量
5. **导出器配置**: 确保导出器配置正确，避免数据丢失

## 相关链接

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [Jaeger 追踪系统](https://www.jaegertracing.io/)
- [Zipkin 追踪系统](https://zipkin.io/)
- [Vafast 官方文档](https://vafast.dev)