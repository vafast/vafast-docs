---
title: Claude Skill - Vafast
---

# Claude Skill

Vafast Skill 是为 Claude CLI 提供的 Vafast 框架开发规则，让 AI 更懂 Vafast 的写法和最佳实践。

## 什么是 Skill？

Skill 是 Claude CLI 的扩展机制，安装后 AI 会自动理解特定框架或领域的最佳实践。安装 Vafast Skill 后，Claude 将自动理解：

- ✅ **路由定义** - `defineRoute` + `defineRoutes` 模式
- ✅ **Schema 验证** - TypeBox 类型定义
- ✅ **中间件** - `defineMiddleware` 类型安全模式
- ✅ **SSE** - `sse: true` 流式响应
- ✅ **错误处理** - 服务端 `throw err.*`；客户端可用 `{ data, error }`
- ✅ **API 客户端** - `@vafast/api-client` 使用

## 安装

### 方式 1：从文件安装

```bash
# 下载 vafast.skill 文件后
codex skill install vafast.skill
```

### 方式 2：从 GitHub 安装

```bash
# 克隆仓库
git clone https://github.com/vafast/vafast-skill.git

# 安装
codex skill install vafast-skill/vafast.skill
```

## 使用

安装后，在 Claude CLI 对话中使用 `@vafast` 即可：

```
@vafast 帮我创建一个用户管理 API

@vafast 如何定义 SSE 流式响应？

@vafast 写一个带鉴权的中间件
```

## 示例

### 创建路由

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    name: 'get_users',
    description: '获取用户列表',
    schema: {
      query: Type.Object({
        page: Type.Number(),
        limit: Type.Optional(Type.Number()),
      })
    },
    handler: ({ query }) => ({
      users: [],
      page: query.page,
    })
  })
])
```

### 中间件

```typescript
import { defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware<{ user: User }>(async (req, next) => {
  const user = await verifyToken(req)
  return next({ user })
})
```

### SSE 流式响应

```typescript
import { defineRoute } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/stream',
  sse: true,
  handler: async function* () {
    yield { status: 'start' }
    yield { text: 'chunk' }
    yield { status: 'end' }
  },
})
```

### 错误处理

```typescript
import { err } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => {
    const user = findUser(params.id)
    if (!user) {
      throw err.notFound('用户不存在')
    }
    return user
  }
})
```

### API 客户端

```typescript
import { eden, InferEden } from '@vafast/api-client'
import type { AppRoutes } from './server'

type Api = InferEden<AppRoutes>
const api = eden<Api>('http://localhost:3000')

// 类型安全的调用
const { data, error } = await api.users.get({ page: 1 })
```

## Skill 内容

安装后，Claude CLI 会理解以下 Vafast 特性：

### 路由定义模式

- 使用 `defineRoute` 定义单个路由
- 使用 `defineRoutes` 定义路由数组
- 支持嵌套路由结构
- 支持扩展字段（webhook、权限、计费等）

### Schema 验证

- TypeBox 类型定义
- 内置 format 验证器（email、uuid、phone 等）
- 运行时验证 + 编译时类型推断

### 中间件系统

- `defineMiddleware` 定义类型安全的中间件
- 支持类型注入（`withContext`）
- 全局中间件和路由级中间件

### 错误处理

- 服务端：`throw err.notFound(...)` 等语义化错误
- 客户端（api-client）：可用 `{ data, error }` 消费结果
- 统一的错误响应格式

### API 客户端

- `InferEden` 从路由定义自动推断类型
- `eden` 创建类型安全的客户端
- 端到端类型同步

## 文件说明

```
vafast-skill/
├── SKILL.md              # 主规则文件（Claude CLI 读取）
├── references/
│   └── schema.md         # TypeBox 详细参考
├── vafast.skill          # 打包文件（可分发）
└── README.md             # 项目说明
```

## 相关链接

- [Vafast 框架](https://github.com/vafast/vafast)
- [Vafast 文档](https://vafast.dev)
- [@vafast/api-client](https://github.com/vafast/vafast-api-client)
- [create-vafast-app](https://github.com/vafast/create-vafast-app)
- [GitHub 仓库](https://github.com/vafast/vafast-skill)
