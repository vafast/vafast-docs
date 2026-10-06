---
title: Cookie Middleware - Vafast
description: 'Vafast cookie middleware: parse, set, sign and clear cookies with type safety, including secure, httpOnly, sameSite and expiry options for TypeScript web apps.'
---

# Cookie

`@vafast/cookie` handles **parsing request cookies**, **HMAC signature verification**, and **writing `Set-Cookie`** back via `CookieJar`.

Read with the middleware (`cookies` / `signedCookies`); write with `createCookieJar`. There are no `cookie()` / `setCookie()` style exports.

## Key Concepts (for New Users)

| Term | In plain terms |
|------|------|
| **Cookie** | A small key/value the browser stores per domain and sends automatically on later requests (subject to Path / Domain / Secure / SameSite, etc.) |
| **`Set-Cookie`** | The header the server uses to write cookies in the **response**; this package appends it with `CookieJar.apply(response)` |
| **`Cookie` request header** | The existing cookies sent by the browser; parsed by `cookies()` / `signedCookies()` |
| **`expires` vs `maxAge`** | Two ways to set expiry. `maxAge` is "how many **seconds** from now"; `expires` is "the exact moment it expires" (a `Date` or timestamp). You can set both; browser behavior varies, and `Max-Age` usually takes precedence |
| **SameSite** | Controls whether cookies are sent on cross-site requests, to mitigate CSRF. See the table below |
| **Signed cookie** | The value looks like `original.HMACsignature`. The server can detect tampering, but it is **not encryption**: the original is still readable. Don't rely on signing alone for secrets |
| **Encryption** | This package does **not** encrypt; if the payload must be secret, encrypt it yourself before `set`, or use a server-side session + random session id |

### Which SameSite Should I Choose?

| Value | In plain terms | Common use |
|----|------|----------|
| `Strict` | Cookies are only sent on **same-site** navigation; not even when arriving via a link from another site | Highly sensitive actions; may break "stay logged in when arriving from an external link" |
| `Lax` | Sent on all same-site requests; cross-site, sent on **top-level** GET navigation (clicking a link) but generally not on cross-site POST / iframe / XHR | The default first choice for most login sessions |
| `None` | Sent on cross-site requests too; **must also** have `secure: true` (HTTPS only), or the browser rejects it | Cross-subdomain frontends, third-party embeds that really need cookies |

### Why Does Deleting a Cookie Often "Not Work"?

Browsers match the cookie to overwrite by **name + Domain + Path** (and more). `delete` must use the **same** `path` / `domain` as when it was written; otherwise you just write a different expired cookie and the original remains.

## Installation

```bash
npm install @vafast/cookie
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { cookies, createCookieJar } from '@vafast/cookie'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/theme',
    middleware: [cookies()],
    handler: ({ cookies: jar }) => json({ theme: jar.theme ?? 'light' }),
  }),
  defineRoute({
    method: 'POST',
    path: '/theme',
    handler: () => {
      const jar = createCookieJar()
      // theme preference must be readable by frontend JS: explicitly disable httpOnly
      jar.set('theme', 'dark', { maxAge: 3600, httpOnly: false })
      return jar.apply(json({ ok: true }))
    },
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

## Usage

### Basic Usage

`cookies()` parses the `Cookie` header and also:

- attaches it to `req.cookies`
- injects it into the context via `next({ cookies })`

```typescript
const server = new Server(routes)
server.use(cookies())
```

### Common Scenarios

#### 1. Signed Cookies (Tamper-Proof Sessions)

```typescript
import { signedCookies, createCookieJar } from '@vafast/cookie'
import { Server, defineRoute, defineRoutes, err, json, serve } from 'vafast'

const secret = process.env.COOKIE_SECRET!

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    handler: () => {
      const jar = createCookieJar(secret)
      jar.setSigned('userId', 'u_1', {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 7 * 24 * 3600,
      })
      return jar.apply(json({ ok: true }))
    },
  }),
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [signedCookies({ secret })],
    handler: ({ signedCookies: signed }) => {
      if (!signed.userId) throw err.unauthorized('Please log in first')
      return json({ userId: signed.userId })
    },
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

How `signedCookies` behaves:

- Signature verified → goes into `signedCookies` (value is the **original unsigned value**)
- Verification fails or unsigned → stays in `cookies`

So: **don't** treat a same-named key in `cookies` as trusted data.

#### 2. Reading and Writing Theme and Session Together

```typescript
defineRoute({
  method: 'GET',
  path: '/me',
  middleware: [signedCookies({ secret })],
  handler: ({ cookies: plain, signedCookies: signed }) =>
    json({
      theme: plain.theme,
      userId: signed.userId,
    }),
})
```

#### 3. Deleting a Cookie (Logout)

```typescript
defineRoute({
  method: 'POST',
  path: '/logout',
  handler: () => {
    const jar = createCookieJar(secret)
    // path / domain must match those used with set / setSigned
    jar.delete('userId', { path: '/' })
    return jar.apply(json({ ok: true }))
  },
})
```

`delete` writes an empty value, `Max-Age=0` and a past `Expires` (`new Date(0)`), prompting the browser to discard it.

#### 4. `expires` and `maxAge` Examples

```typescript
const jar = createCookieJar()

// 1 hour from now
jar.set('a', '1', { maxAge: 3600 })

// a specific absolute expiry time
jar.set('b', '2', { expires: new Date('2030-01-01T00:00:00Z') })

// a millisecond timestamp also works
jar.set('c', '3', { expires: Date.now() + 60_000 })
```

