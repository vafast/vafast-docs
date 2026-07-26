---
title: JWT 中间件 - Vafast
---

# JWT

`@vafast/jwt` 基于 [jose](https://github.com/panva/jose)，提供 JWT **签发（sign）** 与 **校验（verify）**。

`jwt(options)` 返回中间件：把 `{ sign, verify }` 挂到请求对象的指定字段上（默认 `req.jwt`）。它本身**不会**拦截未登录请求，也不会自动注入 `user`——鉴权逻辑由你在 handler 或自定义中间件里完成。

## 先搞清几个概念（给新用户）

### JWT 是什么？

JWT（JSON Web Token）是一段可在客户端与服务端之间传递的**字符串令牌**，常见形态：

```text
xxxxx.yyyyy.zzzzz
 │      │      └─ 签名（Signature）：用密钥算出，用于防篡改
 │      └─ 载荷（Payload）：业务数据 + 标准声明，Base64URL 编码（可读，但不是加密）
 └─ 头（Header）：算法等元信息，同样是 Base64URL
```

要点：

- **可读 ≠ 安全**：Payload 谁都能解码看到。密码、密钥、银行卡号不要放进去。
- **签名防篡改**：改了 Payload 后签名对不上，`verify` 会失败。
- **不是自动登录中间件**：本包只给你 `sign` / `verify` 工具；何时 401、如何读 Cookie / Bearer，要自己写。

### JOSE / Claims / Header 是什么？

| 名词 | 白话 |
|------|------|
| **JOSE** | JSON Object Signing and Encryption 的统称；JWT 签发校验常用其中的 JWS（签名） |
| **Claim（声明）** | Payload 里的字段。有标准声明（如 `exp` 过期时间），也可以有业务字段（如 `userId`） |
| **Protected Header** | JWT 头部参数，告诉校验方「用什么算法、什么密钥」等。常见如 `alg`、`typ`、`kid` |

标准声明定义见 [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)。

### 本包怎么挂载？

```typescript
const jwtMiddleware = jwt({ secret: '...', exp: '7d' })
// 之后在 handler 里：
await req.jwt.sign({ userId: 'u_1' })
await req.jwt.verify(token)
```

必须把中间件挂到会调用这些方法的路由上（或 `server.use`），否则 `req.jwt` 不存在。

## 安装

```bash
npm install @vafast/jwt
```

若要用 `schema` 做 TypeBox 校验，请同时安装（或确保项目已有）`@sinclair/typebox`。

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { jwt } from '@vafast/jwt'

const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET!,
  // 签发者：标记「这是谁发的 token」
  iss: 'my-app',
  // 默认过期时间：7 天（也可用秒数或 Unix 时间戳，见下方 exp）
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

说明：

- 必须把 `jwtMiddleware` 挂到会调用 `sign` / `verify` 的路由（或 `server.use`）
- 包通过改写 `Request` 挂载方法，示例用 `JwtRequest` 做类型标注（不要依赖隐式 `any`）

## 用法

### 基础用法

全局挂载一次，所有路由都能用 `req.jwt`：

```typescript
const server = new Server(routes)
server.use(jwt({ secret: process.env.JWT_SECRET!, exp: '1h' }))
```

或只挂在需要签发 / 校验的路由上：

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

### 常见场景

#### 1. TypeBox schema 约束 payload

`schema` 已接入 `@sinclair/typebox/value` 的 `Value.Check`：

- `sign`：不符合 → **抛错** `JWT payload does not match schema`
- `verify`：不符合 → 返回 **`false`**（不抛错）
- jose 附带的 `iss` / `exp` / `iat` 等标准 claims 不会误杀业务 schema（会同时试「完整 payload」与「去掉标准 claims 后的业务字段」）

```typescript
import { Type } from '@sinclair/typebox'
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

#### 2. 登录后把 JWT 写入 Cookie

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

浏览器场景更推荐配合 [@vafast/cookie](/middleware/cookie) 管理 Cookie。

#### 3. 在路由内自行做鉴权

给鉴权中间件标上上下文泛型，**同一条叶子路由**上挂 `middleware` 时，handler 能直接推断 `user`：

```typescript
import { defineMiddleware, err } from 'vafast'

type AuthUser = { id: string }

const requireUser = defineMiddleware<{ user: AuthUser }>(async (req, next) => {
  const header = req.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const payload = await (req as JwtRequest).jwt.verify(token)
  if (!payload?.userId) throw err.unauthorized('请先登录')
  return next({ user: { id: payload.userId } })
})

defineRoute({
  method: 'GET',
  path: '/profile',
  middleware: [jwtMiddleware, requireUser],
  handler: ({ user }) => json({ id: user.id }), // user 有类型
})
```

也可先用 [@vafast/bearer](/middleware/bearer) 提取 token，再 `verify`。

#### 4. 嵌套路由 / 拆文件时用 `withContext`（类型安全）

`@vafast/jwt` **本身不注入** `user`，只挂 `sign` / `verify`。  
`withContext` 解决的是另一件事：你自己的鉴权中间件用 `next({ user })` 注入上下文后，**父级挂中间件、子路由写在 `children` 或别的文件里**时，TypeScript **推不出**父级注入的字段。

| 场景 | 要不要 `withContext` |
|------|----------------------|
| 只用 `req.jwt.sign` / `verify` | **不必**。继续用 `JwtRequest`（或小 helper）标注即可 |
| `middleware: [jwt, requireUser]` 写在**同一条叶子路由**上 | **通常不必**。给 `defineMiddleware<{ user }>` 标泛型即可推断 |
| 组路由挂鉴权，叶子在 `children` / 多文件复用 | **需要**。用 `withContext<{ user }>()` 封装路由定义器 |

```typescript
import { withContext, defineRoute, defineRoutes, defineMiddleware, err } from 'vafast'

type AuthUser = { id: string }

const requireUser = defineMiddleware<{ user: AuthUser }>(async (req, next) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const payload = await (req as JwtRequest).jwt.verify(token)
  if (!payload?.userId) throw err.unauthorized('请先登录')
  return next({ user: { id: payload.userId } })
})

