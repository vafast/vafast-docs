---
title: API Reference - Vafast
description: 'Vafast API reference: Server, serve() options, defineRoute, defineRoutes, defineMiddleware, request parsing, response helpers, err() errors and the monitoring module.'
---

# API Reference

This document is the complete API reference for the Vafast framework. All type definitions and interfaces are written in TypeScript to ensure type safety.

## Core Classes

### Server

`Server` is Vafast's core class for creating an HTTP server.

```typescript
import { Server } from 'vafast'

const server = new Server(routes)
export default { fetch: server.fetch }
```

#### Constructor

```typescript
new Server(routes?: readonly ProcessedRoute[])
```

**Parameters:**
- `routes`: the route array returned by `defineRoutes()`; can be omitted and registered dynamically later via `addRoute()` / `addRoutes()`

#### Methods

##### `fetch(request: Request): Promise<Response>`

Handles an HTTP request and returns a response. Export it to runtimes such as Bun and Cloudflare Workers, or start a Node.js server with `serve()`.

```typescript
const server = new Server(routes)
const response = await server.fetch(new Request('http://localhost:3000/api/users'))
```

##### `use(middleware: Middleware): void`

Registers global middleware that applies to all routes (including 404/405 responses).

```typescript
const server = new Server(routes)

server.use(cors())
server.use(requestLogger())
```

##### `addRoute(route: ProcessedRoute): void`

Dynamically adds a single route.

##### `addRoutes(routes: readonly ProcessedRoute[]): void`

Dynamically adds routes in bulk and updates the global `RouteRegistry` automatically.

##### `getRoutes(): Array<{ method: Method; path: string }>`

Returns the list of methods and paths of registered routes.

##### `getRoutesWithMeta(): ProcessedRoute[]`

Returns full route metadata (including `schema`, `name`, `description`, etc.) for OpenAPI generation, webhook registration and similar use cases.

### ComponentServer

`ComponentServer` creates a server that supports component routing.

```typescript
import { ComponentServer } from 'vafast'

const server = new ComponentServer(routes)
export default { fetch: server.fetch }
```

#### Constructor

```typescript
new ComponentServer(routes: (ComponentRoute | NestedComponentRoute)[])
```

**Parameters:**
- `routes`: an array of component route configs; nesting is supported

#### Methods

##### `use(middleware: Middleware): void`

Registers global middleware; behaves the same as `Server.use()`.

## Type Definitions

### ProcessedRoute (Route)

The route object produced by flattening in `defineRoutes()`, which is also the route type used internally by `Server` (`Route` is an alias).

```typescript
interface ProcessedRoute {
  method: Method
  path: string
  handler: (req: Request) => Promise<Response>
  middleware?: Middleware[]
  schema?: RouteSchema
  sse?: boolean
  name?: string
  description?: string
  docs?: {
    tags?: string[]
    security?: unknown[]
    responses?: Record<string, unknown>
  }
  parent?: { path: string; name?: string; description?: string }
  [key: string]: unknown // allows arbitrary extensions (webhook, permission, etc.)
}
```

**Properties:**
- `method`: HTTP method
- `path`: the full flattened path
- `handler`: the handler wrapped by the framework
- `middleware`: the middleware array merged with the parents'
- `schema`: TypeBox validation config (`body` / `query` / `params` / `headers` / `cookies` / `response`)
- `sse`: whether this is an SSE streaming endpoint
- `name` / `description`: route metadata
- `docs`: OpenAPI documentation config
- `parent`: parent info for nested routes
- `[key]`: plugin extension fields (e.g. `webhook`, `permission`)

### RouteSchema

Route validation config, based on TypeBox:

```typescript
interface RouteSchema {
  body?: TSchema
  query?: TSchema
  params?: TSchema
  headers?: TSchema
  cookies?: TSchema
  response?: TSchema  // used only for type sync; not validated at runtime
}
```

### ComponentRoute

Component route config interface.

```typescript
interface ComponentRoute {
  path: string
  component: () => Promise<any>
  middleware?: Middleware[]
  children?: (ComponentRoute | NestedComponentRoute)[]
}
```

**Properties:**
- `path`: route path
- `component`: component import function
- `middleware`: middleware array
- `children`: child route configs

### NestedRoute

Nested routes are defined via the `children` field of `defineRoute` and flattened automatically by `defineRoutes()`:

