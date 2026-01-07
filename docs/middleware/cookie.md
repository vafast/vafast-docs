---
title: Cookie 中间件 - Vafast
---

# Cookie 中间件

用于解析和设置 Cookie 的中间件。

## 安装

```bash
npm install @vafast/cookie
```

## 使用

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'
import { cookie } from '@vafast/cookie'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/profile',
    middleware: [cookie()],
    handler: createHandler(({ cookies }) => {
      const sessionId = cookies.get('session')
      return { sessionId }
    })
  },
  {
    method: 'POST',
    path: '/login',
    middleware: [cookie()],
    handler: createHandler(({ setCookie }) => {
      setCookie('session', 'abc123', {
        httpOnly: true,
        secure: true,
        maxAge: 3600
      })
      return { success: true }
    })
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

## 配置项

```typescript
cookie({
  secret: 'my-secret-key',  // 签名密钥
  decode: decodeURIComponent,
  encode: encodeURIComponent
})
```

### secret

用于签名 Cookie 的密钥。设置后可使用 `getSignedCookie` 和 `setSignedCookie`。

## API

### cookies.get(name)

获取 Cookie 值。

### cookies.getAll()

获取所有 Cookie。

### setCookie(name, value, options)

设置 Cookie。

**options:**

| 属性 | 类型 | 说明 |
|------|------|------|
| `maxAge` | `number` | 过期时间（秒） |
| `expires` | `Date` | 过期日期 |
| `path` | `string` | Cookie 路径 |
| `domain` | `string` | Cookie 域名 |
| `secure` | `boolean` | 仅 HTTPS |
| `httpOnly` | `boolean` | 禁止 JS 访问 |
| `sameSite` | `'strict' \| 'lax' \| 'none'` | SameSite 策略 |

### deleteCookie(name)

删除 Cookie。

## 签名 Cookie

```typescript
import { cookie } from '@vafast/cookie'

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/secure',
    middleware: [cookie({ secret: 'my-secret' })],
    handler: createHandler(({ setSignedCookie, getSignedCookie }) => {
      // 设置签名 Cookie
      setSignedCookie('user', 'john', { httpOnly: true })
      
      // 获取签名 Cookie（自动验证签名）
      const user = getSignedCookie('user')
      
      return { user }
    })
  }
])
```

## 相关链接

- [GitHub](https://github.com/vafast/vafast-cookie)
- [npm](https://www.npmjs.com/package/@vafast/cookie)

