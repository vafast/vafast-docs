---
title: Swagger - Vafast
description: 'Vafast Swagger middleware: generate OpenAPI 3 docs from your routes and schemas automatically and serve an interactive Scalar or Swagger UI.'
---

# Swagger

`@vafast/swagger` provides an **OpenAPI documentation UI** and an **OpenAPI JSON** endpoint for Vafast. The UI can be [Scalar](https://github.com/scalar/scalar) (default) or the classic [Swagger UI](https://swagger.io/tools/swagger-ui/).

::: warning Routes are not scanned automatically
The current implementation **only** responds to the configured `path` (UI page) and `specPath` (JSON spec). The spec comes entirely from the `documentation` you pass in (especially `documentation.paths`); it is **not** generated from `defineRoute` automatically.
:::

## Key Concepts (for New Users)

### What Does the OpenAPI Document Look Like?

The middleware produces an OpenAPI **3.0.3** JSON document with a fixed structure:

```typescript
{
  openapi: '3.0.3',
  info: { title, description, version },
  paths: { /* each endpoint */ },
  components: { /* reusable schemas / security schemes, etc. */ },
  tags: [ /* grouping tags */ ],
}
```

### `documentation.info` Fields

| Field | Purpose | Default (source) |
|------|------|----------------|
| `info.title` | API name, shown in the UI title and elsewhere | `'Vafast API'` |
| `info.description` | Short description of what the API does | `'API documentation'` |
| `info.version` | **Your API version** (not the Swagger UI CDN version) | `'1.0.0'` |

Don't confuse these:

- `documentation.info.version` → the API version in OpenAPI
- The `version` option → the **Swagger UI** `swagger-ui-dist` CDN version (default `'4.18.2'`)
- `scalarVersion` → the **Scalar** CDN version (default `'latest'`)

### What Are `paths` / `components` / `tags`?

| Field | In plain terms |
|------|------|
| **`paths`** | The core: which HTTP methods, parameters and responses exist under each URL path. The endpoint list in the UI comes from here. **Leave it out and the UI is blank.** |
| **`components`** | Reusable parts: e.g. `schemas` (data models) and `securitySchemes` (Bearer / API key, etc.), referenced from paths via `$ref`. |
| **`tags`** | Metadata for grouping endpoints (name + optional description). Matches the `tags: ['users']` on each operation; the UI collapses by group. |

### `provider`: Scalar vs. Swagger UI

| `provider` | Experience | Main related options |
|------------|------|----------------|
| **`'scalar'`** (default) | Modern reading experience, good for browsing and trying calls | `scalarVersion`, `scalarCDN`, `scalarConfig` |
| **`'swagger-ui'`** | Classic Swagger UI, familiar to "Try it out" users | `version`, `swaggerOptions`, `autoDarkMode` |

Both fetch the spec from the relative path `./json` (relative to the UI page). Keep the relationship in mind when customizing `path` / `specPath`.

### Which Options Currently Do Nothing?

The `VafastSwaggerConfig` type still has `theme`, `excludeStaticFile`, `exclude`, `excludeMethods` and `excludeTags`, but **the `swagger()` middleware's main path doesn't use them for theming, scanning or filtering** (see the API table below). Treat your hand-written `documentation` as the source of truth.

## Installation

```bash
npm install @vafast/swagger
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { swagger } from '@vafast/swagger'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => [{ id: 1, name: 'Ada' }],
  }),
])

const server = new Server(routes)

server.use(
  swagger({
    path: '/swagger',
    provider: 'scalar',
    documentation: {
      info: {
        title: 'My API',
        version: '1.0.0',
        description: 'Example API',
      },
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }),
)

serve({ fetch: server.fetch, port: 3000 })
```

- UI: `http://localhost:3000/swagger`
- JSON: `http://localhost:3000/swagger/json` (default `specPath = ${path}/json`)

## Usage

### Hand-Writing a Full `documentation` (Minimal Example with components)

As you add routes, you must keep `paths` in sync, or they won't show up in the UI:

```typescript
documentation: {
  info: {
    title: 'API',
    description: 'Business API',
    version: '1.0.0',
  },
  tags: [{ name: 'users', description: 'User operations' }],
  paths: {
    '/users/{id}': {
      get: {
        tags: ['users'],
        summary: 'User details',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['id'],
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
}
```

In the source, the `components` / `schemas` structure is fairly loose (properties are mostly `any`); the example above is a common, working minimal form.

### Switching to Swagger UI

```typescript
swagger({
  provider: 'swagger-ui',
  version: '4.18.2', // swagger-ui-dist CDN version
  autoDarkMode: true,
  swaggerOptions: {
    persistAuthorization: true,
  },
  documentation: { /* ... */ },
})
```

### Customizing Scalar

```typescript
swagger({
  provider: 'scalar',
  scalarVersion: 'latest',
  scalarCDN: '', // empty uses jsDelivr; can point to a self-hosted URL
  scalarConfig: { theme: 'default' },
  documentation: { /* ... */ },
})
```

### Custom Paths

```typescript
swagger({
  path: '/docs',
  specPath: '/docs/openapi.json',
  documentation: { paths: { /* ... */ } },
})
```

## API

### `swagger(config?)`

```typescript
swagger(config?: VafastSwaggerConfig): Middleware
```

Middleware logic:

1. `pathname === path` → returns the UI HTML (`htmlResponse`)
2. `pathname === specPath` → returns the `createOpenAPISpec(documentation)` JSON
3. Otherwise → `next()`

### `VafastSwaggerConfig`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `provider` | `'scalar' \| 'swagger-ui'` | `'scalar'` | UI provider |
| `path` | `string` | `'/swagger'` | UI path |
| `specPath` | `string` | `` `${path}/json` `` | OpenAPI JSON path |
| `documentation` | See table below | `{}` | **Hand-written** spec fragment |
| `scalarVersion` | `string` | `'latest'` | Scalar CDN version |
| `scalarCDN` | `string` | `''` | Custom Scalar script URL; empty uses jsDelivr |
| `scalarConfig` | `Record<string, any>` | `{}` | Written to Scalar's `data-configuration` |
| `version` | `string` | `'4.18.2'` | Swagger UI dist version |
| `swaggerOptions` | `Record<string, any>` | `{}` | Injected into `SwaggerUIBundle({...})` (function options not supported) |
| `autoDarkMode` | `boolean` | `true` | Dark-mode media query for Swagger UI |

### `documentation` Fields

| Field | Description |
|------|------|
| `info.title` | API title; defaults to `'Vafast API'` |
| `info.description` | API description; defaults to `'API documentation'` |
| `info.version` | API version; defaults to `'1.0.0'` |
| `paths` | OpenAPI paths (**hand-written**); defaults to `{}` |
| `components` | E.g. `schemas`, `securitySchemes`; defaults to `{}` |
| `tags` | `{ name, description? }[]`; defaults to `[]` |

### Options That Exist but Are Currently Unused

The type still includes these fields, but **the current `swagger()` implementation doesn't use them for filtering, scanning or theming**:

| Parameter | Default | Description |
|------|------|------|
| `theme` | unpkg swagger-ui.css URL | Passed as a `renderSwaggerUI` parameter but **unused**; the CSS is hard-coded to unpkg |
| `excludeStaticFile` | `true` | Not part of the middleware's branching logic |
| `exclude` | `[]` | Not used to exclude paths |
| `excludeMethods` | `['OPTIONS']` | Not used to filter methods |
| `excludeTags` | `[]` | Not used to filter tags |

Treat your hand-written `documentation` as authoritative; don't assume these options change the spec automatically.

## Best Practices

1. Extract `documentation` into its own module (e.g. `openapi.ts`) and review it together with route changes
2. If you need to generate OpenAPI from code, see [OpenAPI integration](/en/integrations/openapi) or build your own generator, then pass the result into `documentation`
3. In production, restrict the UI to your internal network, or expose only `specPath` for gateway aggregation
4. Scalar suits modern reading; use `swagger-ui` when you need the classic Try-it-out
5. Use `components.schemas` + `$ref` to avoid pasting the same model into every path

## Notes

- `defineRoute` is **not** discovered automatically; missing `paths` = a blank UI
- `theme` / `exclude*` / `excludeStaticFile` have essentially no effect on the middleware path
- The UI fetches the spec via the relative path `./json`; when customizing `path`, mind its relationship to `specPath` and set `specPath` explicitly if needed
- The CDNs require internet access (unpkg / jsDelivr); on an internal network, host the assets yourself and change `scalarCDN` (Scalar). Swagger UI's CSS/JS URLs are currently hard-coded to unpkg, so internal networks need a source change or a reverse proxy

## Related Links

- [OpenAPI](/en/integrations/openapi)
- [Routing](/en/routing)
- [Middleware Overview](/en/middleware)
- [OpenAPI 3.0.3](https://swagger.io/specification/v3)
- [Scalar](https://github.com/scalar/scalar)
- [Swagger UI](https://github.com/swagger-api/swagger-ui)
