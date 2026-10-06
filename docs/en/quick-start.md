---
title: 'Vafast Quick Start: Build a TypeScript API in Minutes'
description: 'Vafast quick start: scaffold a project with create-vafast-app, write a Hello endpoint, add schema validation, common request types and a simple middleware, and get a TypeScript web server running in minutes.'
next:
  text: 'Tutorial'
  link: '/tutorial'
---

# Vafast Quick Start

Get a Vafast server running in a few minutes. This page covers **install → Hello → Schema → common request types → simple middleware**. For splitting CRUD into files and nested routes, follow the [Tutorial](/en/tutorial).

## Create a Project

::: code-group

```bash [Scaffold (recommended)]
npx create-vafast-app
cd my-vafast-app
npm install
npm run dev
```

```bash [Manual]
mkdir my-vafast-app && cd my-vafast-app
npm init -y
npm install vafast
npm install -D typescript tsx @types/node
```

:::

After scaffolding, open [localhost:3000](http://localhost:3000) to see the welcome page.

For a manual setup, add this to `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  }
}
```

A `tsconfig.json` you can use:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

## Hello Vafast

Create `src/index.ts`:

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!',
  }),
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('http://localhost:3000')
})
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and you should see `Hello Vafast!`.

## Schema

Declare a `schema` with `Type`: validation failures return 422 automatically, and fields in the handler are typed for you.

```typescript
import { defineRoute, Type } from 'vafast'

const CreateUser = Type.Object({
  name: Type.String({ minLength: 1 }),
  age: Type.Optional(Type.Number({ minimum: 0 })),
})

defineRoute({
  method: 'POST',
  path: '/users',
  schema: { body: CreateUser },
  handler: ({ body }) => ({ id: '1', name: body.name, age: body.age ?? 18 }),
})
```

| schema field | Purpose |
|-------------|------|
| `body` | JSON request body |
| `query` | Query string |
| `params` | Path `:id` |

When validation fails, **the handler is never called**; the framework returns HTTP **422** directly:

```json
{
  "code": 422,
  "message": "Request validation failed",
  "details": [
    {
      "location": "body",
      "path": "/name",
      "field": "name",
      "message": "Expected string length greater or equal to 1",
      "value": ""
    }
  ]
}
```

| Field | Description |
|------|------|
| `details[].location` | `body` / `query` / `params`, etc. |
| `details[].field` | Field path, e.g. `name`, `receiver.email` |
| `details[].message` | Original TypeBox message (English) |
| `details[].value` | The actual value that triggered the error (optional) |

See [Validation](/en/essential/validation) for more.

## Common Request Types

Set the method with `method` and constrain inputs with `schema`:

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  // GET + path / query params
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: {
      params: Type.Object({ id: Type.String() }),
      query: Type.Object({
        verbose: Type.Optional(Type.Boolean()),
      }),
    },
    handler: ({ params, query }) => ({
      id: params.id,
      verbose: query.verbose ?? false,
    }),
  }),

  // POST + body
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({ name: Type.String({ minLength: 1 }) }),
    },
    handler: ({ body }) => ({ id: '1', name: body.name }),
  }),

  // PUT / PATCH
  defineRoute({
    method: 'PUT',
    path: '/users/:id',
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({ name: Type.String() }),
    },
    handler: ({ params, body }) => ({ id: params.id, ...body }),
  }),

  // DELETE
  defineRoute({
    method: 'DELETE',
    path: '/users/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: ({ params }) => {
      console.log('deleted', params.id)
      return null // → 204 No Content
    },
  }),
])
```

Just return a value from the handler: `'text'` → text/plain, `{ ok: true }` → JSON, `null` → 204.

## Simple Middleware

```typescript
import { defineMiddleware, defineRoute } from 'vafast'

const log = defineMiddleware(async (req, next) => {
  const start = Date.now()
  const res = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} ${res.status} ${Date.now() - start}ms`)
  return res
})

defineRoute({
  method: 'GET',
  path: '/',
  middleware: [log],
  handler: () => 'Hello Vafast!',
})

// Global: server.use(log)
```

Use `next({ ... })` to inject data into the handler:

```typescript
const withUser = defineMiddleware(async (req, next) => {
  return next({ userId: req.headers.get('x-user-id') ?? 'guest' })
})

defineRoute({
  method: 'GET',
  path: '/me',
  middleware: [withUser],
  handler: ({ userId }) => ({ userId }),
})
```

See [Tutorial · Middleware](/en/tutorial#step-5-add-a-middleware-layer) for more.

## What You've Learned

| API | Purpose |
|-----|------|
| `Type` + `schema` | Request validation and type inference |
| `defineRoute` / `defineRoutes` | Define routes |
| `defineMiddleware` | Middleware; `next()` / `next({ ctx })` |
| `Server` + `serve` | Create the app and listen on a port |

## Next Steps

Continue with the [Tutorial](/en/tutorial): split files and nest routes. To understand how it works first, read [Key Concepts](/en/key-concept).