```typescript
defineRoute({
  path: '/api',
  middleware: [authMiddleware],
  children: [
    defineRoute({
      method: 'GET',
      path: '/users',
      handler: () => ({ users: [] })
    })
  ]
})
```

The flattened path is `/api/users`, and middleware is merged automatically.

## Route Functions

### defineRoutes()

Creates a route array, preserving literal types automatically for end-to-end type inference.

```typescript
function defineRoutes<const T extends readonly Route[]>(routes: T): T
```

**Parameters:**
- `routes`: an array of route configs

**Example:**

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import type { InferEden } from 'vafast-api-client'

// define and handle routes
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    schema: { query: Type.Object({ page: Type.Number() }) },
    handler: async ({ query }) => ({ users: [], page: query.page })
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: Type.Object({ name: Type.String() }) },
    handler: async ({ body }) => ({ id: '1', name: body.name })
  })
])

// ✅ Type inference just works, no as const needed!
type Api = InferEden<typeof routes>
```

::: tip
`defineRoutes()` uses a `const T` generic to preserve literal types automatically, so you can infer types directly from its return value.
:::

### Middleware

Middleware function type.

```typescript
type Middleware = (
  req: Request,
  next: (ctx?: unknown) => Promise<Response>
) => Response | Promise<Response>
```

**Parameters:**
- `req`: the HTTP request object
- `next`: calls the next middleware; with `defineMiddleware` you can inject context downstream via `next({ ...ctx })`

**Execution order (onion model):**

```
global middleware → errorHandler → route middleware → handler
```

`errorHandler` is injected automatically by the framework and catches `VafastError`s and unhandled exceptions further down the chain.

### RouteHandler

Route handler type. A handler is just a function; the `createHandler` wrapper is no longer needed.

```typescript
// base type
type RouteHandler = Handler | ((req: Request) => unknown)

// defineRoute is recommended
import { defineRoute, Type } from 'vafast'

// without a schema
const route = defineRoute({
  method: 'GET',
  path: '/hello',
  handler: ({ req, params, query }) => {
    return { message: 'Hello' }
  }
})

// with schema validation
const route = defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: Type.Object({ name: Type.String() }) },
  handler: ({ body }) => ({ success: true, name: body.name })
})
```

**Returns:** any value (converted to a Response automatically)

### HTTPMethod

Supported HTTP method type.

```typescript
type HTTPMethod = 
  | 'GET' 
  | 'POST' 
  | 'PUT' 
  | 'DELETE' 
  | 'PATCH' 
  | 'OPTIONS' 
  | 'HEAD'
```

### RouteDocs

API documentation config interface.

```typescript
interface RouteDocs {
  description?: string
  tags?: string[]
  security?: any[]
  responses?: Record<string, any>
}
```

**Properties:**
- `description`: route description
- `tags`: tag array
- `security`: security config
- `responses`: response config

## Server Configuration

### serve()

Starts an HTTP server, with graceful shutdown and request timeout options.

```typescript
import { Server, serve } from 'vafast'

const server = new Server(routes)

