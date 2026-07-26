---
title: Helmet 中间件 - Vafast
---

# Helmet

`@vafast/helmet` 为响应附加常见安全相关 HTTP 头（CSP、HSTS、X-Frame-Options 等）。只改响应头，不改业务逻辑。

调用 `vafastHelmet(config?)` 返回中间件：在 `next()` 拿到业务响应后，把安全头合并进新的 `Response` 再返回。

## 先搞清几个概念（给新用户）

浏览器会按响应头决定「能不能嵌 iframe」「脚本从哪加载」「是否强制 HTTPS」等。Helmet 就是帮你批量写好这些头，减少漏配。

| 名词 | 白话 |
|------|------|
| **CSP（Content-Security-Policy）** | 告诉浏览器：脚本、样式、图片、接口请求等**允许从哪些来源加载**。收紧后可明显降低 XSS 注入脚本的危害 |
| **Nonce** | 一次性随机串。开启 `useNonce` 后写入 CSP，并额外返回 `X-Nonce`。页面里内联 `<script>` / `<style>` 需带上同一 nonce，才允许执行 |
| **HSTS（Strict-Transport-Security）** | 告诉浏览器：以后访问本站必须用 HTTPS，并记住一段时间。**本包仅在 `NODE_ENV === 'production'` 时写出**，避免本地 HTTP 开发被「锁死」 |
| **X-Frame-Options** | 控制本站能否被别的页面用 `<iframe>` 嵌入，用来防点击劫持 |
| **Referrer-Policy** | 控制跳转到外站时，浏览器会不会带上完整来源 URL（可能含路径、查询串） |
| **Permissions-Policy** | 控制页面能否用摄像头、麦克风、定位等浏览器能力；空数组 `[]` 表示禁用该能力 |
| **CORP / COOP** | 跨源资源策略 / 跨源打开者策略：限制谁能加载你的资源、弹窗之间是否共享浏览上下文（与隔离、安全相关） |
| **Report-To** | 告诉浏览器把违规/崩溃等报告发到哪些端点（配合监控） |

不必一次全懂：默认配置已经可用；业务有 CDN、第三方脚本时再改 CSP。

## 安装

```bash
npm install @vafast/helmet
```

## 快速开始

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

零配置时会带上默认 CSP、`X-Frame-Options: DENY`、XSS 相关头、Referrer-Policy、Permissions-Policy、CORP/COOP 等；HSTS 仅在生产环境出现。另会**始终**设置 `X-Content-Type-Options: nosniff`（不可通过选项关闭）。

## 用法

### 全局挂载

```typescript
server.use(vafastHelmet())
```

### 单路由挂载

```typescript
defineRoute({
  method: 'GET',
  path: '/secure',
  middleware: [vafastHelmet()],
  handler: () => json({ ok: true }),
})
```

### 自定义 CSP

传入的 `csp` 会与默认 CSP **浅合并**（只覆盖你写的字段，其余保留默认）：

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

### 开启 CSP Nonce

`csp.useNonce: true` 时会生成 nonce，写入 `script-src` / `style-src`，并额外设置响应头 `X-Nonce`（业务侧把该值注入 HTML 模板）：

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

### Report-Only 模式

先观察违规、不拦截加载，适合上线前试跑：

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

此时写出的是 `Content-Security-Policy-Report-Only`，而不是正式的 `Content-Security-Policy`。

### 配置 Report-To

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

### 额外自定义头

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

### 导出

| 导出 | 说明 |
|------|------|
| `vafastHelmet(config?)` | 主入口，返回中间件 |
| `elysiaHelmet` | `vafastHelmet` 的兼容别名 |
| `permission` | CSP 常用字面量常量（见下表） |
| `SecurityConfig` | 顶层配置类型 |
| `CSPConfig` | CSP 子配置类型 |
| `HSTSConfig` | HSTS 子配置类型 |
| `ReportToConfig` | Report-To 单项配置类型 |

### `vafastHelmet(config?: Partial<SecurityConfig>)`

