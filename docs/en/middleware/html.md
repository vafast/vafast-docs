---
title: HTML Middleware - Vafast
description: 'Vafast HTML middleware: return HTML responses with the correct Content-Type, render JSX or template strings and stream HTML from your route handlers.'
---

# HTML

`@vafast/html` attaches `req.html` to the request, providing `html()` / `stream()` for returning HTML together with [@kitajs/html](https://github.com/kitajs/html).

::: warning Don't return HTML strings directly
The framework treats a plain `string` as **`text/plain`**. You must `return req.html.html(...)` (or build a `Response` with `Content-Type: text/html` yourself).
:::

## Installation

```bash
npm install @vafast/html
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { html } from '@vafast/html'

type HtmlRequest = Request & {
  html: {
    html: (value: string | JSX.Element) => Response | string | Promise<Response | string>
  }
}

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: ({ req }) => {
      return (req as HtmlRequest).html.html(`
        <!doctype html>
        <html>
          <body><h1>Hello</h1></body>
        </html>
      `)
    },
  }),
])

const server = new Server(routes)
server.use(html())
serve({ fetch: server.fetch, port: 3000 })
```

## Usage

### Global Mounting

```typescript
server.use(html())
// routes still need to call req.html.html(...)
```

### Route-Level Mounting

```typescript
defineRoute({
  method: 'GET',
  path: '/page',
  middleware: [html()],
  handler: ({ req }) => (req as HtmlRequest).html.html('<html><body>Hi</body></html>'),
})
```

### `req.html.html(value)`

Renders a string / JSX and returns a `Response` with `content-type`. If `autoDoctype` is on and the content starts with `<html`, `<!doctype html>` is prepended automatically.

### `req.html.stream(fn, args)`

Streaming rendering based on `@kitajs/html/suspense`:

```typescript
handler: ({ req }) => {
  return (req as HtmlRequest & {
    html: {
      stream: (
        fn: (arg: { id: number; title: string }) => JSX.Element,
        args: { title: string },
      ) => Response | Promise<Response>
    }
  }).html.stream(
    ({ id, title }) => `<html><body><h1>${title} #${id}</h1></body></html>`,
    { title: 'Stream' },
  )
}
```

### Auto Detection (`autoDetect`)

Enabled by default: if the downstream `Response` is already `text/html`, it is rewritten to the configured `contentType`.

It does **not** magically turn plain strings returned by a handler into HTML.

### Other Exports

```typescript
import {
  html,           // alias of createHtmlPlugin
  createHtmlPlugin,
  Html,           // @kitajs/html
  createElement,
  ErrorBoundary,
  isHtml,
} from '@vafast/html'
```

## Full API Parameters

### `html(options?)` / `createHtmlPlugin(options?)`

```typescript
html(options?: HtmlOptions): Middleware
```

### `HtmlOptions`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `contentType` | `string` | `'text/html; charset=utf8'` | Content-Type for HTML responses |
| `autoDetect` | `boolean` | `true` | Normalize content-type when downstream already returned an HTML Response |
| `autoDoctype` | `boolean \| 'full'` | `true` | Prepend a doctype to content rendered via `html()` / `stream()` that starts with `<html` |
| `isHtml` | `(value: string) => boolean` | Built-in `isHtml` | Whether a string looks like HTML (length ≥ 7, starts with `<`, ends with `>`) |

### `req.html` Methods

| Method | Description |
|------|------|
| `html(value)` | `value`: string / Readable / JSX; returns an HTML `Response` |
| `stream(fn, args)` | `fn` receives `args & { id }`; streaming render |

## Best Practices

- Always `return req.html.html(...)`, never `return '<html>...'`  
- Prefer `stream` for SSR / large pages  
- For JSX projects, combine with `@kitajs/html` and the TypeScript JSX config  
- A single global `server.use(html())` is enough; avoid mounting it multiple times

## Notes

- **A string return value = `text/plain`**; this is framework behavior, not a bug  
- In the type comments, `autoDoctype: 'full'` means "add a doctype even for returns not produced by the plugin", but the current middleware's main path does **not** convert plain string returns; always go through `req.html.html()`  
- `autoDetect` only handles `Response`s that are already HTML; it doesn't change plain text  
- The middleware attaches the object to `(req as any).html`; on the TypeScript side, define your own `HtmlRequest` type

## Related Links

- [Handler](/en/essential/handler)
- [Middleware Overview](/en/middleware)
