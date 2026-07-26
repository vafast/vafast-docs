---
title: Static - Vafast
---

# Static

`@vafast/static` **不是** `server.use` 中间件。它异步扫描目录，返回一组 **`Route[]`**，再合并进 `new Server([...])`。

## 安装

```bash
npm install @vafast/static
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { staticPlugin } from '@vafast/static'

const staticRoutes = await staticPlugin({
  assets: 'public',
  prefix: '/public',
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server([...staticRoutes, ...routes])
serve({ fetch: server.fetch, port: 3000 })
```

例如 `public/logo.png` → `GET /public/logo.png`。

## 用法

### 挂到根路径

`prefix: '/'` 会被当成无前缀：

```typescript
const staticRoutes = await staticPlugin({
  assets: 'public',
  prefix: '/',
})
```

### 生产预注册每个文件

```typescript
const staticRoutes = await staticPlugin({
  assets: 'public',
  prefix: '/assets',
  alwaysStatic: true,
})
```

### 关闭缓存头

```typescript
await staticPlugin({
  assets: 'public',
  noCache: true,
})
```

### 自定义 Cache-Control

```typescript
await staticPlugin({
  assets: 'public',
  directive: 'public',
  maxAge: 3600,
  headers: {
    'X-Static': '1',
  },
})
```

## API

### 导出

| 导出 | 说明 |
|------|------|
| `staticPlugin(options?)` | **async**，返回 `Promise<Route[]>` |
| `default` | 同 `staticPlugin` |

### `await staticPlugin(options?)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `assets` | `string` | `'public'` | 本地静态目录 |
| `prefix` | `string` | `'/public'` | URL 前缀；`'/'` 视为无前缀 |
| `staticLimit` | `number` | `1024` | 文件数超过后改用通配路由，降内存 |
| `alwaysStatic` | `boolean` | `NODE_ENV === 'production'` | 是否为每个文件预注册静态路由 |
| `ignorePatterns` | `(string \| RegExp)[]` | **见下方说明** | 忽略的文件 |
| `noExtension` | `boolean` | `false` | 去掉扩展名注册（仅 `alwaysStatic` 时生效） |
| `enableDecodeURI` | `boolean` | `false` | 对 URL 做 decode（动态查找路径时） |
| `headers` | `Record<string, string>` | `{}` | 附加响应头 |
| `noCache` | `boolean` | `false` | `true` 时不做 ETag / Cache-Control |
| `directive` | Cache-Control 指令 | `'public'` | 如 `public` / `private` / `no-cache` |
| `maxAge` | `number \| null` | `86400` | 秒；`null` 不附加 max-age |
| `indexHTML` | `boolean` | `true` | 目录默认尝试 `index.html` |
| `resolve` | `(...paths) => string` | `path.resolve` | 路径解析函数 |

### `ignorePatterns`：无参 vs 部分传参

源码里整参默认值与解构默认值不一致：

| 调用方式 | `ignorePatterns` 实际默认 |
|----------|---------------------------|
| `staticPlugin()`（无参） | `[]` |
| `staticPlugin({ assets: 'public' })` 等传了对象 | `['.DS_Store', '.git', '.env']` |

需要忽略系统文件时，显式传入更稳妥：

```typescript
await staticPlugin({
  assets: 'public',
  ignorePatterns: ['.DS_Store', '.git', '.env', /\.map$/],
})
```

### 路由生成策略

- `alwaysStatic === true`，或 `ENV === 'production'` 且文件数 `<= staticLimit`：为每个文件注册独立 `GET` 路由  
- 否则：注册一条 `${prefix}/*` 通配路由，运行时按路径读文件  

## 最佳实践

- **必须** `await staticPlugin(...)`，再把返回的 `Route[]` 展开进 `Server`。
- 不要 `server.use(staticPlugin(...))` —— 类型与用法都不匹配。
- 生产环境注意文件数量与 `staticLimit`；超大目录倾向通配路由更省内存。
- 业务 API 路由与静态路由合并时，注意路径冲突（同 path 后注册可能覆盖）。

## 注意事项

- 返回值是 **`Route[]`**，不是中间件。
- 未命中文件会抛包内 `NotFoundError`；建议另备业务 404 / 探活路由。
- `noExtension` 仅在预注册（`alwaysStatic`）路径下生效。
- `enableDecodeURI` 仅在通配 / 动态查找路径下使用。

## 相关链接

- [路由](/routing)
- [部署指南](/patterns/deploy)
- [中间件系统](/middleware)