未传的字段使用默认值；`csp` / `hsts` / `permissionsPolicy` 在传入时与默认对象**浅合并**。

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `csp` | `CSPConfig` | 见下方「默认 CSP」与「CSP 指令含义」 | Content-Security-Policy（或 Report-Only 变体） |
| `frameOptions` | `'DENY' \| 'SAMEORIGIN' \| 'ALLOW-FROM'` | `'DENY'` | `X-Frame-Options`。`DENY` = 禁止任何嵌入；`SAMEORIGIN` = 仅同源可嵌；`ALLOW-FROM` 为历史取值，现代浏览器支持差，一般不要用 |
| `xssProtection` | `boolean` | `true` | 为 `true` 时写 `X-XSS-Protection: 1; mode=block`（旧浏览器遗留机制；现代防护仍主要靠 CSP） |
| `dnsPrefetch` | `boolean` | `false` | `X-DNS-Prefetch-Control`：`true` → `on`，`false` → `off` |
| `referrerPolicy` | 见下方枚举 | `'strict-origin-when-cross-origin'` | `Referrer-Policy`：控制外链请求携带多少 Referer |
| `permissionsPolicy` | `Record<string, string[]>` | 见下方「默认 Permissions-Policy」 | `Permissions-Policy`；某能力对应**空数组**表示禁用 |
| `hsts` | `HSTSConfig` | `{ maxAge: 15552000, includeSubDomains: true, preload: true }` | **仅 `NODE_ENV === 'production'` 时写入** `Strict-Transport-Security` |
| `corp` | `'same-origin' \| 'same-site' \| 'cross-origin'` | `'same-origin'` | `Cross-Origin-Resource-Policy`：谁可以加载本响应为资源 |
| `coop` | `'unsafe-none' \| 'same-origin-allow-popups' \| 'same-origin'` | `'same-origin'` | `Cross-Origin-Opener-Policy`：与弹窗 / `window.opener` 隔离相关 |
| `reportTo` | `ReportToConfig[]` | — | `Report-To` 头（JSON）；未配置则不写 |
| `customHeaders` | `Record<string, string>` | — | 额外自定义响应头，直接合并 |

另会始终设置 `X-Content-Type-Options: nosniff`（防止浏览器把非脚本 MIME 误当成脚本执行）。

#### `referrerPolicy` 可选值

| 值 | 白话 |
|----|------|
| `no-referrer` | 从不发送 Referer |
| `no-referrer-when-downgrade` | HTTPS→HTTP 时不发，其它情况发完整 URL |
| `origin` | 只发源（协议+主机+端口） |
| `origin-when-cross-origin` | 同源发完整 URL，跨源只发 origin |
| `same-origin` | 仅同源请求带 Referer |
| `strict-origin` | 只发 origin；HTTPS→HTTP 不发 |
| `strict-origin-when-cross-origin`（默认） | 同源完整 URL；跨源只发 origin；降级不发 |
| `unsafe-url` | 总是发完整 URL（可能泄露路径/查询串，慎用） |

#### 默认 CSP

| 指令（配置字段） | 默认值 |
|------------------|--------|
| `defaultSrc` | `[permission.SELF]`（`'self'`） |
| `scriptSrc` | `[permission.SELF, permission.UNSAFE_INLINE]` |
| `styleSrc` | `[permission.SELF, permission.UNSAFE_INLINE]` |
| `imgSrc` | `[permission.SELF, permission.DATA, permission.BLOB]` |
| `fontSrc` | `[permission.SELF]` |
| `connectSrc` | `[permission.SELF]` |
| `frameSrc` | `[permission.SELF]` |
| `objectSrc` | `[permission.NONE]` |
| `baseUri` | `[permission.SELF]` |

默认含 `'unsafe-inline'`，是为了让未改造的内联脚本/样式先能跑；生产建议逐步去掉，改用 nonce 或外链。

#### CSP 指令含义（`CSPConfig`）

配置字段为 camelCase，写出的头里会转成 kebab-case（如 `scriptSrc` → `script-src`）。数组里每一项是一个允许的源表达式。

| 字段 | 对应指令 | 白话 |
|------|----------|------|
| `defaultSrc` | `default-src` | **兜底**：其它未单独声明的资源类型走这里 |
| `scriptSrc` | `script-src` | 允许执行哪些脚本来源 |
| `styleSrc` | `style-src` | 允许加载哪些样式来源 |
| `imgSrc` | `img-src` | 允许加载哪些图片来源 |
| `fontSrc` | `font-src` | 允许加载哪些字体来源 |
| `connectSrc` | `connect-src` | 允许 `fetch` / XHR / WebSocket 等连哪些源 |
| `frameSrc` | `frame-src` | 允许本页嵌哪些源的 frame / iframe |
| `objectSrc` | `object-src` | 允许 `<object>` / `<embed>` / `<applet>` 的源；默认 `'none'` |
| `baseUri` | `base-uri` | 限制 `<base href>` 能设到哪，防被改基准 URL |
| `reportUri` | `report-uri` | CSP 违规报告提交地址（字符串，不是数组） |
| `useNonce` | —（布尔开关） | 为 `true` 时给 `script-src` / `style-src` 追加 `'nonce-...'`，并写响应头 `X-Nonce` |
| `reportOnly` | —（布尔开关） | 为 `true` 时使用 `Content-Security-Policy-Report-Only`，只上报不拦截 |

