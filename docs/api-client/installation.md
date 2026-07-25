---
title: 安装指南 - Vafast API 客户端
---

# 安装指南

## 安装

::: code-group

```bash [npm]
npm install @vafast/api-client
```

```bash [pnpm]
pnpm add @vafast/api-client
```

```bash [yarn]
yarn add @vafast/api-client
```

```bash [bun]
bun add @vafast/api-client
```

:::

## 系统要求

- Node.js 18+ / Bun 1+ / 现代浏览器（Chrome 88+、Firefox 85+、Safari 14+、Edge 88+）
- TypeScript 5+（推荐）

## 快速验证

```typescript
import { createClient, eden } from '@vafast/api-client'

// 实际项目用 CLI 生成类型，或自行定义契约
type Api = {
  users: {
    get: { query?: { page?: number }; return: { users: string[] } }
  }
}

const api = eden<Api>(createClient('http://localhost:3000'))

const { data, error } = await api.users.get({ page: 1 })

if (error) {
  console.error(`${error.code}: ${error.message}`)
} else {
  console.log(data.users)
}
```

## 从服务端同步类型（推荐）

后端是 Vafast 时，用 CLI 生成类型安全客户端：

```bash
npx vafast sync --url http://localhost:3000 --out src/api.generated.ts
```

```typescript
import { createClient } from '@vafast/api-client'
import { createApiClient } from './api.generated'

const api = createApiClient(createClient({ baseURL: '/api', timeout: 30_000 }))

const { data, error } = await api.users.get()
if (error) return
console.log(data)
```

详见 [CLI 工具](/tools/cli)。

## 环境变量

```typescript
import { createClient, eden } from '@vafast/api-client'

const client = createClient({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 30_000),
})
```

## 下一步

- [基础用法](/api-client/fetch) — 链式调用、错误处理、中间件
- [概述](/api-client/overview) — 特性总览与 SSE
- [测试](/api-client/test) — 用 `server.fetch` / mock 测客户端