serve({
  fetch: server.fetch,
  port: 3000,
  hostname: '0.0.0.0',
  gracefulShutdown: true,
  timeout: { requestTimeout: 30000 }
}, () => {
  console.log('Server running on http://localhost:3000')
})
```

### ServeOptions

Options for the `serve()` function.

```typescript
interface ServeOptions {
  /** fetch handler */
  fetch: FetchHandler
  /** port, default 3000 */
  port?: number
  /** hostname, default 0.0.0.0 */
  hostname?: string
  /** error handler */
  onError?: (error: Error) => Response | Promise<Response>
  /** graceful shutdown options */
  gracefulShutdown?: boolean | GracefulShutdownOptions
  /** request timeout options */
  timeout?: RequestTimeoutOptions
  /** request body size limit (bytes), default 1MB; 0 means unlimited */
  bodyLimit?: number
  /** trust proxy, to get the real IP behind a reverse proxy */
  trustProxy?: boolean | string | string[]
}
```

**Properties:**
- `fetch`: request handler (usually `server.fetch`)
- `port`: server port, default 3000
- `hostname`: server host, default `0.0.0.0`
- `onError`: global error handler
- `gracefulShutdown`: graceful shutdown options
- `timeout`: request timeout options
- `bodyLimit`: request body size limit (bytes), default 1MB
- `trustProxy`: trust proxy option (default `false`)

### GracefulShutdownOptions

Graceful shutdown options for shutting the service down smoothly in environments like K8s.

```typescript
interface GracefulShutdownOptions {
  /** shutdown timeout (ms), default 30000 */
  timeout?: number
  /** callback before shutdown */
  onShutdown?: () => void | Promise<void>
  /** callback after shutdown completes */
  onShutdownComplete?: () => void
  /** signals to listen for, default ['SIGINT', 'SIGTERM'] */
  signals?: NodeJS.Signals[]
}
```

**Example:**

```typescript
serve({
  fetch: server.fetch,
  port: 3000,
  gracefulShutdown: {
    timeout: 30000,
    onShutdown: () => console.log('Shutdown signal received, waiting for requests to finish...'),
    onShutdownComplete: () => console.log('Server closed')
  }
})
```

### RequestTimeoutOptions

Request timeout options to prevent DoS attacks and resource leaks.

Defaults match Fastify and Node.js:
- `requestTimeout`: 0 (unlimited)
- `headersTimeout`: uses the Node.js default of 60000ms
- `keepAliveTimeout`: uses the Node.js default of 5000ms

```typescript
interface RequestTimeoutOptions {
  /**
   * Maximum processing time for a single request (ms)
   * - Default: 0 (unlimited)
   * - Recommended: without a reverse proxy, set 30000-120000 to prevent DoS
   */
  requestTimeout?: number
  /**
   * Timeout for receiving the complete request headers (ms)
   * - Uses the Node.js default (60000ms) if not set
   */
  headersTimeout?: number
  /**
   * Idle timeout for Keep-Alive connections (ms)
   * - Uses the Node.js default (5000ms) if not set
   */
  keepAliveTimeout?: number
  /**
   * JSON response returned on timeout
   * - Default: { code: 504, message: "Request timeout" }
   */
  timeoutResponse?: { code: number; message: string }
}
```

**Example:**

```typescript
// basic config: only set the request timeout
serve({
  fetch: server.fetch,
  port: 3000,
  timeout: {
    requestTimeout: 30000  // 30-second timeout
  }
})

// full config
serve({
  fetch: server.fetch,
  port: 3000,
  timeout: {
    requestTimeout: 30000,
    headersTimeout: 60000,
    keepAliveTimeout: 5000,
    timeoutResponse: {
      code: 504,
      message: 'Request timed out, please try again later'
    }
  }
})
```

::: tip When should you set requestTimeout?
- **Behind a reverse proxy (Nginx/K8s Ingress)**: usually unnecessary; the proxy handles timeouts
- **No reverse proxy**: set 30-120 seconds to prevent slow DoS attacks
:::

### bodyLimit

Request body size limit to prevent large-request DoS attacks.

```typescript
serve({
  fetch: server.fetch,
  port: 3000,
  bodyLimit: 1048576,  // 1MB (default)
})
```

**Configuration:**

| Value | Description |
|------|------|
| `undefined` | Use the default of 1MB |
| `0` | No body size limit |
| `n` | Limit to n bytes |

**Response when the limit is exceeded:**

```json
{
  "code": 413,
  "message": "Payload Too Large",
  "limit": 1048576
}
```

**Common sizes:**

```typescript
bodyLimit: 1024 * 1024,      // 1MB (default)
bodyLimit: 10 * 1024 * 1024, // 10MB (file uploads)
bodyLimit: 100 * 1024,       // 100KB (pure JSON APIs)
bodyLimit: 0,                // unlimited
```

### trustProxy

Trust proxy config for getting the real client IP behind a reverse proxy (Nginx, K8s Ingress, Cloudflare).

```typescript
serve({
  fetch: server.fetch,
  port: 3000,
  trustProxy: true,  // trust all proxies
})
```

**Options:**

| Value | Description |
|------|------|
| `true` | Trust all proxies; read the IP from headers like X-Forwarded-For |
| `false` | Don't trust proxies; use the socket IP (default) |
| `string` | Trust a specific IP or CIDR, e.g. `"127.0.0.1"` or `"10.0.0.0/8"` |
| `string[]` | Trust multiple IPs or CIDRs |

**Supported proxy headers (by priority):**

1. `X-Forwarded-For` - the standard proxy header
2. `X-Real-IP` - Nginx
3. `X-Client-IP` - Apache
4. `CF-Connecting-IP` - Cloudflare
5. `Fastly-Client-IP` - Fastly
6. `X-Cluster-Client-IP` - GCP
7. `True-Client-IP` - Akamai & Cloudflare
8. `Fly-Client-IP` - Fly.io
9. `X-Forwarded` / `Forwarded-For` / `Forwarded` - RFC 7239
10. `AppEngine-User-IP` - GCP AppEngine
11. `CF-Pseudo-IPv4` - Cloudflare IPv6 compatibility

**Usage:**

```typescript
import type { VafastRequest } from 'vafast'

