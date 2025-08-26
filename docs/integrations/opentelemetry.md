---
title: OpenTelemetry 集成 - Vafast
---

# OpenTelemetry 集成

Vafast 提供了完整的 OpenTelemetry 集成支持，包括分布式追踪、指标收集和日志聚合。

要开始使用 OpenTelemetry，请安装 `@vafast/opentelemetry` 并将中间件应用于任何实例。

## 安装

```bash
bun add @vafast/opentelemetry
```

## 基本用法

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users',
    handler: createRouteHandler(() => {
      return { users: [] }
    })
  }
])

const app = createRouteHandler(routes)
  .use(opentelemetry({
    serviceName: 'my-vafast-app',
    serviceVersion: '1.0.0'
  }))
```

## 配置选项

OpenTelemetry 中间件支持丰富的配置选项：

```typescript
import { opentelemetry } from '@vafast/opentelemetry'

app.use(opentelemetry({
  // 服务信息
  serviceName: 'my-vafast-app',
  serviceVersion: '1.0.0',
  serviceNamespace: 'production',
  
  // 追踪配置
  tracing: {
    enabled: true,
    sampler: {
      type: 'always_on'
    },
    exporter: {
      type: 'otlp',
      endpoint: 'http://localhost:4317'
    }
  },
  
  // 指标配置
  metrics: {
    enabled: true,
    exporter: {
      type: 'prometheus',
      port: 9464
    }
  },
  
  // 日志配置
  logging: {
    enabled: true,
    level: 'info',
    exporter: {
      type: 'otlp',
      endpoint: 'http://localhost:4317'
    }
  }
}))
```

## 分布式追踪

OpenTelemetry 中间件自动为所有请求创建追踪：

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(async ({ params }) => {
      // 这个请求会自动创建追踪
      const user = await fetchUser(params.id)
      return user
    }),
    params: Type.Object({
      id: Type.String()
    })
  }
])

const app = createRouteHandler(routes)
  .use(opentelemetry({
    serviceName: 'user-service',
    tracing: {
      enabled: true,
      exporter: {
        type: 'otlp',
        endpoint: 'http://jaeger:4317'
      }
    }
  }))
```

## 自定义追踪

您可以在处理程序中添加自定义追踪：

```typescript
import { defineRoutes, createRouteHandler } from 'vafast'
import { trace } from '@opentelemetry/api'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(async ({ body }) => {
      const tracer = trace.getTracer('user-service')
      
      return await tracer.startActiveSpan('create-user', async (span) => {
        try {
          span.setAttribute('user.email', body.email)
          
          const user = await createUser(body)
          
          span.setStatus({ code: trace.SpanStatusCode.OK })
          return user
        } catch (error) {
          span.setStatus({ 
            code: trace.SpanStatusCode.ERROR, 
            message: error.message 
          })
          throw error
        } finally {
          span.end()
        }
      })
    }),
    body: Type.Object({
      name: Type.String(),
      email: Type.String({ format: 'email' })
    })
  }
])
```

## 指标收集

中间件自动收集关键指标：

```typescript
import { opentelemetry } from '@vafast/opentelemetry'

app.use(opentelemetry({
  metrics: {
    enabled: true,
    exporter: {
      type: 'prometheus',
      port: 9464,
      path: '/metrics'
    }
  }
}))
```

自动收集的指标包括：

- **HTTP 请求计数**：按方法、路径、状态码分组
- **请求持续时间**：响应时间分布
- **活跃连接数**：当前活跃的 HTTP 连接
- **错误率**：按错误类型分组的错误计数

## 日志聚合

OpenTelemetry 中间件提供结构化日志：

```typescript
import { opentelemetry } from '@vafast/opentelemetry'

app.use(opentelemetry({
  logging: {
    enabled: true,
    level: 'info',
    exporter: {
      type: 'otlp',
      endpoint: 'http://localhost:4317'
    }
  }
}))
```

## 环境配置

根据环境配置 OpenTelemetry：

```typescript
import { opentelemetry } from '@vafast/opentelemetry'

const isDevelopment = process.env.NODE_ENV === 'development'

app.use(opentelemetry({
  serviceName: 'my-vafast-app',
  serviceVersion: process.env.APP_VERSION || '1.0.0',
  
  tracing: {
    enabled: !isDevelopment,
    exporter: {
      type: 'otlp',
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317'
    }
  },
  
  metrics: {
    enabled: true,
    exporter: {
      type: 'prometheus',
      port: parseInt(process.env.METRICS_PORT || '9464')
    }
  },
  
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    exporter: {
      type: isDevelopment ? 'console' : 'otlp',
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    }
  }
}))
```

## 与监控系统集成

### Jaeger 追踪

```typescript
app.use(opentelemetry({
  tracing: {
    exporter: {
      type: 'otlp',
      endpoint: 'http://jaeger:4317'
    }
  }
}))
```

### Prometheus 指标

```typescript
app.use(opentelemetry({
  metrics: {
    exporter: {
      type: 'prometheus',
      port: 9464,
      path: '/metrics'
    }
  }
}))
```

### Grafana Loki 日志

```typescript
app.use(opentelemetry({
  logging: {
    exporter: {
      type: 'otlp',
      endpoint: 'http://loki:4317'
    }
  }
}))
```

## 性能优化

OpenTelemetry 中间件经过优化，对性能影响最小：

```typescript
app.use(opentelemetry({
  tracing: {
    sampler: {
      type: 'traceidratio',
      ratio: 0.1 // 只追踪 10% 的请求
    }
  },
  
  metrics: {
    collectionInterval: 5000 // 5秒收集一次指标
  }
}))
```

## 最佳实践

1. **服务命名**：使用有意义的服务名称，便于识别
2. **采样策略**：在生产环境中使用适当的采样策略
3. **错误处理**：确保错误被正确记录和追踪
4. **性能监控**：监控中间件本身的性能影响
5. **安全考虑**：在生产环境中保护监控端点

## 相关链接

- [OpenTelemetry 中间件](/middleware/opentelemetry) - 完整的配置选项
- [性能监控](/patterns/trace) - 了解性能追踪
- [中间件系统](/middleware) - 探索其他可用的中间件
- [部署指南](/patterns/deploy) - 生产环境部署建议
