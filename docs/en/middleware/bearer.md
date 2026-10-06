---
title: Bearer Middleware - Vafast
description: 'Vafast Bearer middleware: extract Bearer tokens from the Authorization header, query or body per RFC 6750, and pass them to your handlers with full type safety.'
---

# Bearer

`@vafast/bearer` **extracts** the Bearer token from the request per [RFC6750](https://www.rfc-editor.org/rfc/rfc6750) and injects it into the route context via `next({ bearer })`.

It does **not verify signatures or authorize**: when no token is found, `bearer` is `undefined` and no 401 is returned automatically. The verification logic is up to you (for example with [@vafast/jwt](/en/middleware/jwt)).

## Installation

```bash
npm install @vafast/bearer
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, err, json, serve } from 'vafast'
import { bearer } from '@vafast/bearer'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [bearer()],
    handler: ({ bearer: token }) => {
      if (!token) throw err.unauthorized('Missing Bearer token')
      return json({ token })
    },
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

## Usage

### Basic Usage

Extraction order (stops at the first match):

1. `Authorization` header: matches the `header` prefix (default `Bearer`), then takes the token after it
2. Query parameter: field name defaults to `access_token`
3. Request body: for non-`GET` requests, reads the field via `parseBody`, default `access_token`

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Or:

```http
GET /profile?access_token=eyJhbGciOiJIUzI1NiJ9...
```

### Common Scenarios

#### 1. Mount Globally

```typescript
const server = new Server(routes)
server.use(bearer())
```

Every route handler can destructure `bearer` (it is `undefined` when no token is sent).

#### 2. Custom Field Names (Non-Standard APIs)

```typescript
server.use(
  bearer({
    extract: {
      header: 'Token',
      query: 'token',
      body: 'token',
    },
  }),
)
```

This matches `Authorization: Token <value>`, or `?token=` / body `{ "token": "..." }`.

#### 3. Extract, Then Verify with JWT

```typescript
import { jwt } from '@vafast/jwt'
import { bearer } from '@vafast/bearer'
import { err, json } from 'vafast'

const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET!, exp: '1h' })

type JwtRequest = Request & {
  jwt: {
    verify: (token?: string) => Promise<{ userId?: string } | false>
  }
}

defineRoute({
  method: 'GET',
  path: '/me',
  middleware: [jwtMiddleware, bearer()],
  handler: async ({ req, bearer: token }) => {
    const payload = await (req as JwtRequest).jwt.verify(token)
    if (!payload) throw err.unauthorized('Invalid token')
    return json({ userId: payload.userId })
  },
})
```

#### 4. Use `getBearer` in Deeper Logic

After the middleware has run, you can also read it from the request locals:

```typescript
import { getBearer } from '@vafast/bearer'

defineRoute({
  method: 'GET',
  path: '/debug',
  middleware: [bearer()],
  handler: ({ req }) => json({ token: getBearer(req) }),
})
```

## API

### Exports

| Export | Description |
|------|------|
| `bearer` | Factory function that returns the middleware |
| `getBearer` | Reads the extracted token from `req.__locals.bearer` |
| `BearerOptions` | Options type |
| `default` | Same as `bearer` |

### Options / Parameters

```typescript
bearer(options?: BearerOptions)
```

| Parameter | Type | Default | Description |
|------|------|------|------|
| `extract.body` | `string` | `'access_token'` | Field name for the token in the JSON body |
| `extract.query` | `string` | `'access_token'` | Field name for the token in the query |
| `extract.header` | `string` | `'Bearer'` | `Authorization` prefix (followed by a single space and the token) |

Omitting `options` is equivalent to all the defaults above.

### Related Functions

#### `getBearer(req: Request): string | undefined`

Reads the locals written by the middleware. Returns `undefined` if `bearer()` hasn't run yet.

## Best Practices

1. Prefer the `Authorization` header in production; query / body are for compatibility with legacy clients
2. Separate extraction from verification: this package only extracts; verify signatures with JWT or other logic
3. When the token is missing, return explicitly with `err.unauthorized` / `json(..., 401)`, adding `WWW-Authenticate` as needed
4. Body parse failures are silently ignored; don't rely on a malformed body for auth error messages

## Notes

- The token is injected into the **context** (`next({ bearer })`), not `req.bearer`
- The header value is only used when `Authorization` **starts with the configured `header` prefix**
- `GET` requests never attempt to parse the body
- The body is read via `req.clone()` + `parseBody` to avoid consuming the original request stream

## Related Links

- [JWT](/en/middleware/jwt)
- [Middleware System](/en/middleware/overview)
- [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750)
