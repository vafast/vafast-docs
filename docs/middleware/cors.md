---
title: CORS 中间件 - Vafast
---

# CORS

`@vafast/cors` 为响应补充 [跨源资源共享](https://developer.mozilla.org/docs/Web/HTTP/CORS) 相关头，并可自动处理 `OPTIONS` 预检（默认开启）。

默认配置较宽松（允许任意 Origin、反射方法 / 头、允许 credentials），生产环境请按域名收紧。

## 先搞清几个概念（给新用户）

浏览器的**同源策略**默认禁止网页随便读另一个源（协议 / 主机 / 端口不同）的响应。CORS 是服务端通过响应头「声明哪些跨源访问是允许的」的机制。

| 名词 | 白话 |
|------|------|
| **Origin（源）** | 如 `https://app.example.com:443`。前端页面所在源会出现在请求头 `Origin` 里 |
| **简单请求** | 部分 GET/POST 等在限定条件下可直接发；浏览器仍会检查响应里的 CORS 头是否允许前端读结果 |
| **预检（preflight）** | 浏览器先发一次 `OPTIONS`，问「能不能用这些方法/头跨域？」；通过后再发真正的 POST/PUT 等。本包默认拦截 `OPTIONS` 并返回 `204` |
| **`Access-Control-Allow-Origin`（ACAO）** | 告诉浏览器：哪个源可以读这个响应。可以是具体源，或（无 credentials 时）`*` |
| **credentials** | 跨域请求是否带 Cookie、HTTP 认证、TLS 客户端证书等。前端需 `fetch(..., { credentials: 'include' })`，服务端需 `Access-Control-Allow-Credentials: true` |
| **为何 credentials 不能配 ACAO `*`？** | 浏览器规范：带凭证时，`Access-Control-Allow-Origin` **必须是具体源**，不能是通配 `*`。本包默认 `origin: true` 会**回显**请求的 `Origin`，以便与默认 `credentials: true` 兼容 |
| **`Access-Control-Allow-Methods` / `-Headers`** | 预检时声明允许的方法、请求头 |
| **`Access-Control-Expose-Headers`** | 声明前端 JS **可以读取**哪些响应头（默认很多头对跨域脚本不可见） |
| **`Access-Control-Max-Age`** | 预检结果缓存秒数，减少反复 OPTIONS |

## 安装

```bash
npm install @vafast/cors
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(cors())

serve({ fetch: server.fetch, port: 3000 })
```

## 用法

### 基础用法

推荐全局挂载，这样业务响应与错误响应都会带上 CORS 头（洋葱模型下，`next()` 之后统一后处理）。

```typescript
server.use(cors())
```

也可挂在单条路由的 `middleware` 上。

### 常见场景

#### 1. 允许指定前端域名

```typescript
server.use(
  cors({
    origin: ['https://example.com', 'https://app.example.com'],
    credentials: true,
  }),
)
```

匹配成功时，`Access-Control-Allow-Origin` 设为请求的 `Origin`。

#### 2. 用正则放行子域

```typescript
server.use(
  cors({
    origin: /https:\/\/.*\.example\.com$/,
  }),
)
```

正则对请求头 `Origin` 做 `RegExp.test`。

#### 3. 函数动态判断

```typescript
server.use(
  cors({
    origin: (request) => {
      const origin = request.headers.get('Origin')
      return origin?.endsWith('.example.com') ?? false
    },
  }),
)
```

函数必须 **显式返回 `true`** 才放行（返回 `void` / `false` 都不行）。

#### 4. 限制方法与请求头

```typescript
server.use(
  cors({
    origin: 'https://example.com',
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 600,
  }),
)
```

#### 5. 关闭自动预检

若你自己实现 `OPTIONS` 路由，可关掉：

```typescript
server.use(cors({ preflight: false }))
```

## API

### 导出

| 导出 | 说明 |
|------|------|
| `cors` | 工厂函数，返回中间件 |
| `default` | 同 `cors` |
| `HTTPMethod` | 允许的方法字面量类型（含 `GET` / `POST` / `OPTIONS` 等标准与扩展方法名） |

### 选项 / 参数

```typescript
cors(config?: CORSConfig)
```

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `origin` | `boolean \| string \| RegExp \| ((request: Request) => boolean \| void) \| Array<string \| RegExp \| 函数>` | `true` | 控制 `Access-Control-Allow-Origin` / `Vary`。详见下方 **origin 行为** |
| `methods` | `boolean \| null \| '' \| '*' \| HTTPMethod \| string \| 数组` | `true` | `Access-Control-Allow-Methods`。详见 **methods 行为** |
| `allowedHeaders` | `true \| string \| string[]` | `true` | `Access-Control-Allow-Headers`。数组会先 `join(', ')` |
| `exposeHeaders` | `true \| string \| string[]` | `true` | `Access-Control-Expose-Headers`。数组会先 `join(', ')` |
| `credentials` | `boolean` | `true` | 为 `true` 时写 `Access-Control-Allow-Credentials: true`（预检与实际请求都会写） |
| `maxAge` | `number` | — | 设置后写入 `Access-Control-Max-Age`；**未传则不写该头** |
| `preflight` | `boolean` | `true` | 为 `true` 时拦截 `OPTIONS`，直接返回 `204` + CORS 头，不再进入后续路由 |

#### `origin` 行为（与源码一致）

| 值 | 行为 |
|----|------|
| `true`（默认） | 设置 `Vary: *`；`Access-Control-Allow-Origin` = 请求的 `Origin`，若无 `Origin` 则为 `*` |
| 字符串 | 与请求 `Origin` 精确匹配；也支持去掉 `://` 后的 host 与配置字符串比较。匹配则回显该 `Origin`，并 `Vary: Origin`（有 origin 配置时） |
| 数组中的字符串 | 同上；任一字符串命中即放行 |
| `'*'`（出现在列表中，使 `anyOrigin` 为真） | 设为 `Access-Control-Allow-Origin: *`，并 `Vary: *`。**与 `credentials: true` 组合时，浏览器通常会拒绝带 Cookie 的跨域响应** |
| `RegExp` | 对请求头 `Origin` 做 `test`；命中则回显该 `Origin` |
| `Function` | 入参为 `Request`；返回值**严格等于** `true` 时放行并回显 `Origin`；`void` / `false` 均不放行 |
| 数组（混合） | 按上列规则依次尝试，任一命中即放行 |
| `false` / 空数组等导致无可用规则 | 可能不设置有效的 ACAO（跨域前端读不到响应） |

> 类型注释里「`origin: true` 等于设为 `*`」**不准确**：实现是 **回显请求 Origin**（无 Origin 时才是 `*`），以便与默认 `credentials: true` 兼容。以本节表格为准。

#### `methods` 行为

| 值 | 行为 |
|----|------|
| `true`（默认） | 预检时镜像请求头 `Access-Control-Request-Method`；实际请求镜像当前 `request.method` |
| `'*'` | 固定写入 `Access-Control-Allow-Methods: *` |
| 单个方法字符串 / 逗号分隔字符串 | 直接写入 |
| 方法数组 | `join(', ')` 后写入 |
| `false` / `null` / `''` / 空数组 | 不设置该头 |

#### `allowedHeaders` / `exposeHeaders`

| 值 | 行为 |
|----|------|
| `true`（默认） | **预检**：`allowedHeaders` 镜像 `Access-Control-Request-Headers`；`exposeHeaders` 取当前请求头名列表。**实际请求**：两者都取当前请求头名列表 |
| 字符串 | 直接写入对应响应头 |
| 字符串数组 | 先 join 成逗号分隔字符串再写入 |

### 相关方法

无额外辅助函数。预检响应使用框架的 `empty(204)`。

中间件内部有一处预检辅助逻辑与正式分支等价；对外只暴露 `cors()`。

## 最佳实践

1. 生产把 `origin` 收成白名单（字符串数组或函数），避免默认「任意源 + credentials」
2. 需要带 Cookie 跨域时：`credentials: true`，且 ACAO **必须是具体源**——用白名单或默认的「回显 Origin」；不要用列表里的 `'*'`
3. 前端配合：`fetch(url, { credentials: 'include' })`（或 axios `withCredentials: true`），否则浏览器不会带 Cookie
4. 明确列出 `methods` / `allowedHeaders`，减少预检缓存与安全面
5. 合理设置 `maxAge`，降低预检频率
6. 若响应里有自定义头要给前端读（如 `X-Request-Id`），务必写进 `exposeHeaders`

## 注意事项

- `preflight: true` 时，所有 `OPTIONS` 由本中间件直接结束，不会进入后续路由
- `maxAge` 的 JSDoc 曾写默认 `5`，**源码未设默认值**：只有传入数字才会写头
- 实际请求路径不吞掉 handler 抛错，CORS 头会加在 errorHandler 返回的响应上（只要仍经过此后处理）
- `credentials: true` 时，浏览器要求 ACAO 为具体源；若你强制 `origin: '*'`（或数组含 `'*'` 触发 anyOrigin），可能与 credentials 冲突
- 本地调试时注意前端源（如 `http://localhost:5173`）与白名单字符串必须完全一致（含协议与端口）

## 相关链接

- [Helmet](/middleware/helmet)
- [Cookie](/middleware/cookie) — 跨域会话常与 credentials 一起使用
- [中间件系统](/middleware/overview)
- [MDN · CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS)
