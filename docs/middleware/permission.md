---
title: Permission 中间件 - Vafast
---

# Permission

`@vafast/permission`：在路由上声明 `permission`，通过角色表展开 grants，在 handler **之前**做 RBAC 校验。

它解决的是「这个身份能不能调用这个接口」，而不是「这个请求是谁」（那是 [@vafast/auth-middleware](/middleware/auth-middleware) 的事）。

设计对齐 [Webhook](/middleware/webhook)：路由扩展字段、路径推导 key、从 RouteRegistry 收集目录。与具体组织 / 租户模型解耦。

::: tip 和 Webhook 挂载的差别
| | Webhook | Permission |
|--|---------|------------|
| 时机 | `next()` **之后**异步发事件 | handler **之前**拦截 |
| 挂法 | 可以 `server.use(webhook(...))` | **必须**在认证后：`middleware: [authWithApp, orgPermission]` |

不要 `server.use(orgPermission)`：全局中间件早于路由 auth，读不到 `userInfo` / `app`。
:::

## 先搞清几个概念（给新用户）

### Permission key 是什么？

一次权限校验对应一个 **权限键**（如 `billing.points.adjust`）。建议形态：

```text
{domain}.{module}.{action}
```

与 webhook 的 `eventKey` 一样：**默认从路径自动生成**，也可显式覆盖。

| 路径 | pathPrefix | 自动 key |
|------|--------------|----------|
| `/billing/points/adjust` | （无） | `billing.points.adjust` |
| `/restfulApi/auth/signIn` | `/restfulApi` | `auth.signIn` |

**Grant（持有）** 侧可带通配：

| Grant | 能匹配的需求 |
|-------|----------------|
| `billing.points.adjust` | 仅自身 |
| `billing.points.*` | `billing.points` 及其所有下级 |
| `billing.*` | `billing` 及其所有下级 |
| `*` | 一切 |

### 角色、grants、路由需求如何串起来？

```text
认证（authWithApp）
  → getRole 得到角色（owner / admin / …）
  → roles 表展开成 grants
  → 与路由 permission 比对
  → 放行或 401 / 403
```

业务侧封装一次 `createPermissionMiddleware`；需要管控的路由写 `permission: true`。未声明则只认证、不查权限。

### 失败码：401 vs 403

| 场景 | 状态码 |
|------|--------|
| `getRole` 返回 `null`（无主体） | **401** |
| 有角色但 grants 不覆盖需求 | **403** |

## 安装

```bash
npm install @vafast/permission
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import {
  createPermissionMiddleware,
  defineRoles,
} from '@vafast/permission'

/** 业务封装一次；挂在认证之后的路由组上 */
export const orgPermission = createPermissionMiddleware({
  // 有统一 API 前缀时写，对齐 webhook.pathPrefix
  pathPrefix: '/api',
  roles: defineRoles({
    owner: ['*'],
    admin: ['billing.*', 'users.*'],
    finance: ['billing.points.*'],
    member: ['billing.points.read'],
  }),
  // 示例用请求头；生产改为查组织角色 / JWT claims / DB
  getRole: (req) => req.headers.get('x-role'),
  // 默认不缓存。需要时可开：
  // cache: { cacheKey: cacheKeyFromUserAndApp, ttlMs: 60_000 },
})

const routes = defineRoutes([
  defineRoute({
    path: '/api',
    // 生产：middleware: [authWithApp, orgPermission]
    middleware: [orgPermission],
    children: [
      defineRoute({
        method: 'GET',
        path: '/billing/points/read',
        name: '积分余额',
        permission: true, // → billing.points.read
        handler: () => ({ balance: 100 }),
      }),
      defineRoute({
        method: 'POST',
        path: '/billing/points/adjust',
        name: '调整积分',
        permission: true, // → billing.points.adjust
        handler: () => ({ ok: true }),
      }),
    ],
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

```bash
curl -H 'x-role: finance' http://localhost:3000/api/billing/points/read
curl -H 'x-role: member' -X POST http://localhost:3000/api/billing/points/adjust
# member → 403
```

## 用法

### 路由字段

```typescript
permission: true                      // 推荐：路径推导
permission: {}                        // 同 true
permission: 'billing.points.adjust'   // 显式单 key
permission: { key: 'billing.points.adjust' }

permission: {
  anyOf: ['billing.points.adjust', 'billing.points.batchAdjust'],
}

