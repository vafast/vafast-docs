---
title: 测试指南 - Vafast API 客户端
---

# 测试指南

客户端返回 `{ data, error }`，测试里直接断言这两个字段即可，不必包一层 try/catch。

## 环境

```bash
npm install -D vitest
# 或使用 bun:test
```

## 测 createClient + eden

可用 `fetch` mock，或对真实 Vafast 服务用 `server.fetch`（见 [单元测试](/patterns/unit-test)）。

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

  it('成功时 data 有值、error 为 null', async () => {
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

  it('4xx 时走 error，不抛异常', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 404, message: '资源不存在' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const api = eden<Api>(createClient('http://localhost:3000'))
    const { data, error } = await api.users.get()

    expect(data).toBeNull()
    expect(error?.code).toBe(404)
    expect(error?.message).toBe('资源不存在')
  })

  it('422 带 details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 422,
            message: '请求参数校验失败',
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

## 测中间件

```typescript
import { createClient, defineMiddleware, eden } from '@vafast/api-client'
import { describe, it, expect, vi } from 'vitest'

it('中间件会写入 Authorization', async () => {
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

## 断言建议

| 场景 | 断言 |
|------|------|
| 成功 | `error === null`，再读 `data` |
| 业务失败 | `data === null`，检查 `error.code` / `message` |
| 校验失败 | `error.code === 422`，检查 `error.details` |
| 不要 | 用 try/catch 包住正常的 4xx 业务错误 |

## 相关

- [基础用法](/api-client/fetch)
- [高级用法](/api-client/advanced)
- [服务端单元测试](/patterns/unit-test)