// 纯类型包装，零运行时开销
const defineAuthedRoute = withContext<{ user: AuthUser }>()

const profileRoute = defineAuthedRoute({
  method: 'GET',
  path: '/profile',
  handler: ({ user }) => json({ id: user.id }), // 子路由也能拿到类型
})

defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [jwtMiddleware, requireUser], // 运行时在父级注入
    children: [profileRoute],                 // 类型靠 withContext 接上
  }),
])
```

更完整的说明见 [最佳实践 · withContext](/essential/best-practice#9-用-withcontext-封装类型安全路由) 与 [中间件 · withContext](/middleware#父级中间件类型注入withcontext)。  
若走独立认证服务，可直接用 [@vafast/auth-middleware](/middleware/auth-middleware) 自带的 `defineAuthRouteWithApp` 等，不必手写。

#### 5. 多套密钥（access / refresh）

`name` 不同即可挂多实例：

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
    // 挂载后字段名 = name：
    // (req as Request & { accessToken: ...; refreshToken: ... })
  },
})
```

#### 6. 配置标准声明（issuer / audience / 过期）

```typescript
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET!,
  // 谁签发的
  iss: 'https://api.example.com',
  // 签发给谁用（可写成数组）
  aud: 'https://app.example.com',
  // 默认主体（常在 sign 时按用户覆盖）
  sub: undefined,
  // 1 小时后过期
  exp: '1h',
  // 立即生效（也可写未来时间表示「到点才能用」）
  nbf: '0s',
})

// sign 时可覆盖默认 claims：
await req.jwt.sign({
  userId: 'u_1',
  sub: 'u_1',
  aud: 'admin-console',
  exp: '5m',
})
```

## API

### 导出

| 导出 | 说明 |
|------|------|
| `jwt` | 工厂函数：传入配置，返回中间件 |
| `default` | 同 `jwt` |
| `JWTOption` | `jwt(...)` 的配置类型（含业务项 + 标准 claims + header） |
| `JWTPayloadSpec` | 标准 Payload 声明类型（`iss` / `sub` / `aud` / …） |
| `JWTHeaderParameters` | Protected Header 类型（`alg` / `typ` / `kid` / …） |

### 调用形式

```typescript
jwt(options: JWTOption)
```

配置可分成三块理解：**本包业务选项**、**标准 Payload 声明（Claims）**、**JOSE Header 参数**。

---

### 本包业务选项

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `secret` | `string \| Uint8Array \| JWK` | — | **必填**。签名 / 验签密钥。空值（含空字符串）会立刻抛 `Secret can't be empty`。若传 `string`，内部会先 `new TextEncoder().encode(secret)` 再交给 jose。生产环境请用足够长的随机串，并只放环境变量。 |
| `name` | `string` | `'jwt'` | 挂到 `Request` 上的字段名。例如 `name: 'accessToken'` → 使用 `req.accessToken.sign` / `verify`。多套 token（access / refresh）时靠不同 `name` 区分。 |
| `schema` | `TSchema`（TypeBox） | — | 可选。约束业务 payload 形状。`sign` 校验失败抛错；`verify` 校验失败返回 `false`。 |

---

### 标准 Payload 声明（Claims）

这些字段既可在 `jwt({ ... })` 里设**默认值**，也可在每次 `sign(data)` 时传入并**覆盖默认值**（同名字段以 `data` 为准）。