permission: {
  allOf: ['billing.orders.read', 'billing.orders.refund'],
}
```

`anyOf` / `allOf` / 显式 `key` 较少用；日常管理接口写 `permission: true` 即可。

### 与 Auth Middleware 组合

```typescript
import { authWithApp } from '@vafast/auth-middleware'
import {
  createPermissionMiddleware,
  defineRoles,
  cacheKeyFromUserAndApp,
} from '@vafast/permission'

export const orgPermission = createPermissionMiddleware({
  pathPrefix: '/billingRestfulApi',
  roles: defineRoles({
    owner: ['*'],
    admin: ['*'],
    member: [],
  }),
  async getRole(req) {
    const locals = (req as {
      __locals?: { userInfo?: { id: string }; app?: { id: string } }
    }).__locals
    if (!locals?.userInfo?.id || !locals?.app?.id) return null
    const { role } = await getOrgRole(locals.userInfo.id, locals.app.id)
    return role
  },
})

defineRoute({
  path: '/billingRestfulApi/refund',
  middleware: [authWithApp, orgPermission],
  children: [
    defineRoute({
      method: 'POST',
      path: '/approve',
      permission: true, // → refund.approve
      handler: () => ({ ok: true }),
    }),
  ],
})
```

组织 / 租户只需在 `getRole` 里调自己的用户中心，**不必**把组织概念写进本包。

### 可选缓存

默认**不缓存**（角色变更立即生效）。高 QPS 时可开：

```typescript
createPermissionMiddleware({
  roles,
  getRole,
  cache: {
    cacheKey: cacheKeyFromUserAndApp, // userId:appId
    ttlMs: 60_000,
  },
})
```

### 类型扩展（withContext）

```typescript
import { withContext } from 'vafast'
import type { PermissionRouteExtensions } from '@vafast/permission'

const defineAppRoute = withContext<
  { userInfo: { id: string } },
  PermissionRouteExtensions
>()

defineAppRoute({
  method: 'POST',
  path: '/users/invite',
  permission: true,
  handler: ({ userInfo }) => ({ id: userInfo.id }),
})
```

### 管理端级联 UI

```typescript
import {
  getPermissionCatalog,
  getAllPermissionDefinitions,
  buildPermissionTree,
} from '@vafast/permission'

// 从已注册路由收集（需 Server 已创建）
const catalog = getPermissionCatalog('/billingRestfulApi')
const flat = getAllPermissionDefinitions('/billingRestfulApi')

// 不依赖路由：纯 key → 树
const tree = buildPermissionTree([
  'billing.points.adjust',
  'billing.points.read',
  'users.invite',
])
```

树节点形如：`{ key, path, children, permissions }`，便于 cascader / 多选授权。

### 底层 API（一般不用）

多数业务只需 `createPermissionMiddleware`。仍导出：

| API | 说明 |
|-----|------|
| `permission({ resolve, pathPrefix? })` | 自带 Resolver 时的底层中间件 |
| `requirePermission(key, { resolve })` | 单路由显式校验 |
| `createRoleResolver` / `createLocalsResolver` / `createStaticResolver` | Resolver 工厂 |
| `createCachedResolver` | 底层缓存（优先用选项 `cache`） |

### 纯函数（单测友好）

| 函数 | 说明 |
|------|------|
| `matchPermission(grant, required)` | 单 grant 是否覆盖 |
| `hasPermission` / `checkRequirement` | 集合 / anyOf / allOf |
| `generatePermissionKey(path)` | 路径 → key |
| `resolvePermissionConfig(value, path)` | 解析路由字段（含 `true` 推导） |
| `cacheKeyFromUserAndApp` | `userId:appId` |

## 失败响应

默认 JSON：

```json
{
  "code": 403,
  "message": "权限不足",
  "required": "billing.points.adjust",
  "requiredKeys": ["billing.points.adjust"],
  "mode": "single",
  "currentRole": "member",
  "grants": ["billing.points.read"]
}
```

可用 `message` / `onDenied` 覆盖。

## 注意事项

- **授权 ≠ 认证**：顺序必须是认证 → 权限。
- 推荐 `permission: true`；`pathPrefix` 与同服务 webhook 对齐。
- 通配规则与 webhook 订阅的 `eventKey` 通配一致（`*` / `prefix.*`）。
- 包本身不包含 Ones / 组织模型；那是业务 `getRole` 的实现细节。

## 相关链接

- [Auth Middleware](/middleware/auth-middleware)
- [Webhook](/middleware/webhook)
- [中间件概述](/middleware/overview)
- [GitHub](https://github.com/vafast/vafast-permission) · [npm](https://www.npmjs.com/package/@vafast/permission)
