---
title: Helmet Middleware - Vafast
description: 'Vafast Helmet middleware: set security headers such as CSP, HSTS, X-Frame-Options and referrer policy, with nonce support to harden your TypeScript web app.'
---

# Helmet

`@vafast/helmet` adds common security-related HTTP headers to responses (CSP, HSTS, X-Frame-Options, etc.). It only changes response headers, never business logic.

Calling `vafastHelmet(config?)` returns a middleware: once `next()` yields the business response, it merges the security headers into a new `Response` and returns it.

## Key Concepts (for New Users)

Browsers rely on response headers to decide "can this be embedded in an iframe", "where can scripts load from", "is HTTPS required" and so on. Helmet writes these headers for you in one go, so you don't miss any.

| Term | In plain terms |
|------|------|
| **CSP (Content-Security-Policy)** | Tells the browser **which sources scripts, styles, images, API requests, etc. may load from**. Tightening it greatly reduces the damage of injected XSS scripts |
| **Nonce** | A one-time random string. With `useNonce`, it's written into the CSP and also returned as `X-Nonce`. Inline `<script>` / `<style>` on the page must carry the same nonce to run |
| **HSTS (Strict-Transport-Security)** | Tells the browser: always use HTTPS for this site from now on, and remember it for a while. **This package only writes it when `NODE_ENV === 'production'`**, so local HTTP development doesn't get "locked out" |
| **X-Frame-Options** | Controls whether other pages may embed this site in an `<iframe>`, to prevent clickjacking |
| **Referrer-Policy** | Controls whether the browser sends the full source URL (which may include path and query) when navigating to other sites |
| **Permissions-Policy** | Controls whether the page may use browser features such as camera, microphone and geolocation; an empty array `[]` disables the feature |
| **CORP / COOP** | Cross-Origin Resource Policy / Cross-Origin Opener Policy: restrict who can load your resources and whether popups share a browsing context (related to isolation and security) |
| **Report-To** | Tells the browser which endpoints to send violation/crash reports to (for monitoring) |

You don't need to understand it all at once: the defaults already work; adjust CSP when you add CDNs or third-party scripts.

## Installation

```bash
npm install @vafast/helmet
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { vafastHelmet } from '@vafast/helmet'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(vafastHelmet())
serve({ fetch: server.fetch, port: 3000 })
```

With zero config you get a default CSP, `X-Frame-Options: DENY`, XSS-related headers, Referrer-Policy, Permissions-Policy, CORP/COOP and more; HSTS only appears in production. It also **always** sets `X-Content-Type-Options: nosniff` (cannot be disabled via options).

## Usage

### Global Mounting

```typescript
server.use(vafastHelmet())
```

### Per-Route Mounting

```typescript
defineRoute({
  method: 'GET',
  path: '/secure',
  middleware: [vafastHelmet()],
  handler: () => json({ ok: true }),
})
```

### Custom CSP

The `csp` you pass is **shallow-merged** with the default CSP (only the fields you specify are overridden; the rest keep their defaults):

```typescript
import { vafastHelmet, permission } from '@vafast/helmet'

server.use(
  vafastHelmet({
    csp: {
      defaultSrc: [permission.SELF],
      scriptSrc: [permission.SELF],
      imgSrc: [permission.SELF, permission.DATA, 'https:'],
    },
    frameOptions: 'SAMEORIGIN',
  }),
)
```

### Enabling CSP Nonces

With `csp.useNonce: true`, a nonce is generated, added to `script-src` / `style-src`, and also sent as the `X-Nonce` response header (your app injects this value into the HTML template):

```typescript
server.use(
  vafastHelmet({
    csp: {
      useNonce: true,
      scriptSrc: [permission.SELF],
      styleSrc: [permission.SELF],
    },
  }),
)
```

### Report-Only Mode

Observe violations without blocking loads, useful as a trial run before going live:

```typescript
server.use(
  vafastHelmet({
    csp: {
      reportOnly: true,
      reportUri: '/csp-report',
    },
  }),
)
```

In this mode the header written is `Content-Security-Policy-Report-Only` instead of the enforcing `Content-Security-Policy`.

### Configuring Report-To

```typescript
server.use(
  vafastHelmet({
    reportTo: [
      {
        group: 'csp-endpoint',
        maxAge: 10886400,
        endpoints: [{ url: 'https://example.com/reports' }],
        includeSubdomains: true,
      },
    ],
  }),
)
```

### Extra Custom Headers

```typescript
server.use(
  vafastHelmet({
    customHeaders: {
      'X-App-Version': '1.0.0',
    },
  }),
)
```

## API

### Exports