serve({
  fetch: (req: VafastRequest) => {
    // with trustProxy enabled, the request object gets ip and ips properties
    const ip = req.ip;       // real client IP (type-safe)
    const ips = req.ips;     // all IPs in the proxy chain
    return new Response(`Your IP: ${ip}`);
  },
  port: 3000,
  trustProxy: true,
})
```

::: warning Security note
Only enable trustProxy when the app is deployed behind a trusted reverse proxy.
Enabling it while directly exposed to the internet allows IP spoofing.
:::

### ServeResult

Return value of the `serve()` function.

```typescript
interface ServeResult {
  /** Node.js HTTP Server instance */
  server: HttpServer
  /** server port */
  port: number
  /** server hostname */
  hostname: string
  /** close the server immediately */
  stop: () => Promise<void>
  /** graceful shutdown (waits for in-flight requests) */
  shutdown: () => Promise<void>
}
```

### Responsibilities of Server vs. serve

`Server` only handles route matching and request processing and does **not** accept runtime options like `port` / `cors`. Server startup, timeouts, proxy trust and similar options are configured through `serve()`:

```typescript
import { Server, serve } from 'vafast'
import { cors } from '@vafast/cors'

const server = new Server(routes)
server.use(cors({ origin: ['https://yourdomain.com'] }))

serve({
  fetch: server.fetch,
  port: Number(process.env.PORT) || 3000,
  hostname: '0.0.0.0',
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024,
  gracefulShutdown: true,
  timeout: { requestTimeout: 30000 }
})
```

## Middleware Types

### Official Middleware Packages

Vafast provides standalone middleware packages with richer functionality:

| Package | Purpose | Docs |
|------|------|------|
| `@vafast/auth-middleware` | JWT/API key + app auth (for a separate auth service) | [View](/en/middleware/auth-middleware) |
| `@vafast/cors` | CORS handling | [View](/en/middleware/cors) |
| `@vafast/jwt` | JWT authentication | [View](/en/middleware/jwt) |
| `@vafast/rate-limit` | Rate limiting | [View](/en/middleware/rate-limit) |

#### Example: CORS

```typescript
import { Server } from 'vafast'
import { cors } from '@vafast/cors'

const server = new Server(routes)

server.use(cors({
  origin: ['https://example.com'],
  credentials: true
}))
```

#### Example: JWT Authentication

```typescript
import { jwt } from '@vafast/jwt'

const authMiddleware = jwt({ secret: 'your-secret' })

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [authMiddleware],
    handler: () => 'Admin panel'
  })
])
```

::: tip Production
For microservices that connect to a separate auth service, use [@vafast/auth-middleware](/en/middleware/auth-middleware) instead of `@vafast/jwt`.
:::

#### Example: Rate Limiting

```typescript
import { rateLimit } from '@vafast/rate-limit'

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // at most 100 requests
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    middleware: [rateLimitMiddleware],
    handler: () => 'Login'
  })
])
```

## Utility Functions

### defineRoute

Defines a type-safe route, either a leaf route or a nested route.

```typescript
import { defineRoute, Type } from 'vafast'

// leaf route
const userRoute = defineRoute({
  method: 'GET',
  path: '/users/:id',
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: ({ params }) => ({ id: params.id })
})

// nested route
const apiGroup = defineRoute({
  path: '/api',
  middleware: [authMiddleware],
  children: [
    defineRoute({
      method: 'GET',
      path: '/profile',
      handler: ({ user }) => ({ name: user.name }) // user comes from authMiddleware
    })
  ]
})
```

### defineRoutes

Flattens a route array and preserves literal types for `vafast-api-client` inference:

```typescript
const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: () => ({ users: [] }) })
])