| 参数 | 类型 | 默认 | 含义（白话） | 详细说明 |
|------|------|------|--------------|----------|
| `iss` | `string` | — | **Issuer，签发者** | 标识「谁签发了这个 token」。常见写法：应用名（`'my-app'`）或服务 URL（`'https://api.example.com'`）。多服务互通时，接收方可用它判断是否信任该来源。见 [RFC 7519 §4.1.1](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.1)。 |
| `sub` | `string` | — | **Subject，主体** | 标识「这个 token 是关于谁的」。常见放用户 ID（`'u_123'`）。与业务字段 `userId` 可以并存：有人只放 `sub`，有人两者都放——选一种约定并坚持即可。见 [RFC 7519 §4.1.2](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.2)。 |
| `aud` | `string \| string[]` | — | **Audience，受众** | 标识「这个 token 签发给谁用」。可以是单个字符串，或字符串数组（多个合法接收方）。例如 API 网关只接受 `aud === 'api'` 的 token，避免把给管理后台的 token 误用到开放 API。见 [RFC 7519 §4.1.3](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.3)。 |
| `jti` | `string` | — | **JWT ID，令牌唯一编号** | 给每个 token 一个唯一 ID。常用于：登出黑名单、一次性 token、审计追踪。本包不内置黑名单存储，需要你自己在服务端记录已吊销的 `jti`。见 [RFC 7519 §4.1.7](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.7)。 |
| `nbf` | `string \| number` | — | **Not Before，生效起点** | 「在此之前不能用」。未到时间则校验失败。适合「预约生效」或给时钟偏差留缓冲（如 `'0s'` 表示立即）。格式见下方「时间怎么写」。见 [RFC 7519 §4.1.5](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.5)。 |
| `exp` | `string \| number` | — | **Expiration Time，过期时间** | 「过了这个点就失效」。强烈建议始终配置。access token 常用 `'15m'` / `'1h'`；refresh 可用 `'7d'`。过期后 `verify` 返回 `false`。见 [RFC 7519 §4.1.4](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4)。 |
| `iat` | `boolean` | 默认写入当前时间 | **Issued At，签发时间** | 控制是否写入 `iat` 声明。实现上：只要配置侧或 `sign` 入参没有明确关掉（`!== false`），就会 `setIssuedAt(new Date())` 写入当前时间。一般保持默认即可；审计、排序、排查「何时签发」时有用。见 [RFC 7519 §4.1.6](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.6)。 |

#### 时间怎么写？（`exp` / `nbf`）

jose 的 `setExpirationTime` / `setNotBefore` 支持多种写法，常见：

| 写法 | 例子 | 含义 |
|------|------|------|
| 相对时长字符串 | `'15m'`、`'1h'`、`'7d'` | 从现在起 15 分钟 / 1 小时 / 7 天后 |
| 秒数字符串 | `'60s'`、`'0s'` | 60 秒后 / 立即 |
| 数字 | Unix 时间戳（秒）或 jose 接受的数值形式 | 绝对时间点 |

新手建议：生产配置用相对时长（`'15m'`、`'7d'`），可读且不易算错绝对时间戳。

#### Claims 覆盖规则（重要）

```typescript
jwt({ iss: 'my-app', exp: '1h' })

// 未传 iss/exp → 用配置默认值
await req.jwt.sign({ userId: 'u_1' })

// 传入同名字段 → 覆盖默认值
await req.jwt.sign({ userId: 'u_1', iss: 'admin-service', exp: '5m' })
```

`nbf` / `exp`：仅当「`data` 或默认配置里至少有一边有值」时才会写入 JWT。  
`iat`：见上表，默认会写入当前时间。

---

### JOSE Header 参数（Protected Header）

Header 描述「这个 JWT 怎么签、用哪把钥匙」，多数应用只需关心 `alg` 和 `typ`。其余字段在密钥轮换、多密钥、证书体系里才会用到。

