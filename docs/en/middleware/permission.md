---
title: Permission Middleware - Vafast
description: 'Vafast permission middleware: declare required permissions on routes, check roles and scopes, and enforce role-based access control in a type-safe way.'
---

# Permission

`@vafast/permission`: declare `permission` on routes, expand grants via a role table, and run RBAC checks **before** the handler.

It answers "may this identity call this endpoint", not "who is this request" (that's the job of [@vafast/auth-middleware](/en/middleware/auth-middleware)).

Its design mirrors [Webhook](/en/middleware/webhook): route extension fields, keys derived from paths, and a catalog collected from the RouteRegistry. It's decoupled from any specific organization / tenant model.

::: tip How mounting differs from Webhook
| | Webhook | Permission |
|--|---------|------------|
| Timing | Fires events asynchronously **after** `next()` | Intercepts **before** the handler |
| Mounting | `server.use(webhook(...))` works | **Must** come after auth: `middleware: [authWithApp, orgPermission]` |

Don't use `server.use(orgPermission)`: global middleware runs before route auth and can't see `userInfo` / `app`.
:::

## Key Concepts (for New Users)

### What Is a Permission Key?

Each permission check corresponds to a **permission key** (e.g. `billing.points.adjust`). Recommended shape:

```text
{domain}.{module}.{action}
```

Like webhook's `eventKey`, it is **generated from the path by default** and can be overridden explicitly.

| Path | pathPrefix | Auto key |
|------|--------------|----------|
| `/billing/points/adjust` | (none) | `billing.points.adjust` |
| `/restfulApi/auth/signIn` | `/restfulApi` | `auth.signIn` |

**Grants** (what an identity holds) can use wildcards:

| Grant | Matches requirements |
|-------|----------------|
| `billing.points.adjust` | Only itself |
| `billing.points.*` | `billing.points` and everything below it |
| `billing.*` | `billing` and everything below it |
| `*` | Everything |

### How Do Roles, Grants and Route Requirements Connect?

```text
Auth (authWithApp)
  → getRole returns the role (owner / admin / …)
  → the roles table expands it into grants
  → compared with the route's permission
  → allow, or 401 / 403
```

Wrap `createPermissionMiddleware` once in your app; routes that need control declare `permission: true`. Routes without it are only authenticated, not permission-checked.

### Recommended Layering (Stable Long-Term)

| Layer | Responsibility | How |
|----|------|------|
| Authentication | Who you are, which app | `authWithApp` |
| Hard authorization | Whether you can enter the endpoint at all | Route `permission` + middleware |
| Business rules | Conditional fields / data scope | Handler / assert helper functions |

Grants for hard authorization can come from several places, merged in **the same middleware**:

```ts
createPermissionMiddleware({
  roles: defineRoles({ owner: ['*'], admin: ['*'], member: [] }),
  getRole,           // organization role → role table
  getExtraGrants,    // platform/app permission strings, unioned (OR) with the role
})
```

| Scenario | Approach |
|------|--------|
| Admin endpoints require org admin | `permission: true` (role table grants `*`) |
| Org admin **or** a platform permission | Same as above + `getExtraGrants`; or an explicit `permission: 'platform_xxx'` |
| Permission needed only for a certain body field (e.g. `accessScope=all_apps`) | **Don't** put permission on the whole route; check in the handler using the same grants as the middleware |
| Can enter, but data scope differs | **No** permission; soft-filter in the handler |

### Failure Codes: 401 vs. 403

| Scenario | Status |
|------|--------|
| No role and no extra grants (no principal) | **401** |
| Has a principal but grants don't cover the requirement | **403** |

## Installation

```bash
npm install @vafast/permission
```

## Quick Start

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import {
  createPermissionMiddleware,
  defineRoles,
} from '@vafast/permission'

/** Wrap once in your app; attach to route groups after auth */
export const orgPermission = createPermissionMiddleware({
  // set this when you have a common API prefix, aligned with webhook.pathPrefix
  pathPrefix: '/api',
  roles: defineRoles({
    owner: ['*'],
    admin: ['billing.*', 'users.*'],
    finance: ['billing.points.*'],
    member: ['billing.points.read'],
  }),
  // the example uses a request header; in production, look up the org role / JWT claims / DB
  getRole: (req) => req.headers.get('x-role'),
  // no caching by default. Enable if needed:
  // cache: { cacheKey: cacheKeyFromUserAndApp, ttlMs: 60_000 },
})

const routes = defineRoutes([
  defineRoute({
    path: '/api',
    // production: middleware: [authWithApp, orgPermission]
    middleware: [orgPermission],
    children: [
      defineRoute({
        method: 'GET',
        path: '/billing/points/read',
        name: 'Points balance',
        permission: true, // → billing.points.read
        handler: () => ({ balance: 100 }),
      }),
      defineRoute({
        method: 'POST',
        path: '/billing/points/adjust',
        name: 'Adjust points',
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

## Usage

### Route Field

```typescript
permission: true                      // recommended: derived from the path
permission: {}                        // same as true
permission: 'billing.points.adjust'   // explicit single key
permission: { key: 'billing.points.adjust' }

permission: {
  anyOf: ['billing.points.adjust', 'billing.points.batchAdjust'],
}

permission: {
  allOf: ['billing.orders.read', 'billing.orders.refund'],
}
```

`anyOf` / `allOf` / an explicit `key` are less common; for everyday admin endpoints, `permission: true` is enough.

### Combining with Auth Middleware

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

For organizations / tenants, just call your own user service in `getRole`; there's **no need** to bake the organization concept into this package.

### Composite Permissions (Org Role OR Platform Permission)

```typescript
export const orgPermission = createPermissionMiddleware({
  pathPrefix: '/onesRestfulApi',
  roles: defineRoles({
    owner: ['*'],
    admin: ['*'],
    member: [],
    app_member: [],
    none: [], // authenticated but no org → 403 (not 401)
  }),
  async getRole(req) { /* getOrgRole → owner/admin/none */ },
  async getExtraGrants(req, role) {
    if (role === 'owner' || role === 'admin') return []
    // query auth-server checkPermission
    if (await hasPlatformManage(req)) {
      // catalog-writing services can also merge in path wildcards so platform admins pass permission: true
      // e.g. billing: businessLine.* / ai: modelCatalog.*
      return ['platform_resource_access:manage', 'modelCatalog.*']
    }
    return []
  },
})

// hard block on the whole route:
permission: 'platform_resource_access:manage'
// owner/admin pass with *; users with only platform permissions pass via getExtraGrants
```

For conditional cases (e.g. only check when `accessScope === 'all_apps'`), reuse the same grants resolution in the handler (`assertCanManageAllAppsResourceAccess`) and **check before writing to the database**, instead of putting `permission` on the whole create/update route.

For how the Ones platform layers this, see section 12 of `misc/docs/permission-system.md` in the repository.

### Optional Caching

**No caching** by default (role changes take effect immediately). Enable it for high QPS:

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

### Type Extension (withContext)

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

### Cascading UI for Admin Consoles

```typescript
import {
  getPermissionCatalog,
  getAllPermissionDefinitions,
  buildPermissionTree,
} from '@vafast/permission'

// collect from registered routes (requires the Server to be created)
const catalog = getPermissionCatalog('/billingRestfulApi')
const flat = getAllPermissionDefinitions('/billingRestfulApi')

// route-independent: pure keys → tree
const tree = buildPermissionTree([
  'billing.points.adjust',
  'billing.points.read',
  'users.invite',
])
```

Tree nodes look like `{ key, path, children, permissions }`, handy for cascaders / multi-select grant UIs.

### Low-Level APIs (Rarely Needed)

Most apps only need `createPermissionMiddleware`. These are still exported:

| API | Description |
|-----|------|
| `permission({ resolve, pathPrefix? })` | Low-level middleware when you bring your own resolver |
| `requirePermission(key, { resolve })` | Explicit check on a single route |
| `createRoleResolver` / `createLocalsResolver` / `createStaticResolver` | Resolver factories |
| `createCachedResolver` | Low-level cache (prefer the `cache` option) |

### Pure Functions (Unit-Test Friendly)

| Function | Description |
|------|------|
| `matchPermission(grant, required)` | Whether a single grant covers the requirement |
| `hasPermission` / `checkRequirement` | Sets / anyOf / allOf |
| `generatePermissionKey(path)` | Path → key |
| `resolvePermissionConfig(value, path)` | Resolves the route field (including `true` derivation) |
| `cacheKeyFromUserAndApp` | `userId:appId` |

## Failure Response

Default JSON:

```json
{
  "code": 403,
  "message": "Insufficient permissions",
  "required": "billing.points.adjust",
  "requiredKeys": ["billing.points.adjust"],
  "mode": "single",
  "currentRole": "member",
  "grants": ["billing.points.read"]
}
```

Override with `message` / `onDenied`.

## Notes

- **Authorization ≠ authentication**: the order must be authentication → permission.
- Prefer `permission: true`; keep `pathPrefix` aligned with webhooks in the same service.
- Wildcard rules match webhook subscription `eventKey` wildcards (`*` / `prefix.*`).
- The package doesn't include the Ones / organization model; that's an implementation detail of your `getRole`.

## Related Links

- [Auth Middleware](/en/middleware/auth-middleware)
- [Webhook](/en/middleware/webhook)
- [Middleware Overview](/en/middleware/overview)
- [GitHub](https://github.com/vafast/vafast-permission) · [npm](https://www.npmjs.com/package/@vafast/permission)
