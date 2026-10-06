---
title: Testing - Vafast API Client
description: 'Test Vafast APIs with the type-safe API client: call routes in-process without a network, write unit and integration tests with Vitest, and mock requests.'
---

# Testing

The client returns `{ data, error }`, so in tests you just assert on those two fields; no need to wrap calls in try/catch.

## Environment

```bash
npm install -D vitest
# or use bun:test
```

## Testing createClient + eden

You can mock `fetch`, or use `server.fetch` against a real Vafast server (see [Unit Testing](/en/patterns/unit-test)).

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, eden } from '@vafast/api-client'

type Api = {
  users: {
    get: { query?: { page?: number }; return: { users: { id: string }[] } }
    post: { body: { name: string }; return: { id: string; name: string } }
  }
}

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('has data and a null error on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ users: [{ id: '1' }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const api = eden<Api>(createClient('http://localhost:3000'))
    const { data, error } = await api.users.get({ page: 1 })

    expect(error).toBeNull()
    expect(data?.users).toEqual([{ id: '1' }])
  })

  it('returns error on 4xx without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 404, message: 'Resource not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const api = eden<Api>(createClient('http://localhost:3000'))
    const { data, error } = await api.users.get()

    expect(data).toBeNull()
    expect(error?.code).toBe(404)
    expect(error?.message).toBe('Resource not found')
  })

  it('includes details on 422', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 422,
            message: 'Request validation failed',
            details: [
              {
                location: 'body',
                path: '/name',
                field: 'name',
                message: 'Expected string length greater or equal to 1',
              },
            ],
          }),
          {
            status: 422,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    )

    const api = eden<Api>(createClient('http://localhost:3000'))
    const { error } = await api.users.post({ name: '' })

    expect(error?.code).toBe(422)
    expect(error?.details?.[0]?.field).toBe('name')
  })
})
```

## Testing Middleware

```typescript
import { createClient, defineMiddleware, eden } from '@vafast/api-client'
import { describe, it, expect, vi } from 'vitest'

it('middleware sets Authorization', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)

  const auth = defineMiddleware(async (ctx, next) => {
    ctx.headers.set('Authorization', 'Bearer test')
    return next()
  })

  type Api = { health: { get: { return: { ok: boolean } } } }
  const api = eden<Api>(createClient('http://localhost:3000').use(auth))

  const { data, error } = await api.health.get()
  expect(error).toBeNull()
  expect(data?.ok).toBe(true)

  const init = fetchMock.mock.calls[0]?.[1] as RequestInit
  const headers = new Headers(init.headers)
  expect(headers.get('Authorization')).toBe('Bearer test')
})
```

## Assertion Tips

| Scenario | Assertion |
|------|------|
| Success | `error === null`, then read `data` |
| Business failure | `data === null`, check `error.code` / `message` |
| Validation failure | `error.code === 422`, check `error.details` |
| Don't | Wrap normal 4xx business errors in try/catch |

## Related

- [Basic Usage](/en/api-client/fetch)
- [Advanced Usage](/en/api-client/advanced)
- [Server-Side Unit Testing](/en/patterns/unit-test)
