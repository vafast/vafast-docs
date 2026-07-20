---
title: CLI 工具 - Vafast
---

# CLI 工具

`@vafast/cli` 是 Vafast 官方提供的命令行工具，用于从服务端同步 API 类型定义，实现跨仓库的类型安全。

## 安装

```bash
npm install -D @vafast/cli
```

## 命令

### `vafast sync` - 同步 API 类型

从服务端获取 API 契约，生成 TypeScript 类型定义文件。

#### 基本用法

```bash
# 基本用法
npx vafast sync --url http://localhost:3000

# 指定输出文件
npx vafast sync --url http://localhost:3000 --out src/types/api.ts

# 指定契约端点
npx vafast sync --url http://localhost:3000 --endpoint /api-spec

# 去掉路径前缀
npx vafast sync --url http://localhost:3000 \
  --endpoint /api/api-spec \
  --out src/types/api/blog.generated.ts \
  --strip-prefix /api
```

#### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--url <url>` | 服务端地址（必填） | - |
| `--out <path>` | 输出文件路径 | `src/api.generated.ts` |
| `--endpoint <path>` | 契约接口路径 | `/__contract__` |
| `--strip-prefix <prefix>` | 去掉路径前缀 | - |

## 工作流程

### 1. 服务端配置

在 vafast 服务端暴露契约接口：

```typescript
import { Server, defineRoute, defineRoutes, getApiSpec } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: getUsersHandler
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    handler: createUserHandler
  }),
])

// 添加契约接口
const allRoutes = [
  ...routes,
  defineRoute({
    method: 'GET',
    path: '/api-spec',
    handler: getApiSpec  // 直接作为 handler
  })
]

const server = new Server(allRoutes)
export default { fetch: server.fetch }
```

### 2. 客户端同步

```bash
npx vafast sync --url http://localhost:3000 --endpoint /api-spec
```

### 3. 使用生成的类型

```typescript
import { createClient } from '@vafast/api-client'
import { createApiClient } from './api.generated'

// 创建底层客户端
const client = createClient({
  baseURL: 'http://localhost:3000',
  timeout: 30000
})

// 创建类型安全的 API 客户端
const api = createApiClient(client)

// 类型安全的调用（错误路径会被 TypeScript 检测）
const { data, error } = await api.users.get({ page: 1 })

// ❌ TypeScript 会报错
// api.nonExistent.get()  // Error: Property 'nonExistent' does not exist
```

## 生成的类型示例

CLI 生成的文件包含：

```typescript
import type { ApiResponse, RequestConfig, Client, EdenClient } from '@vafast/api-client'
import { eden } from '@vafast/api-client'

/** API 契约类型 */
export type Api = {
  users: {
    get: {
      query: { page?: number }
      return: any
    }
    post: {
      body: { name?: string }
      return: any
    }
  }
}

/** API 客户端类型别名 */
export type ApiClientType = EdenClient<Api>

/**
 * 创建类型安全的 API 客户端
 */
export function createApiClient(client: Client): EdenClient<Api> {
  return eden<Api>(client)
}
```

## 自动化配置

在 `package.json` 中配置脚本：

```json
{
  "scripts": {
    "sync:auth": "vafast sync --url http://localhost:9003 --endpoint /auth/api/api-spec --out src/types/api/auth.generated.ts --strip-prefix /auth/api",
    "sync:blog": "vafast sync --url http://localhost:9002 --endpoint /blog/api/api-spec --out src/types/api/blog.generated.ts --strip-prefix /blog/api",
    "sync:types": "npm run sync:auth && npm run sync:blog",
    "dev": "vite",
    "build": "npm run sync:types && vite build"
  }
}
```

## 多服务配置示例

```typescript
// src/utils/apiClients.ts
import { createClient } from '@vafast/api-client'
import { createApiClient as createAuthClient } from '~/types/api/auth.generated'
import { createApiClient as createBlogClient } from '~/types/api/blog.generated'

// 公共配置
const AUTH_API = { baseURL: '/auth/api', timeout: 30000 }
const BLOG_API = { baseURL: '/blog/api', timeout: 30000 }

// 创建客户端
const authClient = createClient(AUTH_API)
const blogClient = createClient(BLOG_API).use(appIdMiddleware)

// 导出类型安全的 API
export const auth = createAuthClient(authClient)
export const blog = createBlogClient(blogClient)

// 使用
const { data, error } = await blog.posts.find.post({ current: 1, pageSize: 10 })
```

## 注意事项

1. **返回类型**：如果后端未定义 `response` schema，生成的返回类型为 `any`（渐进式类型安全）。建议后端添加 `response` schema 获得完整类型检查。

2. **服务器必须运行**：执行 `sync` 命令时，服务端必须在运行并暴露契约接口。

3. **不要手动修改**：生成的文件会被覆盖，请勿手动修改。

4. **类型安全**：生成的 `createApiClient` 返回 `EdenClient<Api>`，TypeScript 会检测错误的 API 路径。

## 相关链接

- [API 客户端](/api-client/overview) - 了解如何使用生成的类型
- [路由指南](/routing) - 了解如何定义路由
- [GitHub 仓库](https://github.com/vafast/vafast-cli) - 查看源码和问题反馈
