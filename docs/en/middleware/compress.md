---
title: Compress Middleware - Vafast
description: 'Vafast compress middleware: gzip, deflate and Brotli response compression with thresholds, content-type filters and per-route configuration for faster APIs.'
---

# Compress

`@vafast/compress` compresses the response body before it's sent, based on the client's `Accept-Encoding` request header, to reduce transfer size. Supports **Brotli (`br`) / gzip / deflate**.

The export is named **`compression`** (not `compress`):

```typescript
import { compression } from '@vafast/compress'
// default import also works: import compression from '@vafast/compress'
```

## Key Concepts (for New Users)

### What Does Response Compression Do?

A browser or HTTP client declares in the request "which formats I can decompress". If the server agrees, it compresses the response body before sending it and states the algorithm used in a response header. Typical result: JSON / HTML / text get noticeably smaller, reducing bandwidth and load time.

### `Accept-Encoding` Negotiation (How This Package Picks an Algorithm)

1. The client sends, for example: `Accept-Encoding: br, gzip, deflate`
2. The middleware reads this header and splits it on **comma + space** (`, `)
3. It filters your configured `encodings` (default `['br', 'gzip', 'deflate']`), keeping only entries **that also appear in the client's list**
4. The filtered list **keeps the order of `encodings`**, and the **first** entry is used

So: **the order of the server array = priority**. By default Brotli is preferred, then gzip, then deflate.

Note (differences from full HTTP negotiation; the source code is authoritative):

- Matching is "is the string in the split list"; `q` weights (e.g. `gzip;q=0.8`) are **not** parsed
- If the client sends `br,gzip` (no space after the comma), the split may not match, resulting in no compression
- No `Accept-Encoding`, or **no overlap** with `encodings` → **no compression**

### What Is `threshold`?

For responses **already buffered as a single block**: if `byteLength < threshold` (default **1024** bytes), compression is skipped.

Why: very small responses may be about the same size after compression and just waste CPU. The streaming path (see below) skips this byte-size check.

### zlib `level` / Brotli `quality` in Plain Terms

| Option | Effect | Default (this package) |
|------|------|----------------|
| `zlibOptions.level` | Compression level for gzip / deflate, roughly **0–9**: higher saves more size but costs more CPU | **`6`** |
| `brotliOptions.params[BROTLI_PARAM_QUALITY]` | Brotli quality, roughly **0–11**: higher saves more size but costs more CPU | Node's **`BROTLI_DEFAULT_QUALITY`** (usually 11) |

Tuning tips: for API JSON, the default or a slightly lower quality is common; if CPU is tight, lower Brotli quality to 4–6, or just use gzip.

### `compressStream`: Type Comment vs. Runtime Default

| Source | Default |
|------|--------|
| JSDoc in `types.ts` (`@default false`) | Says `false` |
| **Runtime** `options?.compressStream ?? true` | **`true`** |

**The runtime is authoritative: `ReadableStream` bodies are compressed by default**. For long-lived connections such as SSE (`text/event-stream`), set `compressStream: false` explicitly.

## Installation

```bash
npm install @vafast/compress
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { compression } from '@vafast/compress'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ message: 'Hello '.repeat(200) }),
  }),
])

const server = new Server(routes)
server.use(compression())
serve({ fetch: server.fetch, port: 3000 })
```

When accessed with a client that supports compression, the response includes `Content-Encoding` (e.g. `br`) and `Vary: accept-encoding`.

## Usage

### Basic Usage

We recommend **mounting it globally**: the middleware first does `await next()`, then rewrites the body / response headers as needed.

```typescript
server.use(compression())
```

The client must send a negotiable encoding, for example:

```http
Accept-Encoding: br, gzip, deflate
```

### Common Scenarios

#### 1. Enable Only gzip / deflate and Raise the Threshold

```typescript
server.use(
  compression({
    encodings: ['gzip', 'deflate'],
    threshold: 2048,
  }),
)
```

#### 2. SSE / Streaming Responses: Disable Stream Compression

```typescript
server.use(
  compression({
    compressStream: false,
  }),
)
```

