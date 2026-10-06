---
title: Comparison with Other TS Clients - Vafast
description: 'How the Vafast API client compares with other TypeScript clients such as tRPC, Hono RPC, Elysia Eden and ts-rest: type inference, code generation, runtime and DX.'
---

# Comparison with Other TypeScript Clients

`@vafast/api-client` offers Eden-style chained calls, a `{ data, error }` error model and Koa-style onion middleware. Types come from a contract or the CLI (`vafast sync`), with no dependency on a specific backend runtime.

Below is an overview first, then a point-by-point look at **call style → error handling → client-side cross-cutting concerns → SSE → types and coupling**, followed by recommendations.

## Overview

<div class="table-scroll">

| Dimension | **This library** | Eden | tRPC | Hono `hc` | OpenAPI | Axios / ky |
|------|----------|------|------|-----------|---------|------------|
| Call style | Chained `.post(body)` | Treaty chaining | `query` / `mutate` | `$get(...)` | `GET('/path')` | `axios.get` |
| Error handling | `{ data, error }` | `{ data, error }` | Throws | `Response` | Depends on generator | Throws |
| Client cross-cutting | Onion `next()` | Request/response hooks | Links | headers / fetch | Weak | Interceptors |
| SSE | Same call `.sse()` | `subscribe` | subscription | Depends | Usually none | Usually none |
| Types & coupling | Contract / CLI, loose coupling | Isomorphic, tied to Elysia | Isomorphic, tied to tRPC | Isomorphic, tied to Hono | Generated, no binding | No end-to-end types |

</div>

## 1. Call Style

Common scenario: `POST /users/find` with body `{ current: 1, pageSize: 20 }` (paginated user lookup). Here we only compare "how you write this request"; error handling is covered in the next section.

### This Library

```typescript
const { data, error } = await api.users.find.post({ current: 1, pageSize: 20 })
```

