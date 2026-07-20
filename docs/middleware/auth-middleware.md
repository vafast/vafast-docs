---
title: Auth Middleware - Vafast
---

# Auth Middleware

`@vafast/auth-middleware` 是面向多租户后端的认证中间件包，对接独立认证服务，开箱即用。

适用于需要 **JWT / API Key 认证**、**app-id 验证**、**类型安全路由包装** 的 API 服务。

```bash
npm install @vafast/auth-middleware
```

## 设计理念

- **硬认证**：需要认证的路由加中间件，不需要就不加，无隐式全局认证
- **上下文注入**：通过 `defineMiddleware` + `next({ userInfo, app })` 向下游传递
- **类型安全路由包装**：`defineAuthRouteWithApp` 等定义器让 handler 自动获得 `userInfo`、`app` 类型
- **守卫分层**：认证中间件负责网络验证，`requireUser` / `requireApp` 负责轻量上下文检查

## 快速开始

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
    middleware: [authWithApp], // 父级：JWT/API Key + app-id 验证
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

## 环境变量

不传配置时，中间件自动读取以下环境变量：

| 变量 | 说明 |
|------|------|
| `AUTH_API_BASE_URL` | 认证服务地址，如 `http://127.0.0.1:9003` |
| `AUTH_SERVICE_API_KEY_ID` | 服务间通信 API Key ID |
| `AUTH_SERVICE_API_KEY_SECRET` | 服务间通信 API Key Secret |
| `AUTH_API_TIMEOUT` | 请求超时（毫秒），默认 5000 |

也可手动传入：

```typescript
import { createAuthClient, authenticate } from '@vafast/auth-middleware'

const client = createAuthClient({
  baseUrl: 'http://127.0.0.1:9003',
  apiKeyId: 'xxx',
  apiKeySecret: 'yyy',
})

const auth = authenticate(client)
```

## 认证中间件

### 预配置中间件（推荐）

懒加载单例，直接 `middleware: [auth]` 使用：

| 中间件 | 说明 |
|--------|------|
| `auth` | JWT + API Key 混合认证，注入 `userInfo`（及可选 `apiKey`） |
| `jwtAuth` | 仅 JWT |
| `apiKeyAuth` | 仅 API Key |
| `appValidator` | 验证 `app-id` header，注入 `app` |
| `authWithApp` | 用户认证 + app 验证，一次注入 `userInfo` + `app`（**最常用**） |

### 工厂函数

需要自定义配置时使用：

| 函数 | 说明 |
|------|------|
| `authenticate()` | JWT + API Key 混合认证 |
| `authenticateJwt()` | 仅 JWT |
| `authenticateApiKey()` | 仅 API Key |
| `validateApp()` | 验证 app-id |
| `authenticateWithApp()` | 用户认证 + app 验证 |

语义化别名：`authJwtAndApiKey`、`authJwt`、`authApiKey`、`validateAppId`、`authApp`。

### 请求头约定

| Header | 说明 |
|--------|------|
| `Authorization: Bearer <jwt>` | JWT 认证 |
| `Authorization: Bearer <apiKeyId>:<secret>` | API Key 认证 |
| `app-id: <appId>` | 多租户应用标识 |

认证失败抛出 `VafastError`，由框架 `errorHandler` 转为 JSON 响应。

## 守卫（Guards）

守卫只做上下文检查，**不发网络请求**，配合认证中间件使用：

| 守卫 | 说明 | 典型组合 |
|------|------|---------|
| `requireUser` | 要求 `userInfo` 存在 | `[auth, requireUser]` |
| `requireApp` | 要求 `app` 存在 | `[appValidator, requireApp]` |
| `requireApiKey` | 要求 `apiKey` 存在 | `[apiKeyAuth, requireApiKey]` |
| `requireUserAndApp` | 同时要求 `userInfo` + `app` | `[auth, appValidator, requireUserAndApp]` |

```typescript
defineAuthRouteWithApp({
  method: 'POST',
  path: '/create',
  middleware: [requireUser], // 父级已 authWithApp，此处只检查 userInfo
  handler: ({ userInfo, app, body }) => { ... },
})
```

## 路由定义器

由 `withContext` 封装，**零运行时开销**，仅提供 TypeScript 类型推断：

