---
title: Cookie 中间件 - Vafast
---

# Cookie

`@vafast/cookie` 负责 **解析请求 Cookie**、**HMAC 签名校验**，以及用 `CookieJar` **写回 `Set-Cookie`**。

读用中间件（`cookies` / `signedCookies`）；写用 `createCookieJar`。没有 `cookie()` / `setCookie()` 这类导出。

## 先搞清几个概念（给新用户）

| 名词 | 白话 |
|------|------|
| **Cookie** | 浏览器按域名保存的一小段键值，之后请求会自动带上（受 Path / Domain / Secure / SameSite 等限制） |
| **`Set-Cookie`** | 服务端在**响应**里写入 Cookie 的头；本包用 `CookieJar.apply(response)` 追加 |
| **`Cookie` 请求头** | 浏览器发来的已有 Cookie；`cookies()` / `signedCookies()` 负责解析 |
| **`expires` vs `maxAge`** | 两种过期写法。`maxAge` 是「从现在起多少**秒**」；`expires` 是「具体哪一刻过期」（`Date` 或时间戳）。可同时写；浏览器以实现为准，常见以 `Max-Age` 优先 |
| **SameSite** | 限制跨站请求是否带上 Cookie，用来缓解 CSRF。见下方专表 |
| **签名 Cookie** | 值形如 `原文.HMAC签名`。服务端能发现篡改，但**不是加密**：原文仍可读。机密内容不要只靠签名 |
| **加密** | 本包**不做**加密；若需要保密载荷，请自行加密后再 `set`，或改用服务端 Session + 随机 session id |

### SameSite 怎么选？

| 值 | 白话 | 常见场景 |
|----|------|----------|
| `Strict` | 只有**同站**导航才带 Cookie；从外站点链接进来也不带 | 极敏感操作；可能影响「外链进站仍保持登录」 |
| `Lax` | 同站都带；跨站时，**顶级** GET 导航（点链接）会带，跨站 POST / iframe / XHR 一般不带 | 多数登录会话的默认首选 |
| `None` | 跨站请求也可以带；**必须同时** `secure: true`（仅 HTTPS），否则浏览器会拒收 | 跨子域前端、第三方嵌入且确实需要带 Cookie |

### 删除 Cookie 为何经常「删不掉」？

浏览器按 **name + Domain + Path**（等）匹配要覆盖的 Cookie。`delete` 必须用与写入时**相同**的 `path` / `domain`，否则等于写了另一条过期 Cookie，原来的还在。

## 安装

```bash
npm install @vafast/cookie
```

## 快速开始

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
      // 主题偏好需要前端 JS 读：显式关闭 httpOnly
      jar.set('theme', 'dark', { maxAge: 3600, httpOnly: false })
      return jar.apply(json({ ok: true }))
    },
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

## 用法

### 基础用法

`cookies()` 解析 `Cookie` 头，同时：

- 挂到 `req.cookies`
- 通过 `next({ cookies })` 注入上下文

```typescript
const server = new Server(routes)
server.use(cookies())
```

### 常见场景

#### 1. 签名 Cookie（防篡改会话）

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
      if (!signed.userId) throw err.unauthorized('请先登录')
      return json({ userId: signed.userId })
    },
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

`signedCookies` 行为：

- 签名校验成功 → 进入 `signedCookies`（值为 **原始未签名值**）
- 校验失败或未签名 → 留在 `cookies`

因此：**不要**把 `cookies` 里的同名键当成已信任数据。

#### 2. 同时读写主题与会话

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

#### 3. 删除 Cookie（登出）

```typescript
defineRoute({
  method: 'POST',
  path: '/logout',
  handler: () => {
    const jar = createCookieJar(secret)
    // path / domain 必须与 set / setSigned 时一致
    jar.delete('userId', { path: '/' })
    return jar.apply(json({ ok: true }))
  },
})
```

`delete` 会写入空值、`Max-Age=0` 与过去的 `Expires`（`new Date(0)`），促使浏览器丢弃。

#### 4. `expires` 与 `maxAge` 示例

```typescript
const jar = createCookieJar()

// 从现在起 1 小时
jar.set('a', '1', { maxAge: 3600 })

// 指定绝对过期时刻
jar.set('b', '2', { expires: new Date('2030-01-01T00:00:00Z') })

// 也可用毫秒时间戳
jar.set('c', '3', { expires: Date.now() + 60_000 })
```

#### 5. 手动 sign / unsign

无需中间件时也可直接用工具函数：

```typescript
import { sign, unsign } from '@vafast/cookie'

const signed = sign('u_1', secret) // value.signature（HMAC base64url）
const raw = unsign(signed, secret) // 'u_1' 或 null（校验失败）
```

`unsign` 使用 `timingSafeEqual` 做时间安全比较，降低时序攻击风险。

## API

### 导出

