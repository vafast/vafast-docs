---
title: Best Practices - Vafast
description: 'Vafast best practices: project structure, nested routes, where to attach middleware, withContext for type-safe routes, declarative route metadata and production tips.'
prev:
  text: 'Tutorial'
  link: '/tutorial'
---

# Best Practices

This page assumes you've completed the [Tutorial](/en/tutorial): you can write leaf routes, schemas, `err`, route groups and middleware.

Here we collect conventions for **when your project grows**: directory layout, nested routes, middleware layering, startup config, declarative metadata, `withContext`, SSE and testing.

## 1. Directory Layout

The framework doesn't enforce a structure. As routes multiply, we recommend:

```
src/
  index.ts           # Server + global middleware + serve
  routes/
    index.ts         # aggregated exports
    notes.ts
    users.ts
  services/          # business functions unrelated to HTTP (optional)
  utils/
```

- **Route files**: define leaves and attach them to resource groups with `children`
- **Entry**: only assembles and starts the app
- You can also split by feature module (`modules/notes/{routes,service}`); the principle is the same: thin routes, testable logic

## 2. Nested Routes

Leaf = `method` + `path` + `handler`; group = only `path` + `children` (can be nested further). Groups own prefixes and shared middleware; leaves own the concrete endpoints.

```typescript
// routes/notes.ts
import { defineRoute, defineRoutes, Type, err } from 'vafast'
import { listNotes, getNote, createNote } from '../services/notes'

const NoteBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

const listHandler = defineRoute({
  method: 'GET',
  path: '/',
  handler: () => listNotes(),
})

const getOneHandler = defineRoute({
  method: 'GET',
  path: '/:id',
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: ({ params }) => {
    const note = getNote(params.id)
    if (!note) throw err.notFound('Note not found')
    return note
  },
})

const createHandler = defineRoute({
  method: 'POST',
  path: '/',
  schema: { body: NoteBody },
  handler: ({ body }) => createNote(body),
})

export const notesRoutes = defineRoutes([
  defineRoute({
    path: '/notes',
    name: 'Notes',
    description: 'Notes API',
    children: [listHandler, getOneHandler, createHandler],
  }),
])
```

With multiple levels of nesting, child paths are **relative**, and the final URL is the concatenation of each level's `path`:

```typescript
export const apiRoutes = defineRoutes([
  defineRoute({
    path: '/api',
    children: [
      defineRoute({
        path: '/v1',
        children: [
          defineRoute({
            path: '/notes',
            children: [listHandler, getOneHandler, createHandler],
          }),
        ],
      }),
    ],
  }),
])
// → GET /api/v1/notes, GET /api/v1/notes/:id, POST /api/v1/notes
```

```typescript
// routes/index.ts
import { notesRoutes } from './notes'
import { usersRoutes } from './users'

export const allRoutes = [...notesRoutes, ...usersRoutes]
```

| Recommendation | Why |
|------|------|
| Define leaves as constants before putting them in `children` | Readable files, easy to attach group middleware |
| Use relative child paths (`/`, `/:id`) | The group provides the prefix |
| Split files by resource; spread `...allRoutes` in the entry | Clear composition across modules |
| Attach auth / logging to the group | Leaves under the same resource inherit them automatically |

### Shared API Prefix (Optional)

You can also add a prefix once in the entry file (no need to change every file):

```typescript
const BASE_PATH = '/api'

const routesWithBasePath = allRoutes.map((route) => ({
  ...route,
  path: BASE_PATH + route.path,
}))

const server = new Server([
  defineRoute({ method: 'GET', path: '/', handler: () => ({ ok: true }) }),
  ...routesWithBasePath,
])
```

Health-check routes usually live at the unprefixed `/`. See the [Routing Guide](/en/routing) for more rules.

## 3. Where to Attach Middleware

Middleware follows the onion model, with three stackable levels:

