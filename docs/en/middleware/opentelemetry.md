---
title: OpenTelemetry Middleware - Vafast
description: 'Vafast OpenTelemetry middleware: automatic tracing for every request, custom spans, exporters such as OTLP and Jaeger, and context propagation across services.'
---

# OpenTelemetry

`@vafast/opentelemetry` provides **OpenTelemetry tracing** for Vafast: it creates a root span for each HTTP request and exports helpers for nesting spans in your business code.

This package focuses on **traces / spans**. Although NodeSDK also accepts metrics / logs options, that **doesn't mean** this package ships ready-made metrics or logging middleware; you configure exporters and backends yourself for a full observability pipeline.

## Key Concepts (for New Users)

### Traces and Spans

| Term | In plain terms |
|------|------|
| **Trace** | The "story" of one complete request path: from the HTTP entry to the database, downstream HTTP calls and so on, tied together by one `traceId` |
| **Span** | A chapter in the story: an operation with a start and end time, such as the whole HTTP request, one SQL query or one cache read |
| **Attributes** | Key/value information attached to a span, such as `http.request.method`, `url.path` or custom business fields |
| **Propagation** | Passing the trace across processes: extract from inbound headers, inject into outbound ones, so microservices show up in the same trace |

This middleware creates a `SpanKind.SERVER` root span for each request, eventually renamed to `` `${method} ${pathname}` ``, and records attributes such as method, path, status and some request/response headers.

### Preloading the SDK vs. Starting It in the Middleware

| Approach | What it does | Best for |
|------|--------|------|
| **Preload (recommended)** | `new NodeSDK(...).start()` first in the process entry, then mount `opentelemetry()` | Production: OTLP export, sampling, auto-instrumentation |
| **Middleware only** | If the global tracer is still a `ProxyTracer`, `opentelemetry()` calls `new NodeSDK(...).start()` in place with the options you pass | Quick local trials |

When the SDK is preloaded and the tracer is no longer a `ProxyTracer`, the middleware **usually won't** start another SDK; it mainly handles the HTTP root span and attributes.

### What Are `instrumentations`?

The list of **auto-instrumentation plugins** passed to NodeSDK. For example, `@opentelemetry/auto-instrumentations-node` automatically creates spans for `http`, `fs`, some database clients and more, so you don't have to instrument each one by hand.

```typescript
instrumentations: [getNodeAutoInstrumentations()]
```

When you pass `[]` or omit it, no auto plugins are installed; you still get the HTTP root span from this middleware and can write business spans by hand with `startActiveSpan`.

## Installation

```bash
npm install @vafast/opentelemetry
```

Install exporters / auto-instrumentation as needed (example):

```bash
npm install @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-proto \
  @opentelemetry/sdk-trace-node \
  @opentelemetry/auto-instrumentations-node
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello, Vafast with OpenTelemetry!',
  }),
])

const server = new Server(routes)
server.use(
  opentelemetry({
    serviceName: 'example-app',
    instrumentations: [],
  }),
)

serve({ fetch: server.fetch, port: 3000 })
```

Without preloading, the call above starts NodeSDK (`serviceName` + `instrumentations` + other pass-through options) once it detects a `ProxyTracer`.

## Usage

### Recommended: Preload the SDK, Then Mount the Middleware

```typescript
// preload.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const sdk = new NodeSDK({
  serviceName: 'your-service',
  instrumentations: [getNodeAutoInstrumentations()],
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter()),
  ],
})

sdk.start()
```

```typescript
import './preload'
import { Server, defineRoutes } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(defineRoutes([/* ... */]))
server.use(opentelemetry({ serviceName: 'your-service' }))
```

### Nested Spans in Business Code

```typescript
import {
  startActiveSpan,
  setAttributes,
  getCurrentSpan,
} from '@vafast/opentelemetry'

handler: async () => {
  return startActiveSpan('db.query-users', async (span) => {
    const rows = await db.query('select ...')
    span.setAttributes({ 'db.row_count': rows.length })
    setAttributes({ 'cache.hit': false }) // written to the current active span
    return { rows }
  })
}
```

