---
title: Static - Vafast
description: 'Vafast static middleware: serve static files and assets from a directory with caching headers, index files, custom prefixes and safe path handling.'
---

# Static

`@vafast/static` is **not** `server.use` middleware. It scans a directory asynchronously and returns a set of **`Route[]`** that you merge into `new Server([...])`.

## Installation

```bash
npm install @vafast/static
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { staticPlugin } from '@vafast/static'

const staticRoutes = await staticPlugin({
  assets: 'public',
  prefix: '/public',
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server([...staticRoutes, ...routes])
serve({ fetch: server.fetch, port: 3000 })
```

For example, `public/logo.png` → `GET /public/logo.png`.

## Usage

### Mounting at the Root Path

`prefix: '/'` is treated as no prefix:

```typescript
const staticRoutes = await staticPlugin({
  assets: 'public',
  prefix: '/',
})
```

### Pre-Register Every File in Production

```typescript
const staticRoutes = await staticPlugin({
  assets: 'public',
  prefix: '/assets',
  alwaysStatic: true,
})
```

### Disabling Cache Headers

```typescript
await staticPlugin({
  assets: 'public',
  noCache: true,
})
```

### Custom Cache-Control

```typescript
await staticPlugin({
  assets: 'public',
  directive: 'public',
  maxAge: 3600,
  headers: {
    'X-Static': '1',
  },
})
```

## API

### Exports

| Export | Description |
|------|------|
| `staticPlugin(options?)` | **async**, returns `Promise<Route[]>` |
| `default` | Same as `staticPlugin` |

### `await staticPlugin(options?)`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `assets` | `string` | `'public'` | Local static directory |
| `prefix` | `string` | `'/public'` | URL prefix; `'/'` means no prefix |
| `staticLimit` | `number` | `1024` | Above this many files, switch to a wildcard route to save memory |
| `alwaysStatic` | `boolean` | `NODE_ENV === 'production'` | Whether to pre-register a static route per file |
| `ignorePatterns` | `(string \| RegExp)[]` | **See below** | Files to ignore |
| `noExtension` | `boolean` | `false` | Register without file extensions (only with `alwaysStatic`) |
| `enableDecodeURI` | `boolean` | `false` | Decode the URL (for dynamic path lookup) |
| `headers` | `Record<string, string>` | `{}` | Extra response headers |
| `noCache` | `boolean` | `false` | When `true`, no ETag / Cache-Control |
| `directive` | Cache-Control directive | `'public'` | E.g. `public` / `private` / `no-cache` |
| `maxAge` | `number \| null` | `86400` | Seconds; `null` adds no max-age |
| `indexHTML` | `boolean` | `true` | Try `index.html` for directories by default |
| `resolve` | `(...paths) => string` | `path.resolve` | Path resolution function |

### `ignorePatterns`: No Arguments vs. Partial Options

In the source, the default for the whole parameter differs from the destructuring default:

| Call | Actual `ignorePatterns` default |
|----------|---------------------------|
| `staticPlugin()` (no arguments) | `[]` |
| `staticPlugin({ assets: 'public' })` or any object passed | `['.DS_Store', '.git', '.env']` |

If you need to ignore system files, passing it explicitly is safer:

```typescript
await staticPlugin({
  assets: 'public',
  ignorePatterns: ['.DS_Store', '.git', '.env', /\.map$/],
})
```

### Route Generation Strategy

- `alwaysStatic === true`, or `ENV === 'production'` and file count `<= staticLimit`: registers a separate `GET` route per file  
- Otherwise: registers a single `${prefix}/*` wildcard route and reads files by path at runtime  

## Best Practices

- You **must** `await staticPlugin(...)`, then spread the returned `Route[]` into `Server`.
- Don't `server.use(staticPlugin(...))`; neither the types nor the usage match.
- In production, watch the file count vs. `staticLimit`; very large directories are better served by a wildcard route to save memory.
- When merging API routes with static routes, watch for path conflicts (a later registration for the same path may override).

## Notes

- The return value is **`Route[]`**, not middleware.
- A missing file throws the package's `NotFoundError`; provide your own 404 / health-check routes.
- `noExtension` only applies to the pre-registration (`alwaysStatic`) path.
- `enableDecodeURI` is only used by the wildcard / dynamic lookup path.

## Related Links

- [Routing](/en/routing)
- [Deployment Guide](/en/patterns/deploy)
- [Middleware System](/en/middleware)