| Level | How | Scope | Typical use |
|------|------|------|----------|
| Global | `server.use(mw)` | All routes (including 404) | CORS, request ID, access logs |
| Route group | `defineRoute({ path, middleware, children })` | The group and its descendants | Auth, tenancy, resource-level logging |
| Leaf | `defineRoute({ method, middleware, handler })` | A single endpoint | Permission guards, rate limiting, upload checks |

Execution order (outside in): **global → parent group → child group → leaf → handler**, reversed on the way back.

```typescript
import { Server, defineRoute, defineRoutes, defineMiddleware, serve, err } from 'vafast'
import { cors } from '@vafast/cors'
import { requestId } from '@vafast/request-id'

const log = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const res = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} ${res.status} ${Date.now() - start}ms`)
  return res
})

const auth = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('Please log in first')
  return next({ userId: 'u_1' })
})

const adminOnly = defineMiddleware(async (req, next) => {
  // read context injected by the previous layer, or query the database yourself
  return next()
})

const routes = defineRoutes([
  // public
  defineRoute({
    method: 'GET',
    path: '/health',
    handler: () => ({ ok: true }),
  }),

  // group-level auth: everything under /account/* requires login
  defineRoute({
    path: '/account',
    middleware: [auth],
    children: [
      defineRoute({
        method: 'GET',
        path: '/profile',
        handler: ({ userId }) => ({ userId }),
      }),
      // one more layer on the leaf
      defineRoute({
        method: 'DELETE',
        path: '/profile',
        middleware: [adminOnly],
        handler: ({ userId }) => {
          console.log('delete', userId)
          return null
        },
      }),
    ],
  }),
])

const server = new Server(routes)
server.use(cors())
server.use(requestId())
server.use(log) // global: log every request
```

| Recommendation | Why |
|------|------|
| Use global middleware for cross-cutting concerns | Unrelated to business paths |
| Use group-level auth for a resource | Avoids repeating it on every leaf |
| Use leaf middleware for endpoint-specific constraints | Permission differences are obvious at a glance |
| Pass context with `next({ ... })` | Handlers read fields directly; across `children`, see §9 `withContext` |

Official packages (install as needed): [`@vafast/cors`](/en/middleware/cors), [`@vafast/jwt`](/en/middleware/jwt), [`@vafast/request-id`](/en/middleware/request-id), [`@vafast/request-logger`](/en/middleware/request-logger) and more. See [Middleware](/en/middleware) for how it works.

## 4. Schema and Types from One Source

Validate with `Type` and infer types with `Static`; don't use classes / interfaces as request models.

```typescript
import { Type, type Static } from 'vafast'

export const NoteBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 }),
})

export type NoteBody = Static<typeof NoteBody>
```

Related schemas can be grouped together:

```typescript
export const NoteModel = {
  create: NoteBody,
  update: Type.Partial(NoteBody),
}
```

When validation fails the handler is skipped, and the framework returns HTTP **422** directly:

```json
{
  "code": 422,
  "message": "Request validation failed",
  "details": [
    {
      "location": "body",
      "path": "/title",
      "field": "title",
      "message": "Expected string length greater or equal to 1",
      "value": ""
    }
  ]
}
```

| Field | Description |
|------|------|
| `details[].location` | `body` / `query` / `params`, etc. |
| `details[].field` | Field path |
| `details[].message` | Original TypeBox message (English) |
| `details[].value` | The actual value that triggered the error (optional) |

For business errors (404, 403, etc.) use `err.*` from the next section; those responses usually have no `details`. See [Validation](/en/essential/validation) for the full details.

## 5. Use `err.*` for Errors; Keep Services HTTP-Free

Throw business errors with `throw err.xxx()` in routes / handlers and the framework turns them into JSON; the service layer only returns data or `null` and never builds a `Response`.

```typescript
import { err } from 'vafast'

