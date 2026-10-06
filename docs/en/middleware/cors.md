---
title: CORS Middleware - Vafast
description: 'Vafast CORS middleware: configure allowed origins, methods, headers, credentials and preflight caching to handle cross-origin requests safely in your TypeScript API.'
---

# CORS

`@vafast/cors` adds [Cross-Origin Resource Sharing](https://developer.mozilla.org/docs/Web/HTTP/CORS) headers to responses and can handle `OPTIONS` preflight requests automatically (enabled by default).

The defaults are fairly permissive (any origin, reflected methods / headers, credentials allowed). Tighten them to your domains in production.

## Key Concepts (for New Users)

The browser's **same-origin policy** by default prevents a page from reading responses from another origin (different protocol / host / port). CORS is the mechanism by which the server "declares which cross-origin accesses are allowed" via response headers.

| Term | In plain terms |
|------|------|
| **Origin** | E.g. `https://app.example.com:443`. The origin of the frontend page appears in the `Origin` request header |
| **Simple request** | Some GET/POST requests can be sent directly under certain conditions; the browser still checks the CORS headers in the response before letting the frontend read the result |
| **Preflight** | The browser first sends an `OPTIONS` asking "may I use these methods/headers cross-origin?", then sends the real POST/PUT once approved. This package intercepts `OPTIONS` by default and returns `204` |
| **`Access-Control-Allow-Origin` (ACAO)** | Tells the browser which origin may read this response. Either a specific origin or (without credentials) `*` |
| **credentials** | Whether cross-origin requests carry cookies, HTTP auth, TLS client certificates, etc. The frontend needs `fetch(..., { credentials: 'include' })` and the server needs `Access-Control-Allow-Credentials: true` |
| **Why can't credentials be combined with ACAO `*`?** | Per the browser spec, with credentials `Access-Control-Allow-Origin` **must be a specific origin**, not the `*` wildcard. This package's default `origin: true` **echoes** the request's `Origin` so it works with the default `credentials: true` |
| **`Access-Control-Allow-Methods` / `-Headers`** | Declare the allowed methods and request headers during preflight |
| **`Access-Control-Expose-Headers`** | Declares which response headers frontend JS **may read** (many headers are hidden from cross-origin scripts by default) |
| **`Access-Control-Max-Age`** | How many seconds to cache the preflight result, reducing repeated OPTIONS |

## Installation

```bash
npm install @vafast/cors
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(cors())

serve({ fetch: server.fetch, port: 3000 })
```

## Usage

### Basic Usage

We recommend mounting it globally so both business and error responses carry CORS headers (in the onion model, post-processing happens uniformly after `next()`).

```typescript
server.use(cors())
```

You can also attach it to a single route's `middleware`.

### Common Scenarios

#### 1. Allow Specific Frontend Domains

```typescript
server.use(
  cors({
    origin: ['https://example.com', 'https://app.example.com'],
    credentials: true,
  }),
)
```

On a match, `Access-Control-Allow-Origin` is set to the request's `Origin`.

#### 2. Allow Subdomains with a Regex

```typescript
server.use(
  cors({
    origin: /https:\/\/.*\.example\.com$/,
  }),
)
```

The regex runs `RegExp.test` against the `Origin` request header.

#### 3. Dynamic Checks with a Function

```typescript
server.use(
  cors({
    origin: (request) => {
      const origin = request.headers.get('Origin')
      return origin?.endsWith('.example.com') ?? false
    },
  }),
)
```

The function must **explicitly return `true`** to allow (returning `void` / `false` won't).

#### 4. Restrict Methods and Request Headers

```typescript
server.use(
  cors({
    origin: 'https://example.com',
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 600,
  }),
)
```

#### 5. Disable Automatic Preflight

If you implement your own `OPTIONS` routes, turn it off:

```typescript
server.use(cors({ preflight: false }))
```

## API

### Exports

| Export | Description |
|------|------|
| `cors` | Factory function that returns the middleware |
| `default` | Same as `cors` |
| `HTTPMethod` | Literal type of allowed methods (standard and extended names like `GET` / `POST` / `OPTIONS`) |

### Options / Parameters

```typescript
cors(config?: CORSConfig)
```

| Parameter | Type | Default | Description |
|------|------|------|------|
| `origin` | `boolean \| string \| RegExp \| ((request: Request) => boolean \| void) \| Array<string \| RegExp \| function>` | `true` | Controls `Access-Control-Allow-Origin` / `Vary`. See **origin behavior** below |
| `methods` | `boolean \| null \| '' \| '*' \| HTTPMethod \| string \| array` | `true` | `Access-Control-Allow-Methods`. See **methods behavior** |
| `allowedHeaders` | `true \| string \| string[]` | `true` | `Access-Control-Allow-Headers`. Arrays are `join(', ')`-ed first |
| `exposeHeaders` | `true \| string \| string[]` | `true` | `Access-Control-Expose-Headers`. Arrays are `join(', ')`-ed first |
| `credentials` | `boolean` | `true` | When `true`, writes `Access-Control-Allow-Credentials: true` (on both preflight and actual requests) |
| `maxAge` | `number` | — | When set, writes `Access-Control-Max-Age`; **when omitted, the header is not written** |
| `preflight` | `boolean` | `true` | When `true`, intercepts `OPTIONS` and returns `204` + CORS headers directly, without reaching later routes |

#### `origin` Behavior (Matches the Source)

| Value | Behavior |
|----|------|
| `true` (default) | Sets `Vary: *`; `Access-Control-Allow-Origin` = the request's `Origin`, or `*` if there is no `Origin` |
| String | Exact match against the request `Origin`; also compares the host after stripping `://` with the configured string. On a match, echoes that `Origin` and sets `Vary: Origin` (when an origin is configured) |
| Strings in an array | Same as above; any matching string allows |
| `'*'` (in the list, making `anyOrigin` true) | Sets `Access-Control-Allow-Origin: *` and `Vary: *`. **Combined with `credentials: true`, browsers usually reject cross-origin responses with cookies** |
| `RegExp` | Runs `test` on the `Origin` request header; on a match, echoes that `Origin` |
| `Function` | Receives the `Request`; allows and echoes `Origin` only when the return value is **strictly** `true`; `void` / `false` don't allow |
| Array (mixed) | Tries each rule above in order; any match allows |
| `false` / empty array etc. leaving no usable rule | May not set a valid ACAO (cross-origin frontends can't read the response) |

> The type comment saying "`origin: true` is the same as `*`" is **inaccurate**: the implementation **echoes the request Origin** (only `*` when there is no Origin) to stay compatible with the default `credentials: true`. The table in this section is authoritative.

#### `methods` Behavior

| Value | Behavior |
|----|------|
| `true` (default) | Preflight mirrors the `Access-Control-Request-Method` header; actual requests mirror the current `request.method` |
| `'*'` | Always writes `Access-Control-Allow-Methods: *` |
| A single method / comma-separated string | Written as is |
| Array of methods | Written after `join(', ')` |
| `false` / `null` / `''` / empty array | Header not set |

#### `allowedHeaders` / `exposeHeaders`

| Value | Behavior |
|----|------|
| `true` (default) | **Preflight**: `allowedHeaders` mirrors `Access-Control-Request-Headers`; `exposeHeaders` uses the current request's header names. **Actual requests**: both use the current request's header names |
| String | Written directly to the corresponding response header |
| String array | Joined into a comma-separated string, then written |

### Related Functions

No extra helper functions. Preflight responses use the framework's `empty(204)`.

Internally the middleware has a preflight helper equivalent to the main branch; only `cors()` is exposed.

## Best Practices

1. In production, narrow `origin` to an allowlist (string array or function) instead of the default "any origin + credentials"
2. For cross-origin cookies: `credentials: true`, and ACAO **must be a specific origin**; use an allowlist or the default "echo Origin", not `'*'` in the list
3. On the frontend: `fetch(url, { credentials: 'include' })` (or axios `withCredentials: true`), otherwise the browser won't send cookies
4. List `methods` / `allowedHeaders` explicitly to tighten the preflight cache and attack surface
5. Set a reasonable `maxAge` to reduce preflight frequency
6. If the frontend needs to read custom response headers (e.g. `X-Request-Id`), add them to `exposeHeaders`

## Notes

- With `preflight: true`, every `OPTIONS` is terminated by this middleware and never reaches later routes
- The JSDoc for `maxAge` once said the default was `5`; **the source sets no default**: the header is only written when you pass a number
- The actual-request path doesn't swallow handler errors; CORS headers are added to the response returned by errorHandler (as long as it still passes through this post-processing)
- With `credentials: true`, browsers require ACAO to be a specific origin; forcing `origin: '*'` (or an array containing `'*'` that triggers anyOrigin) may conflict with credentials
- When debugging locally, the frontend origin (e.g. `http://localhost:5173`) must exactly match the allowlist string (including protocol and port)

## Related Links

- [Helmet](/en/middleware/helmet)
- [Cookie](/en/middleware/cookie) — cross-origin sessions are often used with credentials
- [Middleware System](/en/middleware/overview)
- [MDN · CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS)