| Export | Description |
|------|------|
| `vafastHelmet(config?)` | Main entry, returns the middleware |
| `elysiaHelmet` | Compatibility alias for `vafastHelmet` |
| `permission` | Common CSP literal constants (see table below) |
| `SecurityConfig` | Top-level config type |
| `CSPConfig` | CSP sub-config type |
| `HSTSConfig` | HSTS sub-config type |
| `ReportToConfig` | Single Report-To entry type |

### `vafastHelmet(config?: Partial<SecurityConfig>)`

Omitted fields use the defaults; `csp` / `hsts` / `permissionsPolicy` are **shallow-merged** with the default objects when provided.

| Parameter | Type | Default | Description |
|------|------|------|------|
| `csp` | `CSPConfig` | See "Default CSP" and "CSP Directives" below | Content-Security-Policy (or the Report-Only variant) |
| `frameOptions` | `'DENY' \| 'SAMEORIGIN' \| 'ALLOW-FROM'` | `'DENY'` | `X-Frame-Options`. `DENY` = no embedding at all; `SAMEORIGIN` = same-origin only; `ALLOW-FROM` is a legacy value with poor modern browser support, generally avoid it |
| `xssProtection` | `boolean` | `true` | When `true`, writes `X-XSS-Protection: 1; mode=block` (a legacy mechanism for old browsers; modern protection relies mainly on CSP) |
| `dnsPrefetch` | `boolean` | `false` | `X-DNS-Prefetch-Control`: `true` → `on`, `false` → `off` |
| `referrerPolicy` | See enum below | `'strict-origin-when-cross-origin'` | `Referrer-Policy`: controls how much Referer outbound requests carry |
| `permissionsPolicy` | `Record<string, string[]>` | See "Default Permissions-Policy" below | `Permissions-Policy`; an **empty array** for a feature disables it |
| `hsts` | `HSTSConfig` | `{ maxAge: 15552000, includeSubDomains: true, preload: true }` | `Strict-Transport-Security` is **only written when `NODE_ENV === 'production'`** |
| `corp` | `'same-origin' \| 'same-site' \| 'cross-origin'` | `'same-origin'` | `Cross-Origin-Resource-Policy`: who may load this response as a resource |
| `coop` | `'unsafe-none' \| 'same-origin-allow-popups' \| 'same-origin'` | `'same-origin'` | `Cross-Origin-Opener-Policy`: related to isolation from popups / `window.opener` |
| `reportTo` | `ReportToConfig[]` | — | `Report-To` header (JSON); not written when unset |
| `customHeaders` | `Record<string, string>` | — | Extra custom response headers, merged as is |

It also always sets `X-Content-Type-Options: nosniff` (prevents the browser from executing non-script MIME types as scripts).

#### `referrerPolicy` Values

| Value | In plain terms |
|----|------|
| `no-referrer` | Never send Referer |
| `no-referrer-when-downgrade` | Don't send on HTTPS→HTTP; otherwise send the full URL |
| `origin` | Send only the origin (protocol + host + port) |
| `origin-when-cross-origin` | Full URL for same-origin, only the origin for cross-origin |
| `same-origin` | Only same-origin requests carry Referer |
| `strict-origin` | Send only the origin; nothing on HTTPS→HTTP |
| `strict-origin-when-cross-origin` (default) | Full URL for same-origin; only the origin for cross-origin; nothing on downgrade |
| `unsafe-url` | Always send the full URL (may leak path/query; use with care) |

#### Default CSP

| Directive (config field) | Default |
|------------------|--------|
| `defaultSrc` | `[permission.SELF]` (`'self'`) |
| `scriptSrc` | `[permission.SELF, permission.UNSAFE_INLINE]` |
| `styleSrc` | `[permission.SELF, permission.UNSAFE_INLINE]` |
| `imgSrc` | `[permission.SELF, permission.DATA, permission.BLOB]` |
| `fontSrc` | `[permission.SELF]` |
| `connectSrc` | `[permission.SELF]` |
| `frameSrc` | `[permission.SELF]` |
| `objectSrc` | `[permission.NONE]` |
| `baseUri` | `[permission.SELF]` |

`'unsafe-inline'` is included by default so unmodified inline scripts/styles keep working at first; in production, phase it out in favor of nonces or external files.

#### CSP Directives (`CSPConfig`)

Config fields are camelCase and are converted to kebab-case in the header (e.g. `scriptSrc` → `script-src`). Each array entry is an allowed source expression.