if (!id) throw err.badRequest('Invalid parameters')
if (!row) throw err.notFound('Resource not found')
if (!allowed) throw err.forbidden('Forbidden')
```

Response shape (no `details`, unlike the schema 422):

```json
{
  "code": 404,
  "message": "Resource not found"
}
```

### Predefined Errors

| Method | HTTP | Default message |
|------|------|----------------|
| `err.badRequest(msg?)` | 400 | Bad request parameters |
| `err.unauthorized(msg?)` | 401 | Unauthorized |
| `err.forbidden(msg?)` | 403 | Forbidden |
| `err.notFound(msg?)` | 404 | Resource not found |
| `err.conflict(msg?)` | 409 | Resource conflict |
| `err.unprocessable(msg?)` | 422 | Unprocessable entity |
| `err.tooMany(msg?)` | 429 | Too many requests |
| `err.internal(msg?)` | 500 | Internal server error |

The second argument is an optional business code (written to the response `code`; the HTTP status still follows the table above):

```typescript
throw err.notFound('User not found', 10001)
// → HTTP 404, { code: 10001, message: "User not found" }

throw err('Custom message', 418, 20001) // any status code
```

```typescript
// ❌ building a Response in the service
export function getNote(id: string) {
  if (!id) return new Response('Bad Request', { status: 400 })
}

// ✅ the service returns data or null; the route decides whether to throw err
export function getNote(id: string) {
  return db.notes.findById(id)
}
```

| Scenario | Approach |
|------|------|
| Malformed request | Rely on `schema` → automatic 422 + `details` |
| Business rule fails | `throw err.*` → matching status code, no `details` |
| Service layer | Stays HTTP-free; the route does the `throw` |

See [API Reference · Error Handling](/en/api#error-handling) for more.

## 6. Service Layer: Plain Functions Are Fine

Extract logic that doesn't depend on the request into functions so they're easy to unit test:

```typescript
// services/notes.ts
import type { NoteBody } from '../models/note'

const notes: Array<NoteBody & { id: string }> = []

export function listNotes() {
  return notes
}

export function getNote(id: string) {
  return notes.find((n) => n.id === id)
}

export function createNote(input: NoteBody) {
  const note = { id: String(Date.now()), ...input }
  notes.push(note)
  return note
}
```

Routes handle validation, auth context, calling services and mapping to `err`. No need to force MVC.

## 7. Startup and `serve` Configuration

The entry only assembles: attach global middleware (see §3), then `serve`:

```typescript
import { Server, serve, defineRoute } from 'vafast'
import { cors } from '@vafast/cors'
import { requestId } from '@vafast/request-id'
import { allRoutes } from './routes'

const server = new Server([
  defineRoute({ method: 'GET', path: '/', handler: () => ({ ok: true }) }),
  ...allRoutes,
])

server.use(cors())
server.use(requestId())