#### 5. Manual sign / unsign

You can also use the utility functions directly, without the middleware:

```typescript
import { sign, unsign } from '@vafast/cookie'

const signed = sign('u_1', secret) // value.signature (HMAC base64url)
const raw = unsign(signed, secret) // 'u_1' or null (verification failed)
```

`unsign` uses `timingSafeEqual` for constant-time comparison, reducing the risk of timing attacks.

## API

### Exports

| Export | Description |
|------|------|
| `cookies` | Middleware that parses regular cookies |
| `signedCookies` | Middleware that parses and verifies signed cookies |
| `createCookieJar` | Creates a `CookieJar` |
| `CookieJar` | Response-side cookie builder class |
| `parseCookies` | Parses a `Cookie` header string → `Record<string, string>` |
| `serializeCookie` | Serializes a single `Set-Cookie` value |
| `sign` / `unsign` | HMAC sign / verify |
| `CookieOptions` | Write options type |
| `SignedCookiesOptions` | `signedCookies` options type |

### Options / Parameters

#### `cookies()`

No parameters. Parses the `Cookie` request header, sets `req.cookies` and calls `next({ cookies })`.

#### `signedCookies(options)`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `secret` | `string` | — | **Required**. HMAC key; always use a strong random string from an environment variable |
| `algorithm` | `string` | `'sha256'` | Algorithm name passed to `crypto.createHmac` |

#### `createCookieJar(secret?, algorithm?)`

| Parameter | Type | Default | Description |
|------|------|------|------|
| `secret` | `string` | — | Required when calling `setSigned`; can be omitted if you only `set` regular cookies |
| `algorithm` | `string` | `'sha256'` | Signing algorithm; keep it consistent with `signedCookies` |

#### `CookieOptions` (`set` / `setSigned` / `serializeCookie`)

| Parameter | Type | Default | Description |
|------|------|------|------|
| `expires` | `Date \| number` | — | Absolute expiry; a `number` becomes `new Date(number)`. Serialized as `Expires=...` (UTC string) |
| `maxAge` | `number` | — | Relative lifetime in seconds, serialized as `Max-Age=...` |
| `domain` | `string` | — | `Domain=...`. Defaults to the current host (excluding subdomains) when unset. Must match when deleting |
| `path` | `string` | `'/'` | `Path=...`. Determines which paths send the cookie. Must match when deleting |
| `secure` | `boolean` | `false` (no Secure attribute) | When `true`, sent over HTTPS only. Browsers usually require it with `SameSite=None` |
| `httpOnly` | `boolean` | `true` | Writes `HttpOnly` by default, blocking `document.cookie` access; only disabled when you explicitly pass `false` |
| `sameSite` | `'Strict' \| 'Lax' \| 'None'` | — | When omitted, no `SameSite` attribute is written (the browser uses its own default). See above for meanings |

#### `serializeCookie(name, value, options?)`

Encodes a single cookie as a `Set-Cookie` string: `name` / `value` are `encodeURIComponent`-ed; `'/'` is used when `path` is not given; `HttpOnly` is included when `httpOnly !== false`.

#### `parseCookies(cookieHeader)`

| Parameter | Type | Description |
|------|------|------|
| `cookieHeader` | `string \| null` | The raw request header value; `null` / empty returns `{}` |

Values are strings after `decodeURIComponent`.

#### `sign(value, secret, algorithm?)` / `unsign(signedValue, secret, algorithm?)`

| Function | Returns | Description |
|------|------|------|
| `sign` | `string` | `` `${value}.${hmac_base64url}` `` |
| `unsign` | `string \| null` | Returns the original on success; `null` on bad format or signature mismatch |

### Related Methods

#### `CookieJar`

| Method | Description |
|------|------|
| `set(name, value, options?)` | Appends a regular cookie |
| `setSigned(name, value, options?)` | Appends a signed cookie (requires `secret` at construction, otherwise throws) |
| `delete(name, options?)` | Deletes; `options` only supports `domain` / `path` (same as `Pick<CookieOptions, 'domain' \| 'path'>`) |
| `apply(response)` | **Appends** all `Set-Cookie` headers to a new `Response` and returns it; returns the original if there are no cookies |

Chainable: `jar.set(...).setSigned(...).apply(response)`.

## Best Practices

1. Use `signedCookies` + a strong random `secret` (from env) for session data, with the same algorithm on both read and write
2. Enable `secure: true` in production and set `sameSite` explicitly (`Lax` for most sessions; `None` + `Secure` for cross-site cookies)
3. Keep the default `httpOnly: true` unless the frontend must read it (e.g. a theme preference)
4. Always call `jar.apply(...)` after writing, or nothing appears in the response headers
5. When deleting, pass the same `path` / `domain` used when writing
6. Signing ≠ encryption: users can still decode the original, so don't keep secrets like passwords only in cookies

## Notes

- `signedCookies` puts values that **fail verification** into regular `cookies`; don't treat same-named keys in `cookies` as trusted
- `setSigned` throws if no `secret` was provided
- Values are `decodeURIComponent`-ed when parsing; invalid encodings may cause runtime exceptions
- Depends on Node `crypto` (HMAC / `timingSafeEqual`)
- This package provides no cookie encryption API; encrypt yourself or use a server-side session if you need confidentiality

## Related Links

- [JWT](/en/middleware/jwt) — tokens are often stored in cookies
- [CORS](/en/middleware/cors) — cross-origin cookies need correct credentials / origin config
- [Middleware System](/en/middleware/overview)