| Field | Directive | In plain terms |
|------|----------|------|
| `defaultSrc` | `default-src` | **Fallback**: resource types without their own directive use this |
| `scriptSrc` | `script-src` | Which script sources may run |
| `styleSrc` | `style-src` | Which style sources may load |
| `imgSrc` | `img-src` | Which image sources may load |
| `fontSrc` | `font-src` | Which font sources may load |
| `connectSrc` | `connect-src` | Which origins `fetch` / XHR / WebSocket etc. may connect to |
| `frameSrc` | `frame-src` | Which origins this page may embed as frames / iframes |
| `objectSrc` | `object-src` | Allowed sources for `<object>` / `<embed>` / `<applet>`; default `'none'` |
| `baseUri` | `base-uri` | Restricts what `<base href>` can be set to, preventing base URL hijacking |
| `reportUri` | `report-uri` | Where CSP violation reports are sent (a string, not an array) |
| `useNonce` | — (boolean switch) | When `true`, appends `'nonce-...'` to `script-src` / `style-src` and writes the `X-Nonce` response header |
| `reportOnly` | — (boolean switch) | When `true`, uses `Content-Security-Policy-Report-Only`: report only, don't block |

`useNonce` / `reportOnly` are **not** added to the CSP directive string; they only affect how it's generated.

#### `HSTSConfig`

| Field | Type | Default | Description |
|------|------|------|------|
| `maxAge` | `number` | `15552000` (about 180 days) | How many seconds the browser remembers "HTTPS only". Throws at initialization if `< 0` |
| `includeSubDomains` | `boolean` | `true` | When `true`, appends `; includeSubDomains` so subdomains are forced to HTTPS too |
| `preload` | `boolean` | `true` | When `true`, appends `; preload` (needed for browser preload list submission; don't enable unless the whole site is HTTPS) |

Again: even with `hsts` configured, `Strict-Transport-Security` is **not written outside production**.

#### Default Permissions-Policy

| Feature key | Default | In plain terms |
|--------|------|------|
| `camera` | `[]` | Disable camera |
| `microphone` | `[]` | Disable microphone |
| `geolocation` | `[]` | Disable geolocation |
| `interest-cohort` | `[]` | Disable FLoC / interest-cohort tracking features |

Empty arrays serialize to the "no origins allowed" form, like `camera=()`. To allow your own origin: `{ camera: ["self"] }` (key names follow the browser Permissions-Policy spec).

When you pass `permissionsPolicy`, it's **shallow-merged** with the defaults (only the keys you specify are overridden).

#### `ReportToConfig`

| Field | Type | Required | Description |
|------|------|------|------|
| `group` | `string` | Yes | Endpoint group name |
| `maxAge` | `number` | Yes | Config cache lifetime in seconds; throws at initialization if `< 0` |
| `endpoints` | `Array<{ url: string; priority?: number; weight?: number }>` | Yes | At least one endpoint, otherwise throws at initialization |
| `includeSubdomains` | `boolean` | No | Whether subdomains are included |

Field names are converted to spec JSON when written: `max_age`, `include_subdomains`.

#### `permission` Constants

Prefer these constants when writing CSP arrays to avoid missing quotes:

| Constant | Value | In plain terms |
|------|-----|------|
| `permission.SELF` | `'self'` | Allow the same origin as the current document |
| `permission.UNSAFE_INLINE` | `'unsafe-inline'` | Allow inline scripts/styles (weakens XSS protection; use sparingly) |
| `permission.HTTPS` | `https:` | Allow any HTTPS origin (very broad) |
| `permission.DATA` | `data:` | Allow `data:` URLs (common for small images) |
| `permission.NONE` | `'none'` | Allow no origins |
| `permission.BLOB` | `blob:` | Allow `blob:` URLs |

You can also put specific origins directly in the array, e.g. `'https://cdn.example.com'`.

## Best Practices

- Rely on HSTS only in production; don't force `NODE_ENV=production` locally unless the whole site is already HTTPS.
- Tighten CSP for your app: remove `'unsafe-inline'` where possible and use `useNonce` for inline scripts.
- When third-party pages need to embed you, relax `frameOptions` / `corp` / `coop` as needed to avoid breaking legitimate cross-origin use.
- Try new policies with `csp.reportOnly: true` to collect violations before enforcing them.
- When using CDNs / third-party analytics, add their domains to `scriptSrc` / `connectSrc` / `imgSrc`, or the browser will block them.

## Notes

- HSTS is **only written in production**; outside production the header isn't set even if `hsts` is configured.
- `hsts.maxAge < 0` or an invalid `reportTo` (`maxAge < 0`, empty endpoints) throws **at initialization**.
- The middleware wraps the `Response` after `next()` to write headers; if downstream returns immutable Headers, behavior depends on the runtime.
- `frameOptions: 'ALLOW-FROM'` is obsolete; in modern browsers prefer CSP's `frame-ancestors` (this package's CSP config doesn't expose that directive as a field; use `customHeaders` or tighten other policies if needed).
- The nonce is regenerated on every request; SSR pages must inject that response's `X-Nonce` into the HTML instead of hard-coding it.

## Related Links

- [CORS](/en/middleware/cors)
- [MDN · CSP](https://developer.mozilla.org/docs/Web/HTTP/CSP)
- [MDN · HSTS](https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [Middleware System](/en/middleware)