serve({
  fetch: server.fetch,
  port: 3000,
  hostname: '0.0.0.0',
  bodyLimit: 1024 * 1024,       // default 1MB; raise it for uploads, 0 = unlimited
  timeout: { requestTimeout: 30_000 },
  gracefulShutdown: true,
  trustProxy: true,             // get the real IP behind a reverse proxy
})
```

### Common `serve()` Options

| Option | Default | Purpose |
|------|------|------|
| `fetch` | (required) | Usually `server.fetch` |
| `port` | `3000` | Port to listen on |
| `hostname` | `'0.0.0.0'` | Bind address |
| `bodyLimit` | `1MB` | Max request body size (bytes); exceeding it → 413; `0` = unlimited |
| `timeout.requestTimeout` | `0` (unlimited) | Per-request processing timeout (ms); exceeding it → 504 |
| `timeout.headersTimeout` | Node default | Timeout for receiving all request headers |
| `timeout.keepAliveTimeout` | Node default | Keep-Alive idle timeout |
| `gracefulShutdown` | off | `true` or an object: on SIGTERM/SIGINT, wait for in-flight requests before closing |
| `trustProxy` | `false` | Trust the reverse proxy and take the IP from `X-Forwarded-*`; `request.ip` / `ips` |
| `onError` | — | Fallback for uncaught errors in the Node adapter |

| Scenario | Recommendation |
|------|------|
| Pure JSON API | Keep `bodyLimit` at 1MB or smaller |
| File uploads | Tune per use case, e.g. `bodyLimit: 10 * 1024 * 1024` |
| Behind Nginx / Ingress | Leave most timeouts to the proxy; enable `trustProxy` if you need the real IP |
| Directly on the public internet | Set `timeout.requestTimeout` (e.g. 30–120s) to guard against slow DoS |
| K8s / containers | `gracefulShutdown: true` (or set `timeout`) |

See [API Reference · serve()](/en/api#serve) for all fields and examples.

## 8. Routes Can Carry Parameters: Declarative Metadata

### The Idea

In Vafast, a route is a **configuration object**, not just `method + path + handler`.

| Concept | Meaning |
|------|------|
| Declarative | The route config describes "what this endpoint can do and which capabilities it has" |
| Single source of truth | Metadata lives on the leaf alongside the handler; no separate path→permission/billing mapping table |
| Queryable | Middleware, docs and webhooks read the same config via `RouteRegistry` |
| Explicit | Behavior switches live on the route (e.g. `sse: true`) instead of being inferred implicitly |

`:id` in the path and `schema` govern **how requests come in**; parameters on the route govern **the endpoint's own capabilities and policies**.

### Built-in Metadata

```typescript
defineRoute({
  method: 'POST',
  path: '/notes',
  name: 'create_note',           // machine-readable (docs, tooling)
  description: 'Create a note',     // human-readable
  docs: { tags: ['notes'] },      // OpenAPI, etc.
  sse: true,                      // explicitly declare SSE (if needed)
  schema: { body: NoteBody },
  handler: ({ body }) => createNote(body),
})
```

### Business Extension Fields

Any custom field is preserved on the flattened route. Common uses:

```typescript
defineRoute({
  method: 'POST',
  path: '/notes',
  name: 'create_note',
  description: 'Create a note',
  webhook: true,                    // write operations trigger a webhook
  permission: 'notes.create',       // permission code
  // billing: { price: 0.01 },     // as needed: billing, auditing, etc.
  schema: { body: NoteBody },
  handler: ({ body }) => createNote(body),
})
```

Middleware uses `getRouteRegistry()` to look up metadata for the current request instead of hard-coding paths:

```typescript
import { defineMiddleware, getRouteRegistry, err } from 'vafast'

const requirePermission = defineMiddleware(async (req, next) => {
  const route = getRouteRegistry().get(req.method, new URL(req.url).pathname)
  if (route?.permission) {
    const allowed = await checkPermission(req, route.permission)
    if (!allowed) throw err.forbidden('Forbidden')
  }
  return next()
})
```

| Recommendation | Why |
|------|------|
| Put metadata on leaf routes | It lives with the handler and changes together with the endpoint |
| Have middleware read the registry | Decouples cross-cutting logic from specific paths |
| Keep extension field names stable | Makes bulk collection with `registry.filter('webhook')` easy |

When you need **TypeScript constraints** on extension fields, use the second generic parameter of `withContext` from the next section. See [Routing · Extension Fields](/en/routing#extension-fields-—-declarative-metadata) for details.

## 9. Use withContext to Wrap Type-Safe Routes

`withContext` creates **route definers with a preset context**: define once, reuse everywhere. Handlers automatically get the types of fields injected by middleware, and the second generic parameter constrains the extension fields from the previous section (e.g. `webhook`, `permission`).

Common scenarios:

| Scenario | Purpose |
|------|------|
| Context injected by middleware | Use `userId` / `role` directly in the handler, fully typed |
| Routes split across files | Export `defineAuthedRoute` so every module shares the same context contract |
| Group middleware + `children` | TS can't infer parent injections across calls; the definer wires them up explicitly |
| Extension field types | `withContext<Ctx, { webhook?: boolean; permission?: string }>()` |

```typescript
import {
  defineRoute,
  defineRoutes,
  defineMiddleware,
  withContext,
  err,
} from 'vafast'