`getTracer().startActiveSpan` / `startActiveSpan` / `record` (alias of `startActiveSpan`) automatically call `end()` when the Promise settles or the function returns synchronously; on errors they set `ERROR` and call `recordException`.

### Context Propagation

The middleware uses `propagation.extract` to pull the upstream trace context from inbound headers, so traces connect across services. For outbound HTTP/gRPC, inject it yourself or rely on auto-instrumentations.

## API

### `opentelemetry(options?)`

```typescript
opentelemetry(options?: VafastOpenTelemetryOptions): Middleware
```

`VafastOpenTelemetryOptions` = **NodeSDK constructor options** + fields added by this package. Below are the options beginners run into most (for the rest, [@opentelemetry/sdk-node](https://www.npmjs.com/package/@opentelemetry/sdk-node) is authoritative):

| Parameter | Description |
|------|------|
| `serviceName` | Service name; defaults to `'@vafast/vafast'` in this package. Identifies the tracer / SDK |
| `instrumentations` | Array of auto-instrumentation plugins; see above |
| `traceExporter` | A simple exporter (e.g. OTLP). If you're choosing between it and `spanProcessors`, check the SDK docs for the recommended approach first |
| `spanProcessors` | List of span processors, commonly `BatchSpanProcessor(exporter)` for batched export |
| `sampler` | Sampler controlling the export ratio; essential at high traffic to keep costs in check |
| `resource` | Resource attributes (service name, environment, version, etc.). Some projects use Resource + semantic conventions instead of / in addition to `serviceName` |
| `resourceDetectors` | List of detectors that discover resources automatically |
| `contextManager` | Extra field in this package: if there's no global ContextManager yet, it calls `enable()` and `setGlobalContextManager` |
| `textMapPropagator` | Propagation format (e.g. W3C TraceContext); affects cross-service headers |
| `spanLimits` | Limits such as the number of attributes/events per span |
| `metricReader` / `views` / `logRecordProcessors` etc. | Supported by NodeSDK, but **this middleware's main path is still tracing** |

Only when `trace.getTracer(serviceName)` is still a `ProxyTracer` will it:

```typescript
new NodeSDK({ ...options, serviceName, instrumentations }).start()
```

### Other Exports

| Export | Description |
|------|------|
| `getTracer()` | Wrapped tracer (`startActiveSpan` auto-ends / records errors) |
| `startActiveSpan` / `record` | Create an active span in the current context |
| `getCurrentSpan()` | Read the current span (if any) |
| `setAttributes(attrs)` | Set attributes on the current span; returns whether it succeeded |
| `contextKeySpan` | OTel's internal span context key (a `Symbol`) |
| `Tracer` / `StartSpan` / `StartActiveSpan` / `ActiveSpanArgs` / `VafastOpenTelemetryOptions` | Types |

## Best Practices

1. Initialize the SDK via **preload** in production; let the middleware handle only the HTTP root span
2. Use stable business semantics for span names (`db.get-user`, `api.create-order`); avoid putting high-cardinality dynamic values like user IDs in names
3. Configure a `sampler` at high traffic to control export volume and cost
4. Don't put passwords, tokens, full request bodies or other sensitive data in attributes
5. Use `startActiveSpan` for sub-operations; don't open a span per loop iteration
6. When relying on propagation across services, standardize on one propagator and pair it with auto-instrumentations

## Notes

- On the success path the response is `clone`d to estimate body size, which adds overhead for large responses
- `User-Agent` is not written to `http.request.header.*`
- Without preloading, NodeSDK starts on the first call; mind the initialization order if other libraries also set up global OTel
- `getCurrentSpan` relies on an internal context key and may not find the span when mixing libraries
- This package does not replace a complete metrics / logs solution

## Related Links

- [Middleware Overview](/en/middleware/overview)
- [OpenTelemetry docs](https://opentelemetry.io/docs/)
- [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/)
- [NodeSDK](https://www.npmjs.com/package/@opentelemetry/sdk-node)
