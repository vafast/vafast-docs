---
title: OpenTelemetry Integration - Vafast
description: 'Vafast OpenTelemetry integration: use @vafast/opentelemetry for distributed tracing, custom spans, metrics collection and log aggregation to improve observability of TypeScript services.'
---

# OpenTelemetry Integration

Vafast provides full OpenTelemetry integration, including distributed tracing, metrics collection and log aggregation.

To get started with OpenTelemetry, install `@vafast/opentelemetry` and apply the middleware to any instance.

## Installation

```bash
npm install @vafast/opentelemetry
```

## Basic Usage

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => {
      return { users: [] }
    }
  })
])

const server = new Server(routes)
server.use(opentelemetry({
  serviceName: 'my-vafast-app',
  serviceVersion: '1.0.0'
}))
```

## Configuration Options

The OpenTelemetry middleware supports a rich set of options:

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)

server.use(opentelemetry({
  // service info
  serviceName: 'my-vafast-app',
  serviceVersion: '1.0.0',
  serviceNamespace: 'production',
  
  // tracing config
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
  
  // metrics config
  metrics: {
    enabled: true,
    exporter: {
      type: 'prometheus',
      port: 9464
    }
  },
  
  // logging config
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

## Distributed Tracing

The OpenTelemetry middleware automatically creates traces for all requests:

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: {
      params: Type.Object({
        id: Type.String()
      })
    },
    handler: async ({ params }) => {
      // this request automatically creates a trace
      const user = await fetchUser(params.id)
      return user
    }
  })
])

const server = new Server(routes)
server.use(opentelemetry({
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

## Custom Tracing

You can add custom spans in your handlers:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import { trace } from '@opentelemetry/api'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({
        name: Type.String(),
        email: Type.String({ format: 'email' })
      })
    },
    handler: async ({ body }) => {
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
    }
  })
])
```

## Metrics Collection

The middleware automatically collects key metrics:

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)

server.use(opentelemetry({
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

Automatically collected metrics include:

- **HTTP request count**: grouped by method, path and status code
- **Request duration**: response time distribution
- **Active connections**: currently active HTTP connections
- **Error rate**: error counts grouped by error type

## Log Aggregation

The OpenTelemetry middleware provides structured logging:

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)

server.use(opentelemetry({
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

## Environment Configuration

Configure OpenTelemetry per environment:

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)
const isDevelopment = process.env.NODE_ENV === 'development'

server.use(opentelemetry({
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

## Integrating with Monitoring Systems

### Jaeger Tracing

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)

server.use(opentelemetry({
  tracing: {
    exporter: {
      type: 'otlp',
      endpoint: 'http://jaeger:4317'
    }
  }
}))
```

### Prometheus Metrics

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)

server.use(opentelemetry({
  metrics: {
    exporter: {
      type: 'prometheus',
      port: 9464,
      path: '/metrics'
    }
  }
}))
```

### Grafana Loki Logs

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)

server.use(opentelemetry({
  logging: {
    exporter: {
      type: 'otlp',
      endpoint: 'http://loki:4317'
    }
  }
}))
```

## Performance Optimization

The OpenTelemetry middleware is optimized for minimal performance impact:

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)

server.use(opentelemetry({
  tracing: {
    sampler: {
      type: 'traceidratio',
      ratio: 0.1 // trace only 10% of requests
    }
  },
  
  metrics: {
    collectionInterval: 5000 // collect metrics every 5 seconds
  }
}))
```

## Best Practices

1. **Service naming**: use meaningful service names that are easy to identify
2. **Sampling strategy**: use an appropriate sampling strategy in production
3. **Error handling**: make sure errors are properly recorded and traced
4. **Performance monitoring**: monitor the performance impact of the middleware itself
5. **Security**: protect monitoring endpoints in production

## Related Links

- [OpenTelemetry middleware](/en/middleware/opentelemetry) - full configuration options
- [Performance monitoring](/en/patterns/trace) - learn about performance tracing
- [Middleware system](/en/middleware) - explore other available middleware
- [Deployment guide](/en/patterns/deploy) - production deployment advice