const auth = defineMiddleware(async (req, next) => {
  const token = req.headers.get('authorization')
  if (!token) throw err.unauthorized('Please log in first')
  return next({ userId: 'u_1', role: 'admin' as const })
})

// define once: preset context + extension field types
const defineAuthedRoute = withContext<
  { userId: string; role: 'admin' | 'user' },
  { webhook?: boolean; permission?: string }
>()

const profileHandler = defineAuthedRoute({
  method: 'GET',
  path: '/profile',
  permission: 'account.read',
  handler: ({ userId, role }) => ({ userId, role }),
})

const updateHandler = defineAuthedRoute({
  method: 'PATCH',
  path: '/profile',
  webhook: true,
  permission: 'account.write',
  handler: ({ userId, body }) => ({ userId, ...body }),
})

export const accountRoutes = defineRoutes([
  defineRoute({
    path: '/account',
    middleware: [auth],
    children: [profileHandler, updateHandler],
  }),
])
```

| Case | Approach |
|------|------|
| Leaf attaches its own middleware, no custom extension types | A plain `defineRoute` is enough |
| Reusing context / constraining extension fields / group injection | Wrap a definer with `withContext` |
| Rolling your own JWT signing / verification | [@vafast/jwt](/en/middleware/jwt) |

See [Middleware · withContext](/en/middleware#parent-middleware-type-injection-withcontext) for how it works.

## 10. SSE Streaming

For one-way real-time push (AI chat, progress, notifications), use the built-in SSE: set `sse: true` **explicitly** on the route, write the handler as an `async function*`, and just `yield`.

```typescript
import { defineRoute, Type } from 'vafast'

defineRoute({
  method: 'POST',
  path: '/chat',
  sse: true,
  schema: {
    body: Type.Object({
      prompt: Type.String({ minLength: 1 }),
    }),
  },
  handler: async function* ({ body }) {
    yield { type: 'start' }
    for await (const chunk of streamModel(body.prompt)) {
      yield { type: 'delta', content: chunk }
    }
    yield { type: 'done' }
  },
})
```

| Point | Description |
|------|------|
| `sse: true` | Must be declared explicitly for the framework to use `text/event-stream` |
| `async function*` | `yield` any JSON-serializable data |
| Schema / middleware | Same as regular routes: validated before entering the generator |
| WebSocket | Not built into the core yet; manage bidirectional channels yourself or via a proxy |

Use the `sse()` helper when you need an event name / id. See [SSE](/en/essential/sse) for full usage.

### Related Features

| Capability | Docs |
|------|------|
| Webhooks on write operations | [Webhook](/en/middleware/webhook) |
| Request logging / CORS | [Request Logger](/en/middleware/request-logger), [CORS](/en/middleware/cors) |
| Static files | [Static](/en/middleware/static) |
| OpenAPI | [OpenAPI](/en/integrations/openapi) |
| Typed frontend client | [API Client](/en/api-client/overview) |
| Cookie | [Cookie](/en/middleware/cookie) |

## 11. Testing

Use `server.fetch`; no need to start a port:

```typescript
import { describe, it, expect } from 'vitest'
import { Server, defineRoute, defineRoutes } from 'vafast'

const server = new Server(
  defineRoutes([
    defineRoute({
      method: 'GET',
      path: '/health',
      handler: () => ({ ok: true }),
    }),
  ]),
)

describe('health', () => {
  it('returns ok', async () => {
    const res = await server.fetch(new Request('http://localhost/health'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
```

Unit test service functions on their own. See [Unit Testing](/en/patterns/unit-test) for more.

## Summary

| Stage | Focus |
|------|--------|
| Getting started | Schema, leaf routes, request types, simple middleware ([Quick Start](/en/quick-start)) |
| Tutorial | Schema, `err`, splitting files, route groups, middleware |
| This page | Nested routes, middleware layering, serve config, declarative parameters, `withContext`, SSE, testing |