type Api = InferEden<typeof routes> // no as const needed
```

### defineMiddleware

Defines middleware with type injection, passing context downstream via `next(ctx)`:

```typescript
import { defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware<{ user: { id: string } }>((req, next) => {
  const user = getUserFromToken(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)
  return next({ user })
})
```

### withContext

Creates a route definer with preset types for the context injected by parent middleware:

```typescript
import { withContext } from 'vafast'

export const defineAuthRoute = withContext<{ userInfo: UserInfo }>()

defineAuthRoute({
  method: 'GET',
  path: '/profile',
  handler: ({ userInfo }) => ({ id: userInfo.id })
})
```

### SSE Endpoints

Declare a streaming endpoint with `sse: true`. Just write the handler as an `async function*` and the framework wraps it as SSE internally:

```typescript
import { defineRoute, defineRoutes, Type, sse } from 'vafast'

// handler defined up front as a constant (production convention)
const streamHandler = defineRoute({
  method: 'GET',
  path: '/stream/:id',
  sse: true,
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: async function* ({ params }) {
    yield { taskId: params.id }
    yield sse({ event: 'complete' }, { done: true })
  },
})

const routes = defineRoutes([streamHandler])
```

**The `sse()` helper:**

Use it when you need custom `event` / `id` / `retry` metadata:

```typescript
yield sse({ event: 'status', id: '42', retry: 5000 }, { online: true })
```

> 📖 See [SSE Streaming](/en/essential/sse) for full documentation

## Request Parsing Utilities

Vafast provides a set of request parsing functions for extracting data from requests.

### parseBody()

Parses the request body, handling JSON, forms and other formats automatically based on Content-Type.

```typescript
import { parseBody } from 'vafast'

const handler = async ({ req }) => {
  const body = await parseBody(req)
  return { received: body }
}
```

**Supported formats:**
- `application/json` → parsed as a JSON object
- `application/x-www-form-urlencoded` → parsed as an object
- anything else → returns the raw text

**HTTP method restrictions:**
- Calling it on GET/HEAD requests returns `null` (defensive design)
- POST, PUT, PATCH and DELETE are parsed normally

### parseFormData()

Parses multipart/form-data form data, with file upload support.

```typescript
import { parseFormData } from 'vafast'

const handler = async ({ req }) => {
  const formData = await parseFormData(req)
  // formData.fields: regular form fields
  // formData.files: uploaded files
  return { fields: formData.fields }
}
```

**Return type:**

```typescript
interface FormData {
  fields: Record<string, string>
  files: Record<string, FileInfo>
}

interface FileInfo {
  name: string      // file name
  type: string      // MIME type
  size: number      // file size (bytes)
  data: Buffer      // file contents
}
```

**HTTP method restrictions:**
- Calling it on GET/HEAD requests throws an error
- POST, PUT, PATCH and DELETE are parsed normally

### parseFile()

Parses a single uploaded file, for cases where only one file is uploaded.

```typescript
import { parseFile } from 'vafast'

const handler = async ({ req }) => {
  const file = await parseFile(req)
  await saveFile(file.name, file.data)
  return { filename: file.name, size: file.size }
}
```

**HTTP method best practices:**

| Method | Use | Example |
|------|------|------|
| **POST** | Upload a new file; the server generates the ID | `POST /files` |
| **PUT** | Upload to a specific location, or replace a file | `PUT /files/abc123` |

### parseQuery()

Parses URL query parameters.

```typescript
import { parseQuery } from 'vafast'

// URL: /users?page=1&limit=10&filter[name]=john
const handler = async ({ req }) => {
  const query = parseQuery(req)
  // { page: '1', limit: '10', filter: { name: 'john' } }
  return { query }
}
```

### parseHeaders()

Parses request headers into an object.

```typescript
import { parseHeaders } from 'vafast'

const handler = async ({ req }) => {
  const headers = parseHeaders(req)
  const token = headers['authorization']
  return { hasAuth: !!token }
}
```

### parseCookies()

Parses cookies into an object.

```typescript
import { parseCookies } from 'vafast'

const handler = async ({ req }) => {
  const cookies = parseCookies(req)
  const sessionId = cookies['sessionId']
  return { sessionId }
}
```

## Response Utilities

Vafast provides concise response helper functions.

### json()

Creates a JSON response.

```typescript
import { json } from 'vafast'

// basic usage
return json(data)                          // 200 + JSON
return json(data, 201)                     // 201 + JSON
return json(data, 200, { 'X-Id': 'abc' })  // custom headers
```

**Signature:**

```typescript
function json(
  data: unknown,
  status?: number,           // default 200
  headers?: HeadersInit      // custom response headers
): Response
```

### Other Response Utilities

```typescript
import { text, html, redirect, empty, stream } from 'vafast'

// plain-text response
return text('Hello World')
return text('Created', 201)

// HTML response
return html('<h1>Hello</h1>')

// redirects
return redirect('/new-url')        // 302 temporary redirect
return redirect('/new-url', 301)   // 301 permanent redirect

// empty response
return empty()         // 204 No Content
return empty(201)      // with a specific status code

// streaming response
return stream(readableStream)
return stream(readableStream, 200, { 'Content-Type': 'text/event-stream' })
```

### Automatic Response Conversion

In a handler, the return value is converted to a Response automatically:

```typescript
handler: () => {
  return user          // → 200 + JSON
  return 'Hello'       // → 200 + text/plain
  return 123           // → 200 + text/plain
  return null          // → 204 No Content
})
```

## Error Handling

### The err() Error Helpers (Recommended)

`err()` provides a concise, semantic error API.

```typescript
import { err } from 'vafast'

