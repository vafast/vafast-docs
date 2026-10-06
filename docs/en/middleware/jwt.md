---
title: JWT Middleware - Vafast
description: 'Vafast JWT middleware: sign and verify JSON Web Tokens, configure secrets, algorithms and expiry, and protect routes with type-safe token payloads in your handlers.'
---

# JWT

`@vafast/jwt` is built on [jose](https://github.com/panva/jose) and provides JWT **signing (sign)** and **verification (verify)**.

`jwt(options)` returns a middleware that attaches `{ sign, verify }` to a field on the request object (default `req.jwt`). By itself it does **not** block unauthenticated requests and does not inject a `user` automatically; the auth logic is up to you, in the handler or a custom middleware.

## Key Concepts (for New Users)

### What Is a JWT?

A JWT (JSON Web Token) is a **string token** passed between client and server. It typically looks like this:

```text
xxxxx.yyyyy.zzzzz
 │      │      └─ Signature: computed with the key, prevents tampering
 │      └─ Payload: business data + standard claims, Base64URL-encoded (readable, but not encrypted)
 └─ Header: metadata such as the algorithm, also Base64URL
```

Key points:

- **Readable ≠ secure**: anyone can decode and read the payload. Never put passwords, keys or card numbers in it.
- **The signature prevents tampering**: if the payload changes, the signature no longer matches and `verify` fails.
- **Not an auto-login middleware**: this package only gives you `sign` / `verify`; when to return 401 and how to read cookies / Bearer tokens is up to you.

### What Are JOSE / Claims / Header?

| Term | In plain terms |
|------|------|
| **JOSE** | Umbrella term for JSON Object Signing and Encryption; JWT signing/verification usually uses its JWS (signature) part |
| **Claim** | A field in the payload. There are standard claims (e.g. the `exp` expiry) and you can add business fields (e.g. `userId`) |
| **Protected Header** | JWT header parameters that tell the verifier "which algorithm, which key" and so on. Common ones are `alg`, `typ`, `kid` |

Standard claims are defined in [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519).

### How Is This Package Mounted?

```typescript
const jwtMiddleware = jwt({ secret: '...', exp: '7d' })
// then, in a handler:
await req.jwt.sign({ userId: 'u_1' })
await req.jwt.verify(token)
```

You must mount the middleware on the routes that call these methods (or via `server.use`); otherwise `req.jwt` doesn't exist.

## Installation

```bash
npm install @vafast/jwt
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { jwt } from '@vafast/jwt'

const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET!,
  // issuer: marks "who issued this token"
  iss: 'my-app',
  // default expiry: 7 days (seconds or a Unix timestamp also work, see exp below)
  exp: '7d',
})

type JwtRequest = Request & {
  jwt: {
    sign: (data: { userId: string }) => Promise<string>
    verify: (token?: string) => Promise<{ userId?: string } | false>
  }
}

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    middleware: [jwtMiddleware],
    handler: async ({ req }) => {
      const token = await (req as JwtRequest).jwt.sign({ userId: 'u_1' })
      return json({ token })
    },
  }),
  defineRoute({
    method: 'GET',
    path: '/me',
    middleware: [jwtMiddleware],
    handler: async ({ req }) => {
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
      const payload = await (req as JwtRequest).jwt.verify(token)
      if (!payload) return json({ error: 'Unauthorized' }, 401)
      return json({ userId: payload.userId })
    },
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

Notes:

- You must mount `jwtMiddleware` on the routes that call `sign` / `verify` (or via `server.use`)
- The package attaches methods by modifying the `Request`; the example uses `JwtRequest` for typing (don't rely on implicit `any`)

## Usage

### Basic Usage

Mount it globally once and every route can use `req.jwt`:

```typescript
const server = new Server(routes)
server.use(jwt({ secret: process.env.JWT_SECRET!, exp: '1h' }))
```

Or mount it only on the routes that sign / verify:

```typescript
defineRoute({
  method: 'GET',
  path: '/profile',
  middleware: [jwtMiddleware],
  handler: async ({ req }) => {
    // ...
  },
})
```

### Common Scenarios

#### 1. Constrain the Payload with a TypeBox Schema

`schema` uses TypeBox to validate the payload:

- `sign`: mismatch → **throws** `JWT payload does not match schema`
- `verify`: mismatch → returns **`false`** (doesn't throw)
- Standard claims added by jose, like `iss` / `exp` / `iat`, won't falsely fail your business schema (it tries both the "full payload" and "business fields without standard claims")

```typescript
import { Type } from 'vafast'
import { jwt } from '@vafast/jwt'

const Payload = Type.Object({
  userId: Type.String(),
  role: Type.Union([Type.Literal('user'), Type.Literal('admin')]),
})

const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET!,
  exp: '1h',
  schema: Payload,
})
```

#### 2. Write the JWT to a Cookie After Login

```typescript
import { json } from 'vafast'

