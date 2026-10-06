---
title: 'Server-Sent Events (SSE) - Vafast'
description: 'Server-Sent Events in Vafast: declare streaming endpoints with sse: true, write async generator handlers, use the sse() helper and consume streams from the client.'
---

# Server-Sent Events (SSE)

Vafast has built-in SSE support for streaming responses, such as AI chat, real-time progress updates and push notifications.

## How It Integrates with the Framework

Once you declare `sse: true`, there's no need to write a `ReadableStream` by hand. When flattening routes, `defineRoute` automatically:

1. Uses `wrapGeneratorToSSEHandler` to turn your `async function*` into an SSE response
2. Uses `wrapSSEHandler` to run the same schema validation and middleware context (`userInfo`, etc.) as regular routes

```typescript
// sse: true + async function*
defineRoute({
  sse: true,
  handler: async function* (ctx) {
    yield { type: 'start' }
    yield { type: 'done' }
  },
})
```

Like regular routes, the handler gets the full context: `params` / `query` / `body` / `headers`, plus any fields injected by middleware via `next({ userInfo })`.

## Quick Start

Declare an SSE endpoint explicitly with `sse: true` and write the handler with `async function*` syntax. `yield` any data and the framework wraps it in SSE format:

```typescript
import { defineRoute, defineRoutes, Type, sse } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/progress',
    sse: true,
    handler: async function* () {
      // yield data directly; the framework wraps it in the SSE data field
      yield { status: 'started' }
      
      for (let i = 0; i <= 100; i += 10) {
        yield { progress: i }
        await new Promise(r => setTimeout(r, 100))
      }
      
      // use the sse() helper when you need a custom event name
      yield sse({ event: 'complete' }, { message: 'Done!' })
    },
  }),
])
```

## Two Usage Modes

### Simple Mode (Recommended)

`yield` any data and the framework serializes it into the SSE `data` field:

```typescript
// yield an object
yield { type: 'text_delta', content: 'Hello' }
// output: data: {"type":"text_delta","content":"Hello"}

// yield a string
yield 'Hello World'
// output: data: Hello World

// yield a number
yield 42
// output: data: 42
```

::: tip Why simple mode?
- **Less code** — no need to wrap every event
- **Intuitive** — `yield data` sends the data directly
- **Type-friendly** — integrates seamlessly with types such as the AI SDK's `{ type, data }` ChatEvent
:::

::: warning Don't mix in the old format
`yield { event: 'done', data: {...} }` does **not** become an SSE `event:` line; the whole object is sent as the `data` field. For a custom event name, use `sse({ event: 'done' }, payload)`.
:::

### Advanced Mode

When you need to set SSE `event`, `id` or `retry` metadata, use the `sse()` helper:

```typescript
import { sse } from 'vafast'

// custom event name
yield sse({ event: 'status' }, { online: true })
// output: event: status
//       data: {"online":true}

// with an ID (supports reconnection)
yield sse({ id: '1001' }, { value: 1 })
// output: id: 1001
//       data: {"value":1}

// custom retry interval
yield sse({ retry: 5000 }, 'reconnect')
// output: retry: 5000
//       data: reconnect

// full configuration
yield sse({ event: 'update', id: '42', retry: 3000 }, { count: 1 })
// output: id: 42
//       event: update
//       retry: 3000
//       data: {"count":1}
```

## Basic Usage

### GET + Query Parameters

For simple subscription scenarios:

```typescript
defineRoute({
  method: 'GET',
  path: '/tasks/:id/stream',
  sse: true,
  schema: {
    params: Type.Object({ id: Type.String() }),
  },
  handler: async function* ({ params }) {
    yield { taskId: params.id, status: 'streaming' }
    // ... business logic
  },
})
```

### POST + Body (AI Scenarios)

For scenarios that need to send complex data (such as AI chat):

```typescript
defineRoute({
  method: 'POST',
  path: '/chat/stream',
  sse: true,
  schema: {
    body: Type.Object({
      messages: Type.Array(Type.Object({
        role: Type.String(),
        content: Type.String(),
      })),
      model: Type.Optional(Type.String()),
    }),
  },
  handler: async function* ({ body }) {
    const { messages, model = 'gpt-4' } = body
    
    // simple mode: yield AI events directly
    yield { type: 'start', model }
    
    for await (const chunk of aiStream(messages)) {
      yield { type: 'text_delta', content: chunk.text }
    }
    
    yield { type: 'done', usage: { tokens: 100 } }
  },
})
```

## Combining with Route Groups

Define the SSE handler as a constant first, then attach it with `defineRoutes` (same as regular routes):

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const progressHandler = defineRoute({
  method: 'GET',
  path: '/:id/progress',
  name: 'Subscribe to task progress',
  sse: true,
  schema: {
    params: Type.Object({ id: Type.String() }),
  },
  handler: async function* ({ params }) {
    const task = await getTask(params.id)
    if (!task) {
      yield { error: 'Record not found' }
      return
    }

    yield { status: task.status, progress: task.progress }

    while (task.status === 'running') {
      await sleep(2000)
      const updated = await getTask(params.id)
      if (!updated) return
      yield { status: updated.status, progress: updated.progress }
      if (updated.status === 'success' || updated.status === 'failed') return
    }
  },
})