// predefined errors (recommended)
throw err.badRequest('Invalid parameters')      // 400 BAD_REQUEST
throw err.unauthorized('Please log in first')   // 401 UNAUTHORIZED
throw err.forbidden('Access denied')            // 403 FORBIDDEN
throw err.notFound('User not found')            // 404 NOT_FOUND
throw err.conflict('Username already exists')   // 409 CONFLICT
throw err.unprocessable('Cannot process')       // 422 UNPROCESSABLE_ENTITY
throw err.tooMany('Too many requests')          // 429 TOO_MANY_REQUESTS
throw err.internal('Server error')              // 500 INTERNAL_ERROR

// custom error
throw err('Custom error message', 418, 20001)  // HTTP 418, { code: 20001, message: "..." }
```

**Full list of predefined errors:**

| Method | Status | Default message |
|------|--------|----------|
| `err.badRequest(msg?)` | 400 | Bad request parameters |
| `err.unauthorized(msg?)` | 401 | Unauthorized |
| `err.forbidden(msg?)` | 403 | Forbidden |
| `err.notFound(msg?)` | 404 | Resource not found |
| `err.conflict(msg?)` | 409 | Resource conflict |
| `err.unprocessable(msg?)` | 422 | Unprocessable entity |
| `err.tooMany(msg?)` | 429 | Too many requests |
| `err.internal(msg?)` | 500 | Internal server error |

### Schema Validation Failures (422)

When `defineRoute`'s `schema` validation fails, it **returns HTTP 422 automatically**, no hand-written middleware needed:

```json
{
  "code": 422,
  "message": "Request validation failed",
  "details": [
    {
      "location": "body",
      "path": "/email",
      "field": "email",
      "message": "Expected string to match 'email' format",
      "value": "invalid"
    }
  ]
}
```

Business errors `{ code, message }` don't include `details`; `details[].message` is TypeBox's original English message.

### The VafastError Class

The underlying error class; `err()` is a convenience wrapper around it.

```typescript
import { VafastError } from 'vafast'

class VafastError extends Error {
  status: number      // HTTP status code, default 500
  code: number        // business error code, defaults to status
  expose: boolean     // whether to expose the error message to the client, default false
  
  constructor(
    message: string,
    options?: {
      status?: number
      code?: number
      expose?: boolean
      cause?: unknown
    }
  )
}

// direct use (not recommended; prefer err())
throw new VafastError('Internal error', { 
  status: 500, 
  code: 50001,
  expose: false
})
```

### Full Example

```typescript
import { defineRoute, defineRoutes, json, err, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: async ({ params }) => {
      const user = await db.findUser(params.id)
      
      if (!user) {
        throw err.notFound('User not found')
      }
      
      return user  // 200 + JSON
    }
  }),
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
      if (await db.emailExists(body.email)) {
        throw err.conflict('Email already registered')
      }
      
      const user = await db.createUser(body)
      return json(user, 201)  // 201 Created
    })
  },
  defineRoute({
    method: 'DELETE',
    path: '/users/:id',
    handler: async ({ params }) => {
      await db.deleteUser(params.id)
      return null  // 204 No Content
    }
  })
])

