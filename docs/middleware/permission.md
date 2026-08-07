---
title: Permission - Vafast
---

# Permission

`@vafast/permission`：在路由上声明 **permission**，通过角色表展开 grants，在 handler 前做 RBAC。

解决「能不能调这个接口」；「是谁」交给 `@vafast/auth-middleware`。

设计对齐 [Webhook](/middleware/webhook)：路由扩展、路径推导 key、目录查询。与具体组织 / 租户模型解耦。

## 先搞清几个概念

### Permission key

建议 `{domain}.{module}.{action}`。默认**从路径自动生成**（同 webhook eventKey）：

| 路径 | pathPrefix | 自动 key |
|------|--------------|----------|
| `/billing/points/adjust` | （无） | `billing.points.adjust` |
| `/restfulApi/auth/signIn` | `/restfulApi` | `auth.signIn` |

Grant 侧可通配：`*`、`billing.*`、`billing.points.*`。

### 推荐心智模型

```text
authWithApp → orgPermission（getRole + roles）→ handler
```

业务封装一次 `createPermissionMiddleware`，管理路由写 `permission: true`。

### 挂载位置（和 webhook 不同）

| | Webhook | Permission |
|--|---------|------------|
| 时机 | `next()` **之后** | handler **之前** |
| 挂法 | 可 `server.use` | **必须**在认证后 |

```ts
middleware: [authWithApp, orgPermission]  // ✅
// server.use(orgPermission)              // ❌ 早于路由 auth，locals 为空
```

## 安装

```bash
npm install @vafast/permission
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { authWithApp } from '@vafast/auth-middleware'
import {
  createPermissionMiddleware,
  defineRoles,
  cacheKeyFromUserAndApp,
} from '@vafast/permission'

export const orgPermission = createPermissionMiddleware({
  pathPrefix: '/billingRestfulApi', // 有统一前缀才写
  roles: defineRoles({
    owner: ['*'],
    admin: ['billing.*', 'users.*'],
    finance: ['billing.points.*', 'billing.orders.*'],
    member: ['billing.points.read'],
  }),
  async getRole(req) {
    const locals = (req as {
      __locals?: { userInfo?: { id: string }; app?: { id: string } }
    }).__locals
    if (!locals?.userInfo?.id || !locals?.app?.id) return null
    const { role } = await getOrgRole(locals.userInfo.id, locals.app.id)
    return role
  },
  // 默认不缓存。需要时可开：
  // cache: { cacheKey: cacheKeyFromUserAndApp, ttlMs: 60_000 },
})

const routes = defineRoutes([
  defineRoute({
    path: '/billingRestfulApi',
    middleware: [authWithApp, orgPermission],
    children: [
      defineRoute({
        method: 'GET',
        path: '/billing/points/read',
        permission: true, // → billing.points.read
        handler: () => ({ balance: 100 }),
      }),
      defineRoute({
        method: 'POST',
        path: '/billing/points/adjust',
        permission: true, // → billing.points.adjust
        handler: () => ({ ok: true }),
      }),
    ],
  }),
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

未声明 `permission` 的子路由：只走认证，不查组织权限。

## 用法

### 路由字段

```typescript
permission: true                      // 推荐
permission: {}                        // 同 true
permission: 'billing.points.adjust'   // 显式
permission: { key: 'billing.points.adjust' }
permission: { anyOf: ['a', 'b'] }     // 少见
permission: { allOf: ['a', 'b'] }     // 少见
```

### 可选缓存

默认**不缓存**（角色变更立即生效）。高 QPS 时可开：

```typescript
createPermissionMiddleware({
  roles,
  getRole,
  cache: {
    cacheKey: cacheKeyFromUserAndApp,
    ttlMs: 60_000,
  },
})
```

### 类型扩展

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

const catalog = getPermissionCatalog('/billingRestfulApi')
const flat = getAllPermissionDefinitions('/billingRestfulApi')
const tree = buildPermissionTree([
  'billing.points.adjust',
  'billing.points.read',
  'users.invite',
])
```

树节点：`{ key, path, children, permissions }`。

### 底层 API（一般不用）

多数业务只需 `createPermissionMiddleware`。仍导出：

| API | 说明 |
|-----|------|
| `permission({ resolve, pathPrefix? })` | 自带 Resolver 时的底层中间件 |
| `requirePermission(key, { resolve })` | 单路由显式校验 |
| `createRoleResolver` / `createLocalsResolver` / `createStaticResolver` | Resolver 工厂 |
| `createCachedResolver` | 底层缓存（优先用选项 `cache`） |

### 纯函数

| 函数 | 说明 |
|------|------|
| `matchPermission` / `hasPermission` / `checkRequirement` | 匹配 |
| `generatePermissionKey` / `resolvePermissionConfig` | 路径推导 |
| `cacheKeyFromUserAndApp` | `userId:appId` |

## 失败响应

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

- 授权 ≠ 认证；顺序必须是认证 → 权限。
- 推荐 `permission: true`；`pathPrefix` 与 webhook 对齐。
- 通配规则与 webhook 订阅一致（`*` / `prefix.*`）。
- 包内不含组织模型；`getRole` 由业务实现。

## 相关链接

- [Auth Middleware](/middleware/auth-middleware)
- [Webhook](/middleware/webhook)
- [中间件概述](/middleware/overview)
- [GitHub](https://github.com/vafast/vafast-permission)
