---
title: Bearer 中间件 - Vafast
---

# Bearer

`@vafast/bearer` 按 [RFC6750](https://www.rfc-editor.org/rfc/rfc6750) 从请求中 **提取** Bearer token，通过 `next({ bearer })` 注入路由上下文。

它 **不验签、不鉴权**：找不到 token 时 `bearer` 为 `undefined`，不会自动返回 401。校验逻辑由你决定（可配合 [@vafast/jwt](/middleware/jwt)）。

## 安装

```bash
npm install @vafast/bearer
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, err, json, serve } from 'vafast'
import { bearer } from '@vafast/bearer'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/profile',
    middleware: [bearer()],
    handler: ({ bearer: token }) => {
      if (!token) throw err.unauthorized('缺少 Bearer token')
      return json({ token })
    },
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

## 用法

### 基础用法

提取顺序（找到即停）：

1. `Authorization` 头：前缀匹配 `header`（默认 `Bearer`），再取其后的 token
2. 查询参数：字段名默认 `access_token`
3. 请求体：非 `GET` 时用 `parseBody` 读字段，默认 `access_token`

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

或：

```http
GET /profile?access_token=eyJhbGciOiJIUzI1NiJ9...
```

### 常见场景

#### 1. 全局挂载

```typescript
const server = new Server(routes)
server.use(bearer())
```

所有路由 handler 都可解构 `bearer`（未带 token 时为 `undefined`）。

#### 2. 自定义字段名（非标准 API）

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

对应：`Authorization: Token <value>`，或 `?token=` / body `{ "token": "..." }`。

#### 3. 提取后交给 JWT 校验

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
    if (!payload) throw err.unauthorized('无效 token')
    return json({ userId: payload.userId })
  },
})
```

#### 4. 在深层逻辑里用 `getBearer`

中间件跑过之后，也可从 request locals 读取：

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

### 导出

| 导出 | 说明 |
|------|------|
| `bearer` | 工厂函数，返回中间件 |
| `getBearer` | 从 `req.__locals.bearer` 读取已提取的 token |
| `BearerOptions` | 配置类型 |
| `default` | 同 `bearer` |

### 选项 / 参数

```typescript
bearer(options?: BearerOptions)
```

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `extract.body` | `string` | `'access_token'` | 从 JSON body 取 token 的字段名 |
| `extract.query` | `string` | `'access_token'` | 从 query 取 token 的字段名 |
| `extract.header` | `string` | `'Bearer'` | `Authorization` 前缀（其后应有一个空格再跟 token） |

不传 `options` 时等价于上述全部默认值。

### 相关方法

#### `getBearer(req: Request): string | undefined`

读取中间件写入的 locals。若尚未执行 `bearer()`，返回 `undefined`。

## 最佳实践

1. 生产环境优先用 `Authorization` 头；query / body 适合兼容旧客户端
2. 提取与校验分离：本包只负责提取，验签用 JWT 或其它逻辑
3. 缺失 token 时用 `err.unauthorized` / `json(..., 401)` 明确返回，并按需加 `WWW-Authenticate`
4. body 解析失败会被静默忽略，不要依赖错误 body 做鉴权提示

## 注意事项

- Token 注入在 **上下文**（`next({ bearer })`），不是 `req.bearer`
- 仅当 `Authorization` **以配置的 `header` 前缀开头** 时才从 header 取值
- `GET` 不会尝试解析 body
- Body 使用 `req.clone()` + `parseBody`，避免消费原始请求流

## 相关链接

- [JWT](/middleware/jwt)
- [中间件系统](/middleware/overview)
- [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750)