// error response format:
// { "code": 404, "message": "User not found" }
// schema validation failure: HTTP 422 + { "code": 422, "message": "...", "details": [...] }
```

### API Cheat Sheet

```
┌─────────────────────────────────────────────────────────────┐
│                      Success Responses                      │
├─────────────────────────────────────────────────────────────┤
│  return data           →  200 + JSON (auto-converted)       │
│  return json(data,201) →  201 + JSON                        │
│  return 'Hello'        →  200 + text/plain                  │
│  return null           →  204 No Content                    │
│  return new Response() →  full control                      │
├─────────────────────────────────────────────────────────────┤
│                       Error Responses                       │
├─────────────────────────────────────────────────────────────┤
│  throw err.badRequest()    →  400                           │
│  throw err.unauthorized()  →  401                           │
│  throw err.forbidden()     →  403                           │
│  throw err.notFound()      →  404                           │
│  throw err.conflict()      →  409                           │
│  throw err.unprocessable() →  422                           │
│  throw err.tooMany()       →  429                           │
│  throw err.internal()      →  500                           │
│  throw err(msg, 418, 20001)→  custom                        │
│  schema validation fails   →  422 + details                 │
└─────────────────────────────────────────────────────────────┘
```

## Validation Configuration

### Request Body Validation

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const userSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 18 }))
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/users',
    // automatic validation with defineRoute
    schema: { body: userSchema },
    handler: ({ body }) => {
      // body has been validated and is type-safe
      return { message: 'User created' }
    }
  })
])
```

### Query Parameter Validation

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const querySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  sort: Type.Optional(Type.Union([
    Type.Literal('name'),
    Type.Literal('email'),
    Type.Literal('created_at')
  ]))
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    // automatic parsing and validation with defineRoute
    schema: { query: querySchema },
    handler: ({ query }) => {
      // query has been validated and is type-safe
      return `Page: ${query.page}, Limit: ${query.limit}, Sort: ${query.sort}`
    }
  })
])
```

## Error Handling Internals

### VafastError and err()

The framework has a built-in structured error type that `errorHandler` converts into a JSON response automatically:

```typescript
import { err, VafastError, isVafastError } from 'vafast'

// semantic shortcut methods
throw err.notFound('User not found')
throw err.unauthorized('Please log in first')
throw err.badRequest('Invalid parameters')

// custom error
throw new VafastError('Internal error', { status: 500, code: 50001, expose: false })
```

With `expose: true` the error message is returned to the client; otherwise a generic message is returned.

## Performance Optimization

### Radix Tree Routing

Route matching is based on a radix tree with O(k) time complexity (k is the number of path segments). Routes are sorted by specificity and checked for conflicts at construction time, so there's no route cache to configure.

### JIT-Compiled Validators

Schema validators are compiled on first use and cached:

```typescript
import { validateFast, createValidator, precompileSchemas } from 'vafast'

precompileSchemas([userSchema, postSchema]) // precompile at startup to avoid first-request latency
```

### Middleware Optimization

```typescript
import { jwt } from '@vafast/jwt'
import { defineMiddleware, type Middleware } from 'vafast'

const authMiddleware = jwt({ secret: 'your-secret' })

const conditionalMiddleware = (
  condition: (req: Request) => boolean,
  middleware: Middleware
) => {
  return defineMiddleware(async (req, next) => {
    if (condition(req)) {
      return middleware(req, next)
    }
    return next()
  })
}

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/admin',
    middleware: [
      conditionalMiddleware(
        (req) => req.url.includes('/admin'),
        authMiddleware
      )
    ],
    handler: () => 'Admin panel'
  })
])
```

## Deployment Configuration

### Production Configuration

```typescript
import { Server, serve } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'

const server = new Server(routes)
server.use(cors({ origin: ['https://yourdomain.com'], credentials: true }))
server.use(helmet())

serve({
  fetch: server.fetch,
  port: Number(process.env.PORT) || 3000,
  hostname: '0.0.0.0',
  trustProxy: true,
  gracefulShutdown: { timeout: 30000 },
  timeout: { requestTimeout: 30000 }
})
```

### Environment Variables

```typescript
serve({
  fetch: server.fetch,
  port: parseInt(process.env.PORT || '3000'),
  hostname: process.env.HOST || '0.0.0.0',
  trustProxy: process.env.TRUST_PROXY === 'true'
})
```

## Testing

### Unit Tests

```typescript
import { test, expect } from 'bun:test'
import { Server, defineRoute, defineRoutes } from 'vafast'