defineRoute({
  method: 'POST',
  path: '/login',
  middleware: [jwtMiddleware],
  handler: async ({ req }) => {
    const token = await (req as JwtRequest).jwt.sign({ userId: 'u_1' })
    return json(
      { ok: true },
      200,
      {
        'Set-Cookie': `auth=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
      },
    )
  },
})
```

In browser scenarios, we recommend managing cookies with [@vafast/cookie](/en/middleware/cookie).

#### 3. Do Your Own Auth in the Route

Annotate your auth middleware with a context generic; when it's attached as `middleware` on **the same leaf route**, the handler can infer `user` directly:

```typescript
import { defineMiddleware, err } from 'vafast'

type AuthUser = { id: string }

const requireUser = defineMiddleware<{ user: AuthUser }>(async (req, next) => {
  const header = req.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const payload = await (req as JwtRequest).jwt.verify(token)
  if (!payload?.userId) throw err.unauthorized('Please log in first')
  return next({ user: { id: payload.userId } })
})

defineRoute({
  method: 'GET',
  path: '/profile',
  middleware: [jwtMiddleware, requireUser],
  handler: ({ user }) => json({ id: user.id }), // user is typed
})
```

You can also extract the token with [@vafast/bearer](/en/middleware/bearer) first, then `verify`.

#### 4. Use `withContext` for Nested Routes / Split Files (Type-Safe)

`@vafast/jwt` **does not inject** a `user` itself; it only attaches `sign` / `verify`.  
`withContext` solves a different problem: after your own auth middleware injects context via `next({ user })`, if **the middleware is on the parent and child routes live in `children` or other files**, TypeScript **can't infer** the fields injected by the parent.

| Scenario | Need `withContext`? |
|------|----------------------|
| Only using `req.jwt.sign` / `verify` | **No**. Keep annotating with `JwtRequest` (or a small helper) |
| `middleware: [jwt, requireUser]` on **the same leaf route** | **Usually not**. Annotate `defineMiddleware<{ user }>` with the generic and it's inferred |
| Auth on a group route, leaves in `children` / reused across files | **Yes**. Wrap a route definer with `withContext<{ user }>()` |

```typescript
import { withContext, defineRoute, defineRoutes, defineMiddleware, err } from 'vafast'

type AuthUser = { id: string }

const requireUser = defineMiddleware<{ user: AuthUser }>(async (req, next) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const payload = await (req as JwtRequest).jwt.verify(token)
  if (!payload?.userId) throw err.unauthorized('Please log in first')
  return next({ user: { id: payload.userId } })
})

// pure type wrapper, zero runtime cost
const defineAuthedRoute = withContext<{ user: AuthUser }>()

const profileRoute = defineAuthedRoute({
  method: 'GET',
  path: '/profile',
  handler: ({ user }) => json({ id: user.id }), // child routes get the types too
})

defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [jwtMiddleware, requireUser], // injected at runtime by the parent
    children: [profileRoute],                 // types are wired up by withContext
  }),
])
```

For a fuller explanation, see [Best Practices · withContext](/en/essential/best-practice#9-use-withcontext-to-wrap-type-safe-routes) and [Middleware · withContext](/en/middleware#parent-middleware-type-injection-withcontext).  
If you use a separate auth service, you can use the built-in `defineAuthRouteWithApp` and friends from [@vafast/auth-middleware](/en/middleware/auth-middleware) instead of writing it by hand.

#### 5. Multiple Keys (access / refresh)

Just use different `name`s to mount multiple instances:

```typescript
const accessJwt = jwt({
  name: 'accessToken',
  secret: process.env.JWT_ACCESS_SECRET!,
  exp: '15m',
})

const refreshJwt = jwt({
  name: 'refreshToken',
  secret: process.env.JWT_REFRESH_SECRET!,
  exp: '7d',
})

defineRoute({
  method: 'POST',
  path: '/auth/refresh',
  middleware: [accessJwt, refreshJwt],
  handler: async ({ req }) => {
    // after mounting, the field name = name:
    // (req as Request & { accessToken: ...; refreshToken: ... })
  },
})
```

#### 6. Configure Standard Claims (issuer / audience / expiry)

```typescript
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET!,
  // who issued it
  iss: 'https://api.example.com',
  // who it's issued for (can be an array)
  aud: 'https://app.example.com',
  // default subject (usually overridden per user at sign time)
  sub: undefined,
  // expires in 1 hour
  exp: '1h',
  // valid immediately (a future time means "usable only from then on")
  nbf: '0s',
})

// default claims can be overridden at sign time:
await req.jwt.sign({
  userId: 'u_1',
  sub: 'u_1',
  aud: 'admin-console',
  exp: '5m',
})
```

## API

### Exports

| Export | Description |
|------|------|
| `jwt` | Factory function: takes options, returns the middleware |
| `default` | Same as `jwt` |
| `JWTOption` | Options type for `jwt(...)` (business options + standard claims + header) |
| `JWTPayloadSpec` | Standard payload claims type (`iss` / `sub` / `aud` / …) |
| `JWTHeaderParameters` | Protected header type (`alg` / `typ` / `kid` / …) |

### Call Signature

```typescript
jwt(options: JWTOption)
```

The options fall into three groups: **this package's business options**, **standard payload claims**, and **JOSE header parameters**.

---

### Business Options

| Parameter | Type | Default | Description |
|------|------|------|------|
| `secret` | `string \| Uint8Array \| JWK` | — | **Required**. The signing / verification key. An empty value (including an empty string) immediately throws `Secret can't be empty`. A `string` is first converted with `new TextEncoder().encode(secret)` before being passed to jose. In production, use a sufficiently long random string and keep it only in environment variables. |
| `name` | `string` | `'jwt'` | The field name attached to the `Request`. For example, `name: 'accessToken'` → use `req.accessToken.sign` / `verify`. Use different `name`s for multiple tokens (access / refresh). |
| `schema` | `TSchema` (TypeBox) | — | Optional. Constrains the business payload shape. `sign` throws on validation failure; `verify` returns `false`. |

---

### Standard Payload Claims

These fields can be set as **defaults** in `jwt({ ... })`, or passed to each `sign(data)` call to **override the defaults** (fields in `data` win).

| Parameter | Type | Default | Meaning (plain terms) | Details |
|------|------|------|--------------|----------|
| `iss` | `string` | — | **Issuer** | Identifies "who issued this token". Commonly an app name (`'my-app'`) or service URL (`'https://api.example.com'`). Across services, receivers can use it to decide whether to trust the source. See [RFC 7519 §4.1.1](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.1). |
| `sub` | `string` | — | **Subject** | Identifies "who this token is about". Usually the user ID (`'u_123'`). It can coexist with a business `userId` field: some use only `sub`, some use both; pick one convention and stick to it. See [RFC 7519 §4.1.2](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.2). |
| `aud` | `string \| string[]` | — | **Audience** | Identifies "who this token is issued for". A single string or an array of strings (multiple valid recipients). For example, an API gateway accepts only tokens with `aud === 'api'`, so admin-console tokens can't be misused on the public API. See [RFC 7519 §4.1.3](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.3). |
| `jti` | `string` | — | **JWT ID, unique token ID** | Gives each token a unique ID. Commonly used for logout blocklists, one-time tokens and audit trails. This package has no built-in blocklist storage; record revoked `jti`s on the server yourself. See [RFC 7519 §4.1.7](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.7). |
| `nbf` | `string \| number` | — | **Not Before** | "Not usable before this time". Verification fails until then. Useful for scheduled activation or leaving headroom for clock skew (e.g. `'0s'` means immediately). See "How to write times" below for formats. See [RFC 7519 §4.1.5](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.5). |
| `exp` | `string \| number` | — | **Expiration Time** | "Invalid after this point". Strongly recommended to always set. Access tokens commonly use `'15m'` / `'1h'`; refresh tokens `'7d'`. After expiry `verify` returns `false`. See [RFC 7519 §4.1.4](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4). |
| `iat` | `boolean` | Current time written by default | **Issued At** | Controls whether the `iat` claim is written. In the implementation, unless explicitly turned off on the config side or in the `sign` input (`!== false`), `setIssuedAt(new Date())` writes the current time. The default is usually fine; it's useful for auditing, sorting and investigating "when was this issued". See [RFC 7519 §4.1.6](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.6). |

#### How to Write Times (`exp` / `nbf`)

jose's `setExpirationTime` / `setNotBefore` accept several formats. Common ones:

| Format | Example | Meaning |
|------|------|------|
| Relative duration string | `'15m'`, `'1h'`, `'7d'` | 15 minutes / 1 hour / 7 days from now |
| Seconds string | `'60s'`, `'0s'` | In 60 seconds / immediately |
| Number | Unix timestamp (seconds) or a numeric form jose accepts | An absolute point in time |

Tip for beginners: use relative durations (`'15m'`, `'7d'`) in production config; they're readable and avoid mistakes with absolute timestamps.

#### Claim Override Rules (Important)

```typescript
jwt({ iss: 'my-app', exp: '1h' })

// iss/exp not passed → config defaults are used
await req.jwt.sign({ userId: 'u_1' })

// same-named fields passed → override the defaults
await req.jwt.sign({ userId: 'u_1', iss: 'admin-service', exp: '5m' })
```

`nbf` / `exp`: only written to the JWT when "at least one of `data` or the default config has a value".  
`iat`: see the table above; the current time is written by default.

---

### JOSE Header Parameters (Protected Header)

The header describes "how this JWT is signed and with which key". Most apps only care about `alg` and `typ`; the rest are used for key rotation, multiple keys and certificate systems.

| Parameter | Type | Default | Meaning (plain terms) | Details |
|------|------|------|--------------|----------|
| `alg` | `string` | `'HS256'` | **Algorithm** | Defaults to the symmetric HS256 (the same `secret` signs and verifies), the simplest to start with. Asymmetric algorithms (e.g. `RS256`) need a key pair and suit "verification by multiple parties, private key never leaves the issuer". The algorithm and key type must match, or signing/verification fails. See [jose algorithms](https://github.com/panva/jose/issues/210#jws-alg). |
| `typ` | `string` | `'JWT'` | **Type** | Usually keep `'JWT'`. Tells the receiver "this is a JWT". Rarely needs changing. |
| `kid` | `string` | — | **Key ID** | When rotating multiple keys, `kid` marks "which key signed this token", so the verifier picks the right public/secret key. Can be ignored with a single key. |
| `jwk` | `JWK` | — | **JSON Web Key** | Puts the public key in the header as a JWK object (rare; more often published at a JWKS endpoint). For advanced integrations. |
| `jku` | `string` | — | **JWK Set URL** | A URL pointing to a set of public keys (JWKS). Receivers can fetch it to find the key. You must trust the URL; beware of SSRF / supply chain risks. |
| `x5c` | `string[]` | — | **X.509 certificate chain** | Carries public key material as a certificate chain. Used in enterprise PKI / some federated login setups. |
| `x5t` | `string` | — | **X.509 certificate thumbprint (SHA-1)** | The certificate's thumbprint, for quick identification. |
| `x5u` | `string` | — | **X.509 URL** | A URL pointing to the certificate (chain). |
| `cty` | `string` | — | **Content Type** | Declares the payload content type. Only needed in special cases like nested JWTs. |
| `crit` | `string[]` | — | **Critical** | Lists extension header names that "the receiver must understand or reject the token". Used to enforce extension semantics. |
| `b64` | `true` | — | **RFC 7797 payload encoding switch** | Related to [RFC 7797](https://www.rfc-editor.org/rfc/rfc7797): affects whether the payload is Base64URL-encoded as usual. Leave it alone for normal JWT login; keep the default. |

Optional header fields that aren't set are not written; `alg` / `typ` have safe defaults.

---

### Methods After Mounting

Once the middleware is created and mounted, `req[name]` (default `req.jwt`) has:

#### `sign(data) => Promise<string>`

Signs and returns a JWT string.

Steps:

1. If `schema` is configured, validate `data` with `Value.Check` first; on failure, throw `JWT payload does not match schema`
2. Merge the default claims / header with `data` (claims in `data` win)
3. Write `nbf` / `exp` / `iat` per the rules
4. Sign with `secret` and return the JWT string

`data` type: business fields + optional standard claims (`iss` / `sub` / `aud` / `jti` / `nbf` / `exp` / `iat`).

#### `verify(jwt?) => Promise<payload | false>`

Verifies a JWT.

| Case | Return value |
|------|--------|
| No token / empty string | `false` |
| jose throws for a bad signature, expiry, `nbf` not reached, malformed token, etc. | `false` (**not thrown to your code**) |
| `schema` configured and business fields don't match | `false` |
| Success | The payload object (business fields + standard claims) |

Always handle `false` explicitly in your code (return 401 or throw `err.unauthorized`); never assume "having a token means it's valid".

## Best Practices

1. **Keep `secret` in environment variables only**; in production use a sufficiently long random string (e.g. 32+ bytes). Never commit it to Git.
2. **Short expiry for access tokens, long for refresh tokens**; use different `name` + different `secret` for the two.
3. **Put only the necessary fields in the payload** (e.g. `userId`, `role`). Keep sensitive data in server sessions / the database.
4. Use **`schema`** to keep signing and verification shapes consistent and avoid "field drift".
5. When storing JWTs in cookies, add **`HttpOnly` + `Secure` + `SameSite`**; evaluate `SameSite=None` carefully for cross-site cases.
6. If you need revocation, add a **`jti`** to tokens and maintain a blocklist / version number on the server.
7. In multi-service architectures, configure **`iss` / `aud`** explicitly so tokens can't be reused on the wrong service.
8. When you write your own `next({ user })` and split routes into `children` / multiple files, use **`withContext`** for handler types; don't mistake `withContext` for a required step of the jwt package.

## Notes

- This package only provides utilities: it does **not** return 401 automatically and does **not** inject user context
- `verify` returns `false` on failure instead of throwing; handle it explicitly in your code
- An empty `secret` throws immediately **when the middleware is created** (not on the first request)
- The payload **can be decoded and read**; the signature only prevents tampering, not viewing, so HTTPS is still required
- You need to extend the type of `req.jwt` yourself (e.g. `JwtRequest` in the examples); `withContext` **cannot** replace this step
- The default algorithm is **HS256 (symmetric key)**; when changing `alg`, make sure the `secret` / key material matches the algorithm

## Related Links

- [Bearer](/en/middleware/bearer) — extract the token from the request
- [Cookie](/en/middleware/cookie) — pass the JWT via cookies
- [Auth Middleware](/en/middleware/auth-middleware) — production auth and `defineAuthRouteWithApp`
- [withContext](/en/essential/best-practice#9-use-withcontext-to-wrap-type-safe-routes) — context types across children
- [Middleware System](/en/middleware/overview)
- [jose](https://github.com/panva/jose) · [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