`useNonce` / `reportOnly` **不会**被拼进 CSP 指令字符串，只影响生成逻辑。

#### `HSTSConfig`

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `maxAge` | `number` | `15552000`（约 180 天） | 浏览器记住「必须 HTTPS」的秒数。初始化时若 `< 0` 会抛错 |
| `includeSubDomains` | `boolean` | `true` | 为 `true` 时附加 `; includeSubDomains`，子域也强制 HTTPS |
| `preload` | `boolean` | `true` | 为 `true` 时附加 `; preload`（提交浏览器预加载列表时需要；未全站 HTTPS 勿开） |

再次强调：即使配置了 `hsts`，**非 production 也不会写出** `Strict-Transport-Security`。

#### 默认 Permissions-Policy

| 能力键 | 默认 | 白话 |
|--------|------|------|
| `camera` | `[]` | 禁用摄像头 |
| `microphone` | `[]` | 禁用麦克风 |
| `geolocation` | `[]` | 禁用地理位置 |
| `interest-cohort` | `[]` | 禁用 FLoC / interest-cohort 类追踪相关能力 |

空数组序列化为 `camera=()` 这种「不允许任何源」的形式。若要允许自身：`{ camera: ["self"] }`（键名按浏览器 Permissions-Policy 规范书写）。

传入 `permissionsPolicy` 时与默认表**浅合并**（只覆盖你写的键）。

#### `ReportToConfig`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `group` | `string` | 是 | 端点组名 |
| `maxAge` | `number` | 是 | 配置缓存秒数；`< 0` 时初始化抛错 |
| `endpoints` | `Array<{ url: string; priority?: number; weight?: number }>` | 是 | 至少一个端点，否则初始化抛错 |
| `includeSubdomains` | `boolean` | 否 | 是否包含子域 |

写出时字段名会转为规范 JSON：`max_age`、`include_subdomains`。

#### `permission` 常量

写 CSP 数组时优先用常量，避免漏引号：

| 常量 | 值 | 白话 |
|------|-----|------|
| `permission.SELF` | `'self'` | 允许与当前文档同源 |
| `permission.UNSAFE_INLINE` | `'unsafe-inline'` | 允许内联脚本/样式（削弱 XSS 防护，尽量少用） |
| `permission.HTTPS` | `https:` | 允许任意 HTTPS 源（很宽） |
| `permission.DATA` | `data:` | 允许 `data:` URL（常见于小图） |
| `permission.NONE` | `'none'` | 不允许任何源 |
| `permission.BLOB` | `blob:` | 允许 `blob:` URL |

也可在数组里直接写具体源，如 `'https://cdn.example.com'`。

## 最佳实践

- 生产环境再依赖 HSTS；本地开发不要强行模拟 `NODE_ENV=production`，除非已全站 HTTPS。
- CSP 按业务收紧：尽量去掉 `'unsafe-inline'`，需要内联脚本时用 `useNonce`。
- 对外嵌入第三方页面时，按需放宽 `frameOptions` / `corp` / `coop`，避免误伤合法跨域。
- 新策略可先用 `csp.reportOnly: true` 收集违规，再切正式拦截。
- 使用 CDN / 第三方埋点时，把对应域名加进 `scriptSrc` / `connectSrc` / `imgSrc`，否则会被浏览器拦掉。

## 注意事项

- HSTS **只在生产环境**写出；非 production 即使配置了 `hsts` 也不会设置该头。
- `hsts.maxAge < 0` 或 `reportTo` 配置非法（`maxAge < 0`、endpoints 为空）会在**初始化时**抛错。
- 中间件在 `next()` 之后包装 `Response` 写入头；下游若返回不可变 Headers，行为取决于运行时。
- `frameOptions: 'ALLOW-FROM'` 已过时，现代浏览器请优先用 CSP 的 `frame-ancestors`（本包 CSP 配置未单独暴露该指令字段；若需要可考虑 `customHeaders` 或收紧其它策略）。
- Nonce 每次请求重新生成；SSR 页面必须把当次响应的 `X-Nonce` 注入到 HTML，不能写死。

## 相关链接

- [CORS](/middleware/cors)
- [MDN · CSP](https://developer.mozilla.org/docs/Web/HTTP/CSP)
- [MDN · HSTS](https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [中间件系统](/middleware)