test('GET /users returns users list', async () => {
  const routes = defineRoutes([
    defineRoute({
      method: 'GET',
      path: '/users',
      handler: () => ['user1', 'user2']
    })
  ])
  
  const server = new Server(routes)
  const response = await server.fetch(new Request('http://localhost:3000/users'))
  const data = await response.json()
  
  expect(response.status).toBe(200)
  expect(data).toEqual(['user1', 'user2'])
})
```

### Integration Tests

```typescript
test('POST /users creates new user', async () => {
  const routes = defineRoutes([
    defineRoute({
      method: 'POST',
      path: '/users',
      handler: async ({ body }) => ({
        data: { id: 1, ...body },
        status: 201
      })
    })
  ])
  
  const server = new Server(routes)
  const response = await server.fetch(
    new Request('http://localhost:3000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    })
  )
  
  const data = await response.json()
  
  expect(response.status).toBe(201)
  expect(data.name).toBe('John')
  expect(data.email).toBe('john@example.com')
  expect(data.id).toBe(1)
})
```

## Monitoring Module

Vafast ships a zero-dependency monitoring system in `vafast/monitoring`.

### withMonitoring

Adds monitoring to a Server.

```typescript
import { Server } from 'vafast'
import { withMonitoring } from 'vafast/monitoring'

const server = new Server(routes)
const monitored = withMonitoring(server, {
  slowThreshold: 500,
  excludePaths: ['/health']
})
```

### MonitoringConfig

| Property | Type | Default | Description |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | Whether monitoring is enabled |
| `console` | `boolean` | `true` | Whether to print to the console |
| `slowThreshold` | `number` | `1000` | Slow request threshold (ms) |
| `maxRecords` | `number` | `1000` | Max records |
| `samplingRate` | `number` | `1` | Sampling rate 0-1 |
| `excludePaths` | `string[]` | `[]` | Excluded paths |
| `onRequest` | `(metrics) => void` | - | Request completed callback |
| `onSlowRequest` | `(metrics) => void` | - | Slow request callback |

### MonitoredServer Methods

| Method | Returns | Description |
|------|--------|------|
| `getMonitoringStatus()` | `MonitoringStatus` | Full monitoring status |
| `getMonitoringMetrics()` | `MonitoringMetrics[]` | Raw metrics data |
| `getPathStats(path)` | `PathStats` | Stats for a single path |
| `getTimeWindowStats(ms)` | `TimeWindowStats` | Time window stats |
| `getRPS()` | `number` | Current requests per second |
| `getStatusCodeDistribution()` | `StatusCodeDistribution` | Status code distribution |
| `resetMonitoring()` | `void` | Reset monitoring data |

### MonitoringStatus

```typescript
interface MonitoringStatus {
  enabled: boolean
  uptime: number                    // server uptime (ms)
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  avgResponseTime: number           // average response time
  p50: number                       // P50 response time
  p95: number                       // P95 response time
  p99: number                       // P99 response time
  minTime: number
  maxTime: number
  rps: number                       // current RPS
  statusCodes: StatusCodeDistribution
  timeWindows: {
    last1min: TimeWindowStats
    last5min: TimeWindowStats
    last1hour: TimeWindowStats
  }
  byPath: Record<string, PathStats>
  memoryUsage: { heapUsed: string; heapTotal: string }
  recentRequests: MonitoringMetrics[]
}
```

### TimeWindowStats

```typescript
interface TimeWindowStats {
  requests: number      // request count
  successful: number    // successful count
  failed: number        // failed count
  errorRate: number     // error rate
  avgTime: number       // average response time
  rps: number           // requests per second
}
```

### StatusCodeDistribution

```typescript
interface StatusCodeDistribution {
  '2xx': number
  '3xx': number
  '4xx': number
  '5xx': number
  detail: Record<number, number>  // detailed distribution, e.g. { 200: 100, 404: 5 }
}
```

See [Performance Monitoring](/en/patterns/trace) for detailed usage.

## Summary

Vafast's API reference covers:

- ✅ Core classes and interfaces
- ✅ Type definitions and type safety
- ✅ The middleware system
- ✅ Validation configuration
- ✅ Lifecycle hooks
- ✅ Performance optimization
- ✅ Deployment configuration
- ✅ Testing support
- ✅ Built-in monitoring

### Next Steps

- Read the [Routing guide](/en/routing) to learn the routing system
- Learn the [Middleware System](/en/middleware) to see how middleware works
- Explore [Component Routing](/en/component-routing) for component-based routes
- See [Performance Monitoring](/en/patterns/trace) for monitoring features
- See [Best Practices](/en/essential/best-practice) for development tips

If you have any questions, check our [Community page](/en/community) or the [GitHub repository](https://github.com/vafast/vafast).
