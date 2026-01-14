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

# 指定契约端点（默认 /__contract__）
npx vafast sync --url http://localhost:3000 --endpoint /api/contract
```

#### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--url <url>` | 服务端地址（必填） | - |
| `--out <path>` | 输出文件路径 | `src/api.generated.ts` |
| `--endpoint <path>` | 契约接口路径 | `/__contract__` |

## 工作流程

### 1. 服务端配置

在 vafast 服务端暴露契约接口：

```typescript
import { Server, defineRoute, defineRoutes, getApiSpec } from 'vafast'

const routes = defineRoutes([
  // 你的路由定义...
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

// 添加契约接口（方式一：直接使用 getApiSpec）
const allRoutes = [
  ...routes,
  defineRoute({
    method: 'GET',
    path: '/__contract__',
    handler: getApiSpec  // 直接作为 handler
  })
]

// 或方式二：只暴露公开 API
const allRoutes = [
  ...routes,
  defineRoute({
    method: 'GET',
    path: '/__contract__',
    handler: () => getApiSpec(publicRoutes)  // 只暴露公开路由
  })
]

const server = new Server(allRoutes)
export default { fetch: server.fetch }
```

### 2. 客户端同步

```bash
npx vafast sync --url http://localhost:3000
```

### 3. 使用生成的类型

```typescript
import { eden } from '@vafast/api-client'
import type { Api } from './api.generated'

const api = eden<Api>('http://localhost:3000')

// 类型安全的调用
const { data, error } = await api.users.get({ page: 1 })
```

## 自动化

在 `package.json` 中配置脚本：

```json
{
  "scripts": {
    "sync": "vafast sync --url $API_URL",
    "dev": "npm run sync && vite",
    "build": "npm run sync && vite build"
  }
}
```

## 生成的类型示例

### 输入契约

服务端返回的契约格式：

```json
{
  "version": "1.0.0",
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "routes": [
    {
      "method": "GET",
      "path": "/users",
      "schema": {
        "query": {
          "type": "object",
          "properties": {
            "page": { "type": "number" }
          }
        }
      }
    },
    {
      "method": "POST",
      "path": "/users",
      "schema": {
        "body": {
          "type": "object",
          "properties": {
            "name": { "type": "string" }
          }
        }
      }
    }
  ]
}
```

### 生成的类型

```typescript
// src/api.generated.ts
export type Api = {
  users: {
    get: {
      query: { page?: number }
      return: unknown
    }
    post: {
      body: { name?: string }
      return: unknown
    }
  }
}
```

## 使用场景

### 多仓库项目

当服务端和客户端代码不在同一个仓库时，使用 CLI 工具同步类型：

```
monorepo/
├── packages/
│   ├── api-server/     # 服务端代码
│   └── web-client/     # 客户端代码
```

**服务端（api-server）：**

```typescript
// src/routes.ts
export const routes = defineRoutes([...])

// src/index.ts
const allRoutes = [
  ...routes,
  defineRoute({
    method: 'GET',
    path: '/__contract__',
    handler: getApiSpec
  })
]
```

**客户端（web-client）：**

```bash
# 在构建前同步类型
npm run sync  # 调用 vafast sync --url http://api.example.com
```

### CI/CD 集成

在 CI/CD 流程中自动同步类型：

```yaml
# .github/workflows/build.yml
- name: Sync API types
  run: |
    npm run sync --url ${{ secrets.API_URL }}
  
- name: Build
  run: npm run build
```

## 注意事项

1. **返回类型**：当前契约不包含返回类型信息，生成的类型中返回值为 `unknown`。如需完整类型推断，建议使用 monorepo 共享路由定义。

2. **服务器必须运行**：执行 `sync` 命令时，服务端必须在运行并暴露契约接口。

3. **不要手动修改**：生成的文件会被覆盖，请勿手动修改。

4. **环境变量**：建议使用环境变量管理 API URL：

```bash
# .env
API_URL=http://localhost:3000

# package.json
{
  "scripts": {
    "sync": "vafast sync --url $API_URL"
  }
}
```

## 相关链接

- [API 客户端](/api-client/overview) - 了解如何使用生成的类型
- [路由指南](/routing) - 了解如何定义路由
- [GitHub 仓库](https://github.com/vafast/vafast-cli) - 查看源码和问题反馈
