---
title: Auth Middleware - Vafast
---

# Auth Middleware

`@vafast/auth-middleware` 对接独立 **auth-server**，提供 JWT / API Key **硬认证**、`app-id` 校验、守卫与带类型的路由定义器。

硬认证含义：挂了中间件就必须验证成功；失败直接返回错误响应，没有「验证失败当作游客继续」的预配置路径。需要认证就挂，不需要就不挂。

## 先搞清几个概念（给新用户）

### Bearer JWT vs API Key

客户端都走同一个请求头：

```http
Authorization: Bearer <凭证>
```

中间件用 **凭证里是否包含冒号 `:`** 区分两种方式：

| 方式 | 凭证形态 | 行为 |
|------|----------|------|
| **JWT** | 不含 `:` 的 token 字符串 | 调 auth-server `/verifyJwt`；可选把请求头 `app-id` 一并传入 |
| **API Key** | `apiKeyId:secretKey`（含冒号） | 调 `/verifyApiKey`；注入 `userInfo` + `apiKey` |

因此：

- `jwtAuth` / `authenticateJwt`：若 token 含 `:`，直接 401「无效的 JWT Token」
- `apiKeyAuth` / `authenticateApiKey`：若 token 不含 `:`，直接 401「无效的 API Key 格式」
- `auth` / `authenticate` / `authWithApp`：自动按是否含 `:` 分支

注意：这里的 Bearer API Key（用户/调用方凭证）与服务进程调用 auth-server 时用的 `AUTH_SERVICE_API_KEY_ID` / `SECRET`（服务间通信）是两套东西。

### `app-id` 与多租户

多租户接口通常要求请求头：

```http
app-id: <appId>
```

| 中间件 | 作用 |
|--------|------|
| `appValidator` / `validateApp` | 校验 `app-id`，注入 `app` |
| `authWithApp` / `authenticateWithApp` | 用户认证 **且** 校验 `app-id`，一次注入 `userInfo` + `app`（API Key 时还有 `apiKey`） |

JWT 路径下，`authWithApp` 会把 `app-id` 传给 `verifyJwt`；若返回的用户信息没有 `app`，按无效 `app-id` 处理（400）。  
API Key 路径下会再调一次 `verifyApp(appId)`。

若上下文里已有匹配的 `app`（或 `userInfo.app`），`validateApp` / `appValidator` 会复用，避免重复请求。

### 失败码：401 vs 400

本包刻意区分「身份问题」与「租户 / 应用问题」：

| 场景 | 典型状态码 | 说明 |
|------|------------|------|
| 缺少 / 非法 `Authorization` | **401** | 未提供认证信息、无效 JWT / API Key、账号禁用/删除等 |
| JWT / API Key 校验失败 | **401** | auth-server 错误码若在 400–599 会透传，否则回落 401 |
| 缺少 `app-id`（required） | **400** | 如「缺少必需的请求头: app-id」 |
| `app-id` 无效 | **400** | 默认回落 400；auth-server 返回的 4xx/5xx code 可透传 |
| 守卫：无 `userInfo` / 无 `apiKey` | **401** | `requireUser` / `requireApiKey` |
| 守卫：无 `app` | **400** | `requireApp` |
| 守卫：`requireUserAndApp` | 先查用户 **401**，再查 app **400** | |
| auth-server 超时 | **504** 风格 | 文案：认证服务响应超时… |
| auth-server 不可用（网络等） | **503** 风格 | 文案：认证服务暂时不可用… |

实现细节：用户认证失败多用 `throw err(...)`；缺少/无效 `app-id` 多用 `Response.json({ code, message }, { status })`。对调用方而言都是对应 HTTP 状态。

## 安装

```bash
npm install @vafast/auth-middleware
```

## 快速开始

配置环境变量后直接使用预配置中间件：

```bash
AUTH_API_BASE_URL=http://localhost:9003
AUTH_SERVICE_API_KEY_ID=ak_xxx
AUTH_SERVICE_API_KEY_SECRET=sk_xxx
# 可选：AUTH_API_TIMEOUT=5000
```

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'