| 导出 | 说明 |
|------|------|
| `cookies` | 解析普通 Cookie 的中间件 |
| `signedCookies` | 解析并校验签名 Cookie 的中间件 |
| `createCookieJar` | 创建 `CookieJar` |
| `CookieJar` | 响应侧 Cookie 组装类 |
| `parseCookies` | 解析 `Cookie` 头字符串 → `Record<string, string>` |
| `serializeCookie` | 序列化为单个 `Set-Cookie` 值 |
| `sign` / `unsign` | HMAC 签名 / 验证 |
| `CookieOptions` | 写入选项类型 |
| `SignedCookiesOptions` | `signedCookies` 配置类型 |

### 选项 / 参数

#### `cookies()`

无参数。解析请求头 `Cookie`，设置 `req.cookies`，并 `next({ cookies })`。

#### `signedCookies(options)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `secret` | `string` | — | **必填**。HMAC 密钥，务必用环境变量中的强随机串 |
| `algorithm` | `string` | `'sha256'` | 传给 `crypto.createHmac` 的算法名 |

#### `createCookieJar(secret?, algorithm?)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `secret` | `string` | — | 调用 `setSigned` 时必填；只 `set` 普通 Cookie 时可省略 |
| `algorithm` | `string` | `'sha256'` | 签名算法，与 `signedCookies` 保持一致 |

#### `CookieOptions`（`set` / `setSigned` / `serializeCookie`）

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `expires` | `Date \| number` | — | 绝对过期时间；`number` 会 `new Date(number)`。序列化为 `Expires=...`（UTC 字符串） |
| `maxAge` | `number` | — | 相对存活秒数，序列化为 `Max-Age=...` |
| `domain` | `string` | — | `Domain=...`。不设则默认为当前主机（不含子域）。删除时需与写入一致 |
| `path` | `string` | `'/'` | `Path=...`。决定哪些路径会带上该 Cookie。删除时需与写入一致 |
| `secure` | `boolean` | `false`（不写 Secure 属性） | 为 `true` 时仅 HTTPS 发送。`SameSite=None` 时浏览器通常要求开启 |
| `httpOnly` | `boolean` | `true` | 默认写入 `HttpOnly`，禁止 `document.cookie` 读取；只有显式传 `false` 才关闭 |
| `sameSite` | `'Strict' \| 'Lax' \| 'None'` | — | 不传则不写 `SameSite` 属性（浏览器走自身默认）。取值含义见上文 |

#### `serializeCookie(name, value, options?)`

把单个 Cookie 编成 `Set-Cookie` 字符串：`name` / `value` 会 `encodeURIComponent`；未传 `path` 时使用 `'/'`；`httpOnly !== false` 时带 `HttpOnly`。

#### `parseCookies(cookieHeader)`

| 参数 | 类型 | 说明 |
|------|------|------|
| `cookieHeader` | `string \| null` | 请求头原始值；`null` / 空则返回 `{}` |

值为 `decodeURIComponent` 后的字符串。

#### `sign(value, secret, algorithm?)` / `unsign(signedValue, secret, algorithm?)`

| 函数 | 返回 | 说明 |
|------|------|------|
| `sign` | `string` | `` `${value}.${hmac_base64url}` `` |
| `unsign` | `string \| null` | 成功返回原文；格式不对或签名不匹配返回 `null` |

### 相关方法

#### `CookieJar`

| 方法 | 说明 |
|------|------|
| `set(name, value, options?)` | 追加普通 Cookie |
| `setSigned(name, value, options?)` | 追加签名 Cookie（需构造时传入 `secret`，否则抛错） |
| `delete(name, options?)` | 删除；`options` 仅支持 `domain` / `path`（与 `Pick<CookieOptions, 'domain' \| 'path'>` 一致） |
| `apply(response)` | 把所有 `Set-Cookie` **append** 到新 `Response` 并返回；无 Cookie 时原样返回 |

链式调用：`jar.set(...).setSigned(...).apply(response)`。

## 最佳实践

1. 会话类数据用 `signedCookies` + 强随机 `secret`（环境变量），读写两侧算法一致
2. 生产开启 `secure: true`，并明确 `sameSite`（多数会话用 `Lax`；跨站带 Cookie 用 `None` + `Secure`）
3. 默认 `httpOnly: true`，除非前端必须读（如主题偏好可关掉）
4. 写完务必 `jar.apply(...)`，否则不会出现在响应头
5. 删除时带上与写入相同的 `path` / `domain`
6. 签名 ≠ 加密：用户仍可解码看到原文，不要把密码等机密只放在 Cookie 里

## 注意事项

- `signedCookies` 会把 **未通过校验** 的值放进普通 `cookies`，不要把 `cookies` 里的同名键当已信任数据
- `setSigned` 未提供 `secret` 时抛错
- 解析时对 value 做 `decodeURIComponent`；非法编码可能导致运行时异常
- 依赖 Node `crypto`（HMAC / `timingSafeEqual`）
- 本包不提供 Cookie 加密 API；需要保密请自行加密或改用服务端 Session

## 相关链接

- [JWT](/middleware/jwt) — 常与 Cookie 一起存 token
- [CORS](/middleware/cors) — 跨域带 Cookie 时需正确配置 credentials / origin
- [中间件系统](/middleware/overview)