Path segments are joined with `.`, the HTTP verb comes at the end of the chain, and the body is the first argument. No `$` prefix and no extra `{ body }` / `{ query }` wrapper.  
**Pros**: maps one-to-one to the URL structure, intuitive autocompletion, low read/write cost.  
**Note**: if a path segment has the same name as a verb (e.g. `POST /prices/delete`), write `api.prices.delete.post(...)`: the middle `delete` is the path and only the last call is the verb. See [Basic Usage · Caveat](/en/api-client/fetch#caveat-path-segments-named-like-verbs).

The same call can switch to SSE (`RequestBuilder` is lazy): `api.users.find.post(body).sse({ ... })`, no different API needed.

### Eden Treaty

```typescript
const { data, error } = await app.users.find.post({ current: 1, pageSize: 20 })
```

**For this POST, the shape is almost identical to this library** (paths as properties, verb at the end of the chain, body as the first argument). If you only compare "writing a POST with a body", the two are deliberately isomorphic; neither is fancier.

The real differences lie in adjacent capabilities, not in this one line of dots:

| Point | This library | Eden Treaty |
|----|------|-------------|
| GET query | `api.users.get({ page: 1 })`, the first argument is the query | Usually `api.users.get({ query: { page: 1 } })`, query needs another wrapper |
| Streaming | Same call: `.post(body).sse({ onMessage })` | HTTP SSE is often `await`ed, then `for await` over `data`; real-time bidirectional is `.subscribe()` (WebSocket) |
| Client assembly | `createClient` → `.use(middleware)` → `eden(client)` | `treaty(url \| app, { onRequest, onResponse, headers })` |
| Cross-cutting model | Koa onion `(ctx, next)`, shared with SSE | Separate request/response hooks, not `next()` |
| Error fields | `error.code` / `message` / `details` (aligned with Vafast) | `error.status` / `error.value` (aligned with Elysia) |
| Where types come from | Contract / `vafast sync`, not tied to a runtime | Isomorphic `typeof app`, tightly bound to Elysia; also `treaty(app)` for in-process calls |

**Pros (Eden)**: zero codegen and least effort when your backend is Elysia; in-process `treaty(app)` is great for unit tests.  
**Cost**: not applicable once you switch to a non-Elysia backend; its streaming and cross-cutting models differ from this library's.

Conclusion: the chained "look" is borrowed from Eden; the differences are **flattened GET inputs, `.sse()` on the same chain as JSON, onion middleware, and Vafast-oriented errors/contracts**, not yet another dot syntax.

### tRPC

```typescript
// if the server defines it as a query procedure:
const data = await trpc.users.find.query({ current: 1, pageSize: 20 })

// if the server defines it as a mutation procedure, the client must change to:
// await trpc.users.find.mutate({ current: 1, pageSize: 20 })
```

tRPC doesn't use `.get` / `.post`. The server registers each endpoint as one of two procedure types, **query (read)** or **mutation (write)**, and the client can only call the matching `.query()` or `.mutate()`. This doesn't map one-to-one to HTTP verbs, even if the transport happens to be POST.  
**Pros**: full procedure-level types, batching and more when frontend and backend share a repo.  
**Cost**: the mental model is RPC, not REST; switching to a non-tRPC backend is expensive; the call shape is less intuitive than chaining compared with the URLs you see at the gateway or in captured traffic.

### Hono `hc`

```typescript
const res = await client.users.find.$post({
  json: { current: 1, pageSize: 20 },
})
```

Paths can still be chained, but method names carry a `$`, and inputs are usually split into `json` / `query` / `param`.  
**Pros**: aligns well with Hono's route types.  
**Cost**: `$` and nested fields add noise; you get a `Response` back and still have to check `ok` / call `json()` yourself (see Error Handling).

### OpenAPI-Generated Clients

```typescript
const { data, error } = await api.POST('/users/find', {
  body: { current: 1, pageSize: 20 },
})
```

Verb + string path; the resource tree feels weaker than chained properties.  
**Pros**: backend-agnostic and consistent across languages.  
**Cost**: depends on an OpenAPI pipeline; path strings can drift from the docs, and autocompletion is usually weaker than Proxy-based chaining.

### Axios

```typescript
const { data } = await axios.post('/users/find', { current: 1, pageSize: 20 })
```

The most straightforward HTTP calls.  
**Pros**: huge ecosystem, quick to pick up.  
**Cost**: no end-to-end path/response types (unless you add a codegen layer); a different class from type-safe chained clients.

### Summary

For the same `POST /users/find`, this library and Eden **look the most alike** (both use visible path + verb). The difference from Eden isn't this one line of dots, but whether GET inputs are flat, whether SSE hangs off the same `RequestBuilder`, and whether middleware / errors / contracts are Vafast-oriented. Compared with Hono, there's no `$` or nested wrapping; compared with tRPC / OpenAPI / Axios, it emphasizes a balance of HTTP readability and type-safe autocompletion rather than being locked into one runtime.

Path params follow the same pattern as Eden: `api.users({ id: '123' }).get()` → `GET /users/123`.

## 2. Error Handling

### Comparison

<div class="table-scroll">

| Library | Model | On business failure |
|----|------|------------|
| **This library** | `{ data, error }` | `if (error)`; on 422, read `error.details` |
| **Eden** | `{ data, error }` | Same Result; error shape varies slightly across Elysia versions |
| **tRPC** | Throws `TRPCClientError` | `try / catch` |
| **Hono `hc`** | `Response` | Check `res.ok` first, then `json()` / `text()` |
| **OpenAPI** | Depends on generator | Usually either Result or throwing |
| **Axios** | Throws | Read `e.response` in `catch` |

</div>

### Explanation

Same scenario: paginated user lookup; print a message on failure, use `list` on success (`console` can be replaced with UI).

**This library / Eden (Result)**

```typescript
const { data, error } = await api.users.find.post({ current: 1, pageSize: 20 })

if (error) {
  console.error(error.message)
  return
}

const users = data.list
```

**tRPC / Axios (exceptions)**

```typescript
try {
  const data = await trpc.users.list.query({ page: 1, pageSize: 20 })
  const users = data.list
} catch (e) {
  console.error(e.message)
}
```

**Hono `hc` (Response)**

```typescript
const res = await client.users.$get({ query: { page: '1' } })
if (!res.ok) {
  console.error(await res.text())
  return
}
const data = await res.json()
const users = data.list
```

This library follows the Vafast server conventions: business errors land in `error` (with `code` / `message`), validation failures are HTTP 422 + `details`, and control flow stays linear, with no `try / catch` needed for business failures.

## 3. Client-Side Cross-Cutting Concerns

### Comparison

<div class="table-scroll">

| Library | Model | Notes |
|----|------|------|
| **This library** | `(ctx, next) => ResponseContext` | Koa onion; `request` and the SSE `requestRaw` share `compose`; built-in `retry` / `timeout` / `logger` use the same interface |
| **Eden** | `onRequest` / `onResponse` | Separate request and response hooks, stackable as arrays |
| **tRPC** | Links | Observable chain that must end with a terminating link (e.g. `httpLink`); oriented around RPC operations |
| **Hono `hc`** | Creation options | Mainly default `headers` and a custom `fetch`; no first-class client middleware stack (route middleware lives on the server) |
| **Axios** | `interceptors` | Request / response interceptors, mature ecosystem |
| **OpenAPI** | Usually weak | Cross-cutting mostly relies on the underlying fetch / an extra interceptor layer |

</div>

### Explanation

Every library can handle auth headers, logging and similar concerns; the difference is in how they compose:

- **This library**: within one middleware you can "modify `ctx` → `await next()` → branch on `{ data, error }` or call `next()` again".
- **Eden**: request changes and response handling are split across two hooks.
- **tRPC**: links subscribe to a result stream; errors mostly propagate through observables / exceptions rather than an HTTP `ctx` + Result.
- **Hono**: client-side capabilities are limited; complex cross-cutting requires wrapping `fetch` yourself.
- **Axios**: mature interceptors, but no path types or built-in Result.

For more complex combinations such as multiple services and multi-tenancy, see [Advanced Usage](/en/api-client/advanced).

## 4. SSE

### Comparison

<div class="table-scroll">

| Library | Streaming entry point | Relation to regular requests |
|----|----------|------------------|
| **This library** | `.post(body).sse({ onMessage })` | Same chained call; goes through the same middleware chain |
| **Eden** | `subscribe` etc. on the endpoint | Separate from regular `.get` / `.post` |
| **tRPC** | `subscription` + the matching link | A separate model from `query` / `mutation` |
| **Hono `hc`** | Depends on route and usage | Varies; you often handle the stream yourself |
| **OpenAPI / Axios** | Usually no first-class SSE | Build your own EventSource / fetch stream |

</div>

### Explanation

```typescript
api.chat.stream.post({ prompt: 'hi' }).sse({
  onMessage: (chunk) => { /* handle each chunk */ },
  onError: (e) => console.error(e.message),
})
```

`RequestBuilder` sends JSON when `await`ed and switches to streaming when `.sse()` is called; path, method, body and auth middleware are the same as for regular requests, so you don't need a separate client for streaming.

## 5. Type Source and Backend Coupling

### Comparison

<div class="table-scroll">

| Library | Where types come from | Relation to the backend |
|----|------------|--------------|
| **This library** | Hand-written contract, or generated via `vafast sync` / CLI | Loose coupling: HTTP + contract, no runtime requirement |
| **Eden** | Inferred isomorphically from the Elysia `App` | Tightly bound to Elysia, best zero-codegen experience |
| **tRPC** | Inferred isomorphically from `AppRouter` | Tightly bound to tRPC (or a compatibility layer) |
| **Hono `hc`** | Inferred isomorphically from `AppType` | Tightly bound to Hono |
| **OpenAPI** | Generated from the OpenAPI document | Not tied to a runtime; multi-language friendly, heavier pipeline |
| **Axios** | No end-to-end types (unless added) | Not tied to a runtime; paths and responses rely on convention |

</div>

### Explanation

<div class="table-scroll">

| Approach | Pros | Cost |
|------|------|------|
| Isomorphic inference (tRPC / Eden / Hono) | Endpoint changes in the same repo flow straight to the client | Expensive to switch runtimes |
| Contract / CLI (this library) | Frontend and backend can live in separate repos; HTTP semantics preserved | A sync step to maintain |
| OpenAPI codegen | Consistent across gateways and languages | High cost to maintain codegen and docs |
| Untyped (Axios) | Quick to start | Paths / fields drift easily |

</div>

This library sits between isomorphic RPC and generic HTTP clients: the calling experience is close to Eden, without requiring Elysia, tRPC or Hono in your deployment.

## Recommendations

<div class="table-scroll">

| Scenario | Recommendation |
|------|------|
| tRPC backend, frontend and backend in one repo | tRPC |
| Elysia backend, want zero-codegen isomorphism | Eden |
| Hono backend, type alignment is the priority | Hono `hc` |
| Multi-language clients, or an existing OpenAPI spec | OpenAPI-generated client |
| Plain HTTP, no need for end-to-end types | Axios / ky / ofetch |
| Vafast backend, or you want onion middleware, Result and unified SSE | **This library** |
| Multiple services, multi-tenancy, heavy cross-cutting logic | **This library** ([Advanced Usage](/en/api-client/advanced)) |

</div>

If you're already committed to an isomorphic RPC stack, prefer that stack's official client; if you need an HTTP contract that can live in separate repos, plus unified chained calls, middleware and SSE, choose this library.

## Related

- [Overview](/en/api-client/overview)
- [Basic Usage](/en/api-client/fetch)
- [Advanced Usage](/en/api-client/advanced)
- [CLI](/en/tools/cli)