export const taskRoutes = defineRoutes([
  defineRoute({
    path: '/api/tasks',
    children: [
      progressHandler,
      // other REST handlers...
    ],
  }),
])
```

If you need a logged-in user, use `defineMiddleware` as in the tutorial, or wrap routes with [@vafast/auth-middleware](/en/middleware/auth-middleware) in production (just replace `defineRoute` above with the corresponding `defineAuthRoute`).

For AI streaming chat, `yield` event objects, or forward a business generator directly:

```typescript
const streamHandler = defineRoute({
  method: 'POST',
  path: '/stream',
  sse: true,
  schema: { body: Type.Object({ message: Type.String() }) },
  handler: async function* ({ body }) {
    for await (const event of streamAgentRun(body.message)) {
      yield event // { type: 'text_delta', data: { ... } }
    }
  },
})
```

## Error Handling

### Errors Inside the Generator

If the generator throws, an `error` event is sent automatically:

```typescript
defineRoute({
  method: 'GET',
  path: '/stream',
  sse: true,
  handler: async function* () {
    yield { status: 'processing' }
    throw new Error('Something went wrong')
    // the client receives: event: error
    //              data: {"error":"Something went wrong"}
  },
})
```

### Schema Validation Errors

If schema validation fails, a **422** error is returned (as JSON):

```typescript
defineRoute({
  method: 'GET',
  path: '/stream',
  sse: true,
  schema: { query: Type.Object({ required: Type.String() }) },
  handler: async function* () { /* ... */ },
})

// request /stream (missing a required param)
// HTTP 422
// { "code": 422, "message": "Request validation failed", "details": [...] }
```

## Real-World Use Cases

### 1. Video/File Processing Progress

```typescript
defineRoute({
  method: 'GET',
  path: '/tasks/:taskId/progress',
  sse: true,
  schema: {
    params: Type.Object({ taskId: Type.String() }),
  },
  handler: async function* ({ params }) {
    const { taskId } = params
    
    while (true) {
      const task = await getTask(taskId)
      
      yield { 
        status: task.status,
        progress: task.progress,
      }
      
      if (task.status === 'completed' || task.status === 'failed') {
        return
      }
      
      await new Promise(r => setTimeout(r, 2000))
    }
  },
})
```

### 2. AI Chat Streaming

```typescript
defineRoute({
  method: 'POST',
  path: '/chat/stream',
  sse: true,
  schema: {
    body: Type.Object({
      messages: Type.Array(Type.Object({
        role: Type.Union([Type.Literal('user'), Type.Literal('assistant')]),
        content: Type.String(),
      })),
    }),
  },
  handler: async function* ({ body }) {
    const { messages } = body
    
    // use simple mode and yield ChatEvent objects directly
    yield { type: 'start', timestamp: Date.now() }
    
    for await (const chunk of aiStream(messages)) {
      yield { type: 'text_delta', content: chunk.text }
    }
    
    yield { 
      type: 'done', 
      usage: { promptTokens: 100, completionTokens: 50 },
    }
  },
})
```

### 3. Real-Time Notifications

```typescript
import { sse } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/notifications/stream',
  sse: true,
  schema: {
    query: Type.Object({ userId: Type.String() }),
  },
  handler: async function* ({ query }) {
    const { userId } = query
    
    for await (const notification of subscribeNotifications(userId)) {
      // use sse() to set the event name and ID
      yield sse(
        { event: notification.type, id: notification.id },
        notification.payload
      )
    }
  },
})
```

## Response Headers

SSE endpoints set the following response headers automatically:

| Header | Value | Description |
|--------|-------|------|
| `Content-Type` | `text/event-stream` | SSE MIME type |
| `Cache-Control` | `no-cache` | Disable caching |
| `Connection` | `keep-alive` | Keep the connection open |
| `X-Accel-Buffering` | `no` | Disable Nginx buffering |

## Client Usage

### @vafast/api-client (Recommended)

The type-safe client consumes streaming endpoints via a chained `.sse()` call, with no manual parsing:

```typescript
import { createApiClient } from './api.generated'

const api = createApiClient(client)

// POST SSE — AI chat
api.agent.stream.post({ message: 'Hello' }).sse({
  onMessage: (data) => {
    // data is the JSON yielded by the server (e.g. { type, data })
    if (data.type === 'text_delta') process.stdout.write(data.data?.content ?? '')
  },
  onError: (error) => console.error(error),
})

// GET SSE — progress subscription
api.videoGeneration.progress.get({ id: taskId }).sse({
  onMessage: (data) => console.log(data.progress),
})
```

> 📖 See [API Client Overview](/en/api-client/overview#sse-streaming) for details

### Native Browser EventSource (GET Requests)

```javascript
const eventSource = new EventSource('/api/progress/123')

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Progress:', data.progress)
}

eventSource.addEventListener('complete', (event) => {
  console.log('Done!')
  eventSource.close()
})

eventSource.onerror = (error) => {
  console.error('Error:', error)
}
```

::: warning Note
`EventSource` does **not support custom request headers** (such as Authorization) or **POST requests**. If you need auth or a request body, use `fetch + ReadableStream`.
:::

### fetch + ReadableStream (Supports POST and Auth)

```javascript
async function subscribeSSE(url, body, token) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const text = decoder.decode(value)
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        console.log('Received:', data)
      }
    }
  }
}
```

## Best Practices

::: tip Recommendations
1. **Yield data directly** — simple mode covers 90% of cases with less code
2. **Use `sse()` when you need event/id/retry** — advanced mode gives full control
3. **Send heartbeats periodically** — prevents intermediate proxies from dropping the connection
4. **Use event IDs** — lets clients resume from where they left off after reconnecting
5. **Set a sensible retry interval** — avoids clients reconnecting too often
6. **Handle errors gracefully** — the framework sends error events automatically
7. **Clean up resources** — clear timers, database connections, etc. when the generator finishes
:::