Note: when `compressStream === true` and `response.body instanceof ReadableStream`, it goes through `pipeThrough(CompressionStream(...))` **without checking** `threshold` / the Content-Type regex. Disable stream compression for SSE.

#### 3. Client Opt-Out

By default `disableByHeader: true`: requests carrying an `x-no-compression` header with any value are passed through untouched.

```http
GET /large-json
x-no-compression: 1
```

#### 4. Tuning Compression Level and In-Memory Cache

The non-streaming path keeps an **in-process cache** keyed by MD5 of "algorithm + original content" (`TTL` in seconds, default 24 hours).

```typescript
import { constants } from 'node:zlib'
import { compression } from '@vafast/compress'

server.use(
  compression({
    zlibOptions: { level: 6 },
    brotliOptions: {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 4,
      },
    },
    TTL: 3600,
  }),
)
```

## API

### Exports

| Export | Description |
|------|------|
| `compression` | Middleware factory (main entry) |
| `default` | Same as `compression` |
| `CompressionStream` | Bridges a Node zlib Transform to Web Streams for streaming `pipeThrough` |
| `CompressionOptions` / `CompressionEncoding` / `LifeCycleOptions` / `CacheOptions` etc. | Types |

### Options / Parameters

```typescript
compression(options?: CompressionOptions & LifeCycleOptions & CacheOptions)
```

| Parameter | Type | Default | Description |
|------|------|------|------|
| `encodings` | `('br' \| 'gzip' \| 'deflate')[]` | `['br', 'gzip', 'deflate']` | Server priority; intersected with `Accept-Encoding` and the first is used |
| `threshold` | `number` | `1024` | Buffered responses smaller than this many bytes are not compressed |
| `disableByHeader` | `boolean` | `true` | When `true`, skip if the request has `x-no-compression` |
| `compressStream` | `boolean` | **`true` at runtime** (the type JSDoc still says `false`; runtime wins) | Whether to stream-compress `ReadableStream` bodies |
| `brotliOptions` | `BrotliOptions` | Buffered path: GENERIC + default quality; streaming path defaults to MODE_TEXT + default quality | Passed to `brotliCompressSync` / `createBrotliCompress` |
| `zlibOptions` | `ZlibOptions` | `{ level: 6 }` | Passed to gzip / deflate |
| `TTL` | `number` | `86400` (24h) | In-memory cache TTL (seconds) for compressed results; non-streaming `getOrCompress` only |
| `as` | `'before' \| 'after'` | `'after'` | Reserved type field; **read but unused by the current implementation**, can be ignored |

### Related Functions

#### `CompressionStream(encoding, options?)`

Used internally by the streaming path's `pipeThrough`. Business code usually doesn't need to call it directly.

## Best Practices

1. API JSON / HTML are good candidates for global compression; binaries such as `.zip` / images are usually skipped automatically because their Content-Type doesn't match
2. For SSE / long-lived streaming responses, use `compressStream: false`
3. Use `threshold` to avoid wasting CPU on small responses
4. The `TTL` cache suits hot, repetitive responses; watch process memory, and note each instance keeps its own cache
5. When debugging sizes, have the client send `x-no-compression` to compare with the original

## Notes

- Only **`response.ok`** responses (status 200–299) are compressed
- A non-overlapping or missing `Accept-Encoding` → no compression
- On the buffered path, `Content-Type` must match a compressible type (roughly: non-event-stream `text/*`, `json`, `xml`, `octet-stream`, etc.); **a missing Content-Type is treated as compressible**
- `text/event-stream` isn't in the default compressible Content-Type regex, but with `compressStream: true` and a `ReadableStream` body it may still be stream-compressed; disable `compressStream` for SSE
- Sets `Content-Encoding` and merges `Vary: accept-encoding` (not appended if `Vary: *` already exists)
- Depends on Node `zlib` / `crypto` (verify compatibility yourself in pure Edge environments)

## Related Links

- [SSE](/en/essential/sse)
- [Middleware System](/en/middleware/overview)
- [MDN: Accept-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)
- [Node.js zlib](https://nodejs.org/api/zlib.html)
