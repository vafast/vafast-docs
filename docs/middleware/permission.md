---
title: Permission - Vafast
---

# Permission

`@vafast/permission`：在路由上声明 **permission key**，通过可插拔 **Resolver** 解析当前主体的 grants，再按通配规则放行或拒绝。

它解决的是「这个身份能不能调用这个接口」，而不是「这个请求是谁」（那是 `@vafast/auth-middleware` / JWT / API Key 的事）。

设计对齐 [Webhook](/middleware/webhook)：路由扩展字段 + 中间件 + 从 RouteRegistry 收集目录。

## 先搞清几个概念（给新用户）

### Permission key

建议使用点分三级（可更长）：

```text
{domain}.{module}.{action}
```

例如：`billing.points.adjust`、`users.invite`。

**Grant（持有）** 可以带通配；**路由需求** 通常写精确 key：

| Grant | 能匹配的需求 |
|-------|----------------|
| `billing.points.adjust` | 仅自身 |
| `billing.points.*` | `billing.points` 及其所有下级 |
| `billing.*` | `billing` 及其所有下级 |
| `*` | 一切 |

### Resolver

中间件只调用：

```ts
resolve(req) → { grants: string[], role?: string } | null
```

| 返回 | HTTP |
|------|------|
| `null` | **401**（无法解析主体） |
| 主体存在但不满足 | **403** |
| 满足 | 调用 `next`，并注入 `permission` 上下文 |

角色从哪来（请求头、JWT claims、DB、组织成员表）由你实现；包内提供若干工厂。

### 两种挂法

| 方式 | 用法 |
|------|------|
| **全局** | `server.use(permission({ resolve }))`，路由写 `permission: '...'` |
| **路由级** | `middleware: [requirePermission('...', { resolve })]` |

可并存；同一路由不要重复卡两道（除非有意）。

## 安装

```bash
npm install @vafast/permission
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import {
  permission,
  defineRoles,
  createRoleResolver,
} from '@vafast/permission'

const roles = defineRoles({
  owner: ['*'],
  admin: ['billing.*', 'users.*'],
  finance: ['billing.points.*', 'billing.orders.*'],
  member: ['billing.points.read'],
})

const resolve = createRoleResolver({
  getRole: (req) => req.headers.get('x-role'),
  roles,
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/billing/points',
    name: '积分余额',
    permission: 'billing.points.read',
    handler: () => ({ balance: 100 }),
  }),
  defineRoute({
    method: 'POST',
    path: '/billing/points/adjust',
    name: '调整积分',
    permission: 'billing.points.adjust',
    handler: () => ({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(permission({ resolve }))
serve({ fetch: server.fetch, port: 3000 })
```

```bash
curl -H 'x-role: finance' http://localhost:3000/billing/points
curl -H 'x-role: member' -X POST http://localhost:3000/billing/points/adjust
# member → 403
```

## 用法

### 路由字段

```typescript
permission: 'billing.points.adjust'

permission: {
  anyOf: ['billing.points.adjust', 'billing.points.batchAdjust'],
}

permission: {
  allOf: ['billing.orders.read', 'billing.orders.refund'],
}
```

未声明 `permission` 的路由：全局中间件**直接放行**。

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
  path: '/admin',
  permission: 'users.invite',
  handler: ({ userInfo }) => ({ id: userInfo.id }),
})
```

### Resolver 工厂

| 工厂 | 场景 |
|------|------|
| `createStaticResolver(subject \| fn)` | 固定 grants 或同步函数 |
| `createRoleResolver({ getRole, roles, getExtraGrants? })` | 角色表 |
| `createLocalsResolver({ getRole?, getGrants?, roles?, mapLocals? })` | 读 vafast `__locals`（常配合 auth-middleware） |
| `createCachedResolver(resolver, { cacheKey, ttlMs? })` | 远程查角色时缓存 |

```typescript
import {
  defineRoles,
  createLocalsResolver,
  createCachedResolver,
} from '@vafast/permission'

const roles = defineRoles({
  owner: ['*'],
  admin: ['billing.*'],
  member: ['billing.points.read'],
})

const resolve = createCachedResolver(
  createLocalsResolver({
    getRole: (locals) => locals.orgRole as string | undefined,
    roles,
  }),
  {
    cacheKey: (req) => {
      const locals = (req as unknown as {
        __locals?: { userInfo?: { id?: string }; app?: { id?: string } }
      }).__locals
      if (!locals?.userInfo?.id || !locals?.app?.id) return null
      return `${locals.userInfo.id}:${locals.app.id}`
    },
    ttlMs: 60_000,
  },
)
```

### 与 Auth Middleware 组合

```typescript
import { authWithApp } from '@vafast/auth-middleware'
import { requirePermission } from '@vafast/permission'

// 推荐：认证 →（写入角色）→ 授权
middleware: [
  authWithApp,
  requirePermission('billing.points.adjust', { resolve }),
]
```

组织 / 租户场景只需在 Resolver 内调用你的用户中心（例如查 org role），**不必**把组织概念写进本包。

### 管理端级联 UI

```typescript
import {
  getPermissionCatalog,
  getAllPermissionDefinitions,
  buildPermissionTree,
} from '@vafast/permission'

// 从已注册路由收集（需 Server 已创建）
const catalog = getPermissionCatalog()
const flat = getAllPermissionDefinitions()

// 不依赖路由：纯 key → 树
const tree = buildPermissionTree([
  'billing.points.adjust',
  'billing.points.read',
  'users.invite',
])
```

树节点形如：`{ key, path, children, permissions }`，便于 cascader / 多选授权。

### 纯函数（单测友好）

| 函数 | 说明 |
|------|------|
| `matchPermission(grant, required)` | 单 grant 是否覆盖 |
| `hasPermission(grants, required)` | 集合是否覆盖 |
| `checkRequirement(grants, requirement)` | 含 anyOf / allOf |
| `parsePermissionConfig(value)` | 解析路由字段 |

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

- **授权 ≠ 认证**：请先挂登录 / API Key 中间件。
- 通配规则与 webhook 订阅的 `eventKey` 通配一致（`*` / `prefix.*`）。
- 全局 `permission()` 依赖 RouteRegistry；未初始化时放行，避免开发期误伤。
- 包本身不包含 Ones / 组织模型；那是业务 Resolver 的实现细节。

## 相关链接

- [Auth Middleware](/middleware/auth-middleware)
- [Webhook](/middleware/webhook)
- [中间件概述](/middleware/overview)
- [GitHub](https://github.com/vafast/vafast-permission)