| 参数 | 类型 | 默认 | 含义（白话） | 详细说明 |
|------|------|------|--------------|----------|
| `alg` | `string` | `'HS256'` | **Algorithm，签名算法** | 默认对称算法 HS256（用同一份 `secret` 签发和校验），上手最简单。非对称算法（如 `RS256`）需要公私钥对，适合「多方校验、私钥不出签发服务」的场景。算法与密钥类型必须匹配，否则签发/校验会失败。参见 [jose 算法说明](https://github.com/panva/jose/issues/210#jws-alg)。 |
| `typ` | `string` | `'JWT'` | **Type，令牌类型** | 通常保持 `'JWT'`。告诉接收方「这是 JWT」。一般不用改。 |
| `kid` | `string` | — | **Key ID，密钥编号** | 当你有多把密钥轮换时，用 `kid` 标明「这枚 token 是用哪把钥匙签的」，校验方按 `kid` 选对公钥/密钥。单密钥场景可忽略。 |
| `jwk` | `JWK` | — | **JSON Web Key** | 把公钥以 JWK 对象形式放进 header（少见；更常见是放在 JWKS 端点）。高级集成用。 |
| `jku` | `string` | — | **JWK Set URL** | 指向一组公钥的 URL（JWKS）。接收方可拉取该 URL 找密钥。需信任该 URL，注意 SSRF / 供应链风险。 |
| `x5c` | `string[]` | — | **X.509 证书链** | 以证书链形式携带公钥材料。企业 PKI / 部分联邦登录场景会用到。 |
| `x5t` | `string` | — | **X.509 证书指纹（SHA-1）** | 证书的拇指指纹，用于快速标识证书。 |
| `x5u` | `string` | — | **X.509 URL** | 指向证书（链）的 URL。 |
| `cty` | `string` | — | **Content Type，内容类型** | 标明 Payload 内容类型。嵌套 JWT 等特殊场景才需要。 |
| `crit` | `string[]` | — | **Critical，关键扩展头** | 列出「接收方必须理解，否则应拒绝」的扩展 header 名。用于强制扩展语义。 |
| `b64` | `true` | — | **RFC 7797 载荷编码开关** | 与 [RFC 7797](https://www.rfc-editor.org/rfc/rfc7797) 相关：影响 Payload 是否按常规 Base64URL 编码。普通 JWT 登录场景不要动；保持默认即可。 |

未设置的可选 header 字段不会强行写入；`alg` / `typ` 有安全默认值。

---

### 挂载后的方法

创建中间件并挂到请求后，`req[name]`（默认 `req.jwt`）上有：

#### `sign(data) => Promise<string>`

签发一枚 JWT 字符串。

步骤：

1. 若配置了 `schema`，先用 `Value.Check` 校验 `data`；失败抛 `JWT payload does not match schema`
2. 合并默认 claims / header 与 `data`（claims 以 `data` 优先）
3. 按规则写入 `nbf` / `exp` / `iat`
4. 用 `secret` 签名，返回 JWT 字符串

`data` 类型：业务字段 + 可选标准 claims（`iss` / `sub` / `aud` / `jti` / `nbf` / `exp` / `iat`）。

#### `verify(jwt?) => Promise<payload | false>`

校验一枚 JWT。

| 情况 | 返回值 |
|------|--------|
| 未传 token / 空字符串 | `false` |
| 签名错误、过期、`nbf` 未到、格式损坏等 jose 抛错 | `false`（**不抛给业务**） |
| 配置了 `schema` 且业务字段不匹配 | `false` |
| 成功 | payload 对象（业务字段 + 标准 claims） |

务必在业务里显式处理 `false`（返回 401 或抛 `err.unauthorized`），不要假设「有 token 就一定有效」。

## 最佳实践

1. **`secret` 只放环境变量**；生产用足够长的随机串（例如 32+ 字节）。不要提交到 Git。
2. **access 短过期，refresh 长过期**；两套 token 用不同 `name` + 不同 `secret`。
3. **Payload 只放必要字段**（如 `userId`、`role`）。敏感数据放服务端会话 / 数据库。
4. 用 **`schema`** 保证签发与校验形状一致，减少「字段漂移」。
5. Cookie 存 JWT 时加 **`HttpOnly` + `Secure` + `SameSite`**；跨站场景再仔细评估 `SameSite=None`。
6. 需要吊销能力时，给 token 加 **`jti`**，并在服务端维护黑名单 / 版本号。
7. 多服务架构建议明确配置 **`iss` / `aud`**，避免 token 被串用到错误服务。
8. 自写 `next({ user })` 且路由拆到 `children` / 多文件时，用 **`withContext`** 保证 handler 类型；不要把 `withContext` 误当成 jwt 包的必需步骤。

## 注意事项

- 本包只提供工具，**不**自动 401，**不**注入用户上下文
- `verify` 失败返回 `false`，不会抛错；请在业务里显式处理
- `secret` 为空会在**创建中间件时**立即抛错（不是等第一次请求）
- Payload **可被解码阅读**，签名只防篡改，不防窥视——HTTPS 仍然必要
- `req.jwt` 的类型需自行扩展（如示例中的 `JwtRequest`）；`withContext` **不能**替代这一步
- 默认算法是 **HS256（对称密钥）**；改 `alg` 时请确认 `secret` / 密钥材料与算法匹配

## 相关链接

- [Bearer](/middleware/bearer) — 从请求提取 token
- [Cookie](/middleware/cookie) — 用 Cookie 传递 JWT
- [Auth Middleware](/middleware/auth-middleware) — 生产鉴权与 `defineAuthRouteWithApp`
- [withContext](/essential/best-practice#9-用-withcontext-封装类型安全路由) — 跨 children 的上下文类型
- [中间件系统](/middleware/overview)
- [jose](https://github.com/panva/jose) · [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