| 定义器 | Handler 上下文 | 适用场景 |
|--------|---------------|---------|
| `defineAuthRoute` | `{ userInfo }` | 只需用户，不需 app |
| `defineAuthRouteWithApp` | `{ userInfo, app }` | 认证 + 多租户 app（**最常用**） |
| `defineRouteWithApp` | `{ app }` | 只需 app，不需用户 |
| `defineOptionalAuthRoute` | `{ userInfo? }` | 可选登录 |
| `defineOptionalAuthRouteWithApp` | `{ userInfo?, app }` | 可选登录 + app |
| `defineApiKeyRoute` | `{ userInfo?, apiKey? }` | API Key 场景 |
| `defineFullAuthRoute` | `{ userInfo, apiKey?, app }` | 完整认证上下文 |

所有定义器内置 `webhook` 扩展字段类型支持。

## 生产模式

### 路由组 + 子路由

```typescript
import { defineRoute, defineRoutes, Type, err } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
  defineRouteWithApp,
} from '@vafast/auth-middleware'

const createHandler = defineAuthRouteWithApp({
  method: 'POST',
  path: '/create',
  name: '创建文件',
  webhook: true,
  middleware: [requireUser],
  schema: {
    body: Type.Object({
      name: Type.String(),
      bucketId: Type.String(),
    }),
  },
  handler: async ({ body, userInfo, app }) => {
    // userInfo、app 均有完整类型
    return { appId: app.id, creatorId: userInfo.id, ...body }
  },
})

export const filesRoutes = defineRoutes([
  defineRoute({
    path: '/files',
    name: '文件',
    description: '文件管理相关接口',
    middleware: [authWithApp],
    children: [createHandler],
  }),
])
```

### 服务入口

```typescript
import { Server, serve, defineRoute, defineRoutes } from 'vafast'
import { cors } from '@vafast/cors'
import { requestId } from '@vafast/request-id'
import { requestLogger } from '@vafast/request-logger'
import { filesRoutes } from './routes/files'

const BASE_PATH = '/api'

const rootRoutes = defineRoutes([
  defineRoute({ method: 'GET', path: '/', handler: () => ({ status: 'ok' }) }),
])

const routesWithBasePath = filesRoutes.map(route => ({
  ...route,
  path: BASE_PATH + route.path,
}))

const server = new Server([...rootRoutes, ...routesWithBasePath])

server.use(cors())
server.use(requestId())
server.use(requestLogger({ service: 'my-api', url: '...' }))

serve({
  fetch: server.fetch,
  port: 3000,
  gracefulShutdown: true,
  trustProxy: true,
})
```

### 路由分层

| 层级 | 中间件 | 说明 |
|------|--------|------|
| 全局 | `cors`、`requestId`、`requestLogger` | `server.use()` |
| 路由组 | `authWithApp` | 父级 `defineRoute` 注入上下文 |
| 子路由 | `requireUser` | 按需追加守卫 |
| 无需认证 | 不加中间件 | 健康检查、公开接口 |

## 类型定义

```typescript
interface UserInfo {
  id: string
  appId: string
  email?: string
  nickname?: string
  status?: string
  roleId?: string
  organizationId?: string
  accountType?: string
  // ...
}

interface AppInfo {
  id: string
  name: string
  status: string
  extensions?: Record<string, unknown>
}

interface ApiKeyInfo {
  id: string
  name: string
  appId: string
  userId: string
  permissions?: string[]
}
```

## 与 @vafast/jwt 的区别

| | `@vafast/jwt` | `@vafast/auth-middleware` |
|--|---------------|---------------------------|
| 定位 | 通用 JWT 解析/验证 | 对接独立认证服务的完整方案 |
| app-id | 不支持 | 内置多租户 app 验证 |
| API Key | 不支持 | 内置 |
| 路由定义器 | 无 | 内置 `defineAuthRouteWithApp` 等 |
| 适用 | 简单自建认证 | 多租户 / 微服务鉴权 |

简单项目用 `@vafast/jwt`；需要远程校验 JWT / API Key、多租户 `app-id` 时用 `@vafast/auth-middleware`。

## 相关链接

- [中间件系统](/middleware) — `defineMiddleware` 与 `withContext` 原理
- [Webhook](/middleware/webhook) — `webhook: true` 路由扩展
- [路由指南](/routing) — 嵌套路由与类型推断