const routes = defineRoutes([
  defineRoute({
    path: '/api/files',
    middleware: [authWithApp],
    children: [
      defineAuthRouteWithApp({
        method: 'GET',
        path: '/list',
        middleware: [requireUser],
        handler: ({ userInfo, app }) => ({
          userId: userInfo.id,
          appId: app.id,
        }),
      }),
    ],
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

## 用法

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `AUTH_API_BASE_URL` | 是* | auth-server 基础 URL |
| `AUTH_SERVICE_API_KEY_ID` | 否 | 服务间 API Key ID |
| `AUTH_SERVICE_API_KEY_SECRET` | 否 | 服务间 API Key Secret |
| `AUTH_API_TIMEOUT` | 否 | 超时毫秒，默认 `5000` |

\* `createAuthClient` / 懒加载预配置中间件在缺少 `baseUrl`（参数与环境变量都没有）时会抛错。

### 请求头

| Header | 说明 |
|--------|------|
| `Authorization: Bearer <jwt>` | JWT（token 中不能含 `:`） |
| `Authorization: Bearer <apiKeyId>:<secret>` | API Key（必须含冒号） |
| `app-id: <appId>` | 多租户 / `validateApp` / `authWithApp` |

### 预配置中间件（懒加载单例）

首次请求时 `createAuthClient()` 读环境变量，之后复用同一客户端。

| 导出 | 行为 | 注入上下文 |
|------|------|------------|
| `auth` | JWT + API Key 自动识别 | `userInfo`，API Key 时另有 `apiKey` |
| `jwtAuth` | 仅 JWT（含 `:` 视为非法） | `userInfo` |
| `apiKeyAuth` | 仅 API Key | `userInfo` + `apiKey` |
| `appValidator` | 必需 `app-id` 并网络校验 | `app` |
| `authWithApp` | 用户认证 + app（最常用） | `userInfo` + `app`（API Key 时含 `apiKey`） |

```typescript
import { auth, appValidator, authWithApp } from '@vafast/auth-middleware'

middleware: [auth, appValidator]
// 或一步到位
middleware: [authWithApp]
```

### 工厂函数（可传配置 / 共享客户端）

```typescript
import {
  createAuthClient,
  authenticate,
  authenticateJwt,
  authenticateApiKey,
  validateApp,
  authenticateWithApp,
} from '@vafast/auth-middleware'

const client = createAuthClient({
  baseUrl: 'http://127.0.0.1:9003',
  apiKeyId: 'xxx',
  apiKeySecret: 'yyy',
})

const authMw = authenticate(client) // 或 authenticate({ baseUrl: '...' }) / authenticate()
const jwtOnly = authenticateJwt()
const keyOnly = authenticateApiKey()
const appMw = validateApp(undefined, { required: false, verify: true })
const both = authenticateWithApp(client)
```

| 工厂 | 语义化别名 | 说明 |
|------|------------|------|
| `authenticate` | `authJwtAndApiKey` | JWT + API Key |
| `authenticateJwt` | `authJwt` | 仅 JWT |
| `authenticateApiKey` | `authApiKey` | 仅 API Key |
| `validateApp` | `validateAppId` | 校验 `app-id` |
| `authenticateWithApp` | `authApp` | 用户 + app |

`AuthMiddlewareOptions` = `AuthClientConfig | AuthClient | undefined`。

`validateApp(config?, options?)` 的 `options`：

| 字段 | 默认 | 说明 |
|------|------|------|
| `required` | `true` | 缺少 / 无效 `app-id` 时是否拒绝 |
| `verify` | `true` | `false` 时只检查 header，注入最小化 `{ id, name: '', status: 'active' }` |

### 守卫（不发网络请求）

只检查 `__locals` 上下文：

| 守卫 | 条件 | 失败 |
|------|------|------|
| `requireUser` | 有 `userInfo` | 401「未登录或用户信息缺失」 |
| `requireApp` | 有 `app` | 400「缺少有效的 app-id」 |
| `requireApiKey` | 有 `apiKey` | 401「无效的 API Key」 |
| `requireUserAndApp` | 同时有 `userInfo` + `app` | 缺用户 401 / 缺 app 400 |

```typescript
middleware: [auth, appValidator, requireUserAndApp]
```

典型组合：路由组挂 `authWithApp`（或 `auth` + `appValidator`），叶子再挂 `requireUser` 等做类型与运行时双保险。

### 路由定义器

基于 `withContext`，零运行时开销，补齐 handler 类型；内置 `RouteExtensions.webhook`：

| 定义器 | Handler 上下文 |
|--------|----------------|
| `defineAuthRoute` | `{ userInfo: UserInfo }` |
| `defineOptionalAuthRoute` | `{ userInfo?: UserInfo }` |
| `defineApiKeyRoute` | `{ userInfo?, apiKey? }` |
| `defineAuthRouteWithApp` | `{ userInfo, app }` |
| `defineRouteWithApp` | `{ app }` |
| `defineOptionalAuthRouteWithApp` | `{ userInfo?, app }` |
| `defineFullAuthRoute` | `{ userInfo, apiKey?, app }` |

```typescript
defineAuthRouteWithApp({
  method: 'POST',
  path: '/create',
  name: '创建资源',
  webhook: true, // 或 { eventKey, include, exclude }
  middleware: [requireUser],
  handler: ({ userInfo, app }) => ({ userId: userInfo.id, appId: app.id }),
})
```

`RouteExtensions.webhook` 为 `boolean | { eventKey?, include?, exclude? }`（比 `@vafast/webhook` 完整配置更精简；`condition` / `transform` 需用 webhook 包的类型扩展）。

### Auth Client

```typescript
const client = createAuthClient()

await client.verifyJwt(token, appId?)
await client.verifyApiKey(apiKeyId, secretKey)
await client.verifyApp(appId)
await client.getUsersBatch(userIds, options?)
await client.searchUsers({ keyword, appId, current, pageSize }, options?)
await client.getUsersStats({ appId, startTime, endTime }, options?)
```

超时 / 网络错误归一为 504 / 503 风格错误信息；JWT 禁用 / 删除账号返回 401。

## API

### `createAuthClient(config?)`

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `baseUrl` | `string` | `AUTH_API_BASE_URL` | 缺则抛错 |
| `apiKeyId` | `string` | `AUTH_SERVICE_API_KEY_ID` | 服务间 Bearer |
| `apiKeySecret` | `string` | `AUTH_SERVICE_API_KEY_SECRET` | 与 ID 组成 `id:secret` |
| `timeout` | `number` | `AUTH_API_TIMEOUT` 或 `5000` | 毫秒 |

### `UserInfo` 与组织相关字段

```typescript
interface UserInfo {
  id: string
  appId: string
  email?: string
  phone?: string
  avatar?: string
  status?: string
  roleId?: string
  nickname?: string
  verified?: boolean
  /** 组织成员所属组织。组织成员身份直接归属 organization。 */
  organizationId?: string
  /** organization_member 表示组织成员，customer_user 表示客户应用终端用户。 */
  accountType?: string
  /** 组织成员跨 app 访问时为 true，用于区分后台账号和目标 app 终端用户身份 */
  isOrgMemberAccess?: boolean
  /** 本次请求 app-id 指向的目标 app，跨 app 访问时与用户原始 appId 不同 */
  targetAppId?: string
  /** 本次访问模式：direct 为当前 app 用户直接访问，org_member_delegate 为组织成员代理访问。 */
  accessMode?: 'direct' | 'org_member_delegate'
}
```

| 字段 | 含义（与源码注释一致） |
|------|------------------------|
| `organizationId` | 组织成员所属组织；组织成员身份直接归属 organization |
| `accountType` | `organization_member` = 组织成员；`customer_user` = 客户应用终端用户 |
| `isOrgMemberAccess` | 组织成员跨 app 访问时为 `true`，用于区分后台账号与目标 app 终端用户 |
| `targetAppId` | 本次请求 `app-id` 指向的目标 app；跨 app 时与用户原始 `appId` 不同 |
| `accessMode` | `direct`：当前 app 用户直接访问；`org_member_delegate`：组织成员代理访问 |

`VerifiedUserInfo` 在 `UserInfo` 基础上可带 `app?: AppInfo`（JWT 校验结果可能附带已验证的 app 摘要）。

### 其它上下文类型

```typescript
interface ApiKeyInfo {
  id: string
  name: string
  appId: string
  userId: string
  status: string
  permissions?: string[]
}

interface AppInfo {
  id: string
  name: string
  status: string
  /** auth-server 维护的 app 结构化扩展，如 organizationId */
  extensions?: Record<string, unknown>
}
```

### 导出一览

- 客户端：`createAuthClient`、`AuthClient`、`AuthClientConfig`
- 预配置：`auth`、`jwtAuth`、`apiKeyAuth`、`appValidator`、`authWithApp`
- 工厂：`authenticate`、`authenticateJwt`、`authenticateApiKey`、`validateApp`、`authenticateWithApp` 及别名
- 守卫：`requireUser`、`requireApp`、`requireApiKey`、`requireUserAndApp`
- 路由定义器：上表 7 个
- 类型：`UserInfo`、`VerifiedUserInfo`、`ApiKeyInfo`、`AppInfo`、`ApiKeyContext`、`ValidateAppContext`、`AuthWithAppContext`、`ValidateAppOptions`、`RouteExtensions`、`WebhookConfigOptions` 等

## 最佳实践

- 路由组挂 `authWithApp`，叶子挂 `requireUser` 等守卫做断言。
- 公开接口不挂认证中间件。
- 多中间件共享同一 `createAuthClient()` 实例，避免重复配置。
- 全局放 `cors` / `requestId`；认证放路由组，不要全局强制登录。
- 需要区分终端用户与组织成员代理访问时，读取 `accessMode` / `isOrgMemberAccess` / `targetAppId`，不要只看 `userInfo.id`。

## 注意事项

- **硬认证**：挂了就必须成功；没有「软登录失败继续」的预配置中间件（可选上下文靠「不挂 auth」或自建逻辑）。
- 预配置中间件依赖进程环境变量；测试或其它 baseUrl 请用工厂 + 显式 `createAuthClient`。
- `authenticateJwt` / `jwtAuth` 拒绝带 `:` 的 token；`authenticateApiKey` / `apiKeyAuth` 要求 `id:secret`。
- 用户凭证失败多为 **401**；`app-id` 缺失/无效多为 **400**。不要混用语义。
- auth-server 超时返回类 504 文案；不可用类 503。
- 包内 `webhook` 类型扩展仅便于声明；实际分发需安装并 `server.use(webhook(...))`。

## 相关链接

- [中间件系统](/middleware) — `defineMiddleware` / `withContext`
- [Webhook](/middleware/webhook)
- [路由指南](/routing)
- [JWT](/middleware/jwt) — 本地签发 / 校验工具（不对接 auth-server）
