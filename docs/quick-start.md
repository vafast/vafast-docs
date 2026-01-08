---
title: 快速入门 - Vafast
---

# 快速入门

Vafast 是一个高性能、类型安全的 TypeScript Web 框架。内置 JIT 编译验证器、中间件预编译等优化技术，比 Express/Hono 快约 **1.8x**。

## 使用脚手架（推荐）

最快的方式是使用官方脚手架：

```bash
npx create-vafast-app
```

按照提示输入项目名称，然后：

```bash
cd my-vafast-app
npm install
npm run dev
```

访问 [localhost:3000](http://localhost:3000) 即可看到 "Hello Vafast!"。

## 手动配置

如果你想手动配置项目，请按以下步骤操作。

确保你已安装 Node.js（推荐版本 18+）。

### 1. 创建项目目录

```bash
mkdir my-vafast-app
cd my-vafast-app
npm init -y
```

### 2. 安装依赖

```bash
npm install vafast
npm install -D typescript tsx @types/node
```

### 3. 配置 TypeScript

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

### 4. 配置 package.json

在 `package.json` 中添加：

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc",
    "serve": "node dist/index.js"
  }
}
```

### 5. 创建 .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# IDE
.idea/
.vscode/

# OS
.DS_Store

# Logs
*.log

# Environment
.env
.env.local
```

### 6. 项目结构

```
my-vafast-app/
├── src/
│   └── index.ts
├── .gitignore
├── package.json
└── tsconfig.json
```

## 创建应用

创建 `src/index.ts`，有两种写法：

### 方式一：使用 defineRoutes（推荐）

`defineRoutes` 提供更好的类型推断，适合复杂项目：

```typescript
import { Server, defineRoutes, createHandler, serve } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello Vafast!')
  },
  {
    method: 'GET',
    path: '/health',
    handler: createHandler(() => ({ status: 'ok', timestamp: Date.now() }))
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
```

### 方式二：直接传数组

适合快速原型或简单项目：

```typescript
import { Server, createHandler, serve } from 'vafast'

const server = new Server([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello Vafast!')
  }
])

serve({ fetch: server.fetch, port: 3000 })
```

## 启动服务

```bash
npm run dev
```

访问 [localhost:3000](http://localhost:3000) 应该会显示 "Hello Vafast"。

## 基础示例

### 简单路由

```typescript
import { Server, defineRoutes, createHandler, serve } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createHandler(() => 'Hello Vafast!')
  },
  {
    method: 'GET',
    path: '/users',
    handler: createHandler(() => ['user1', 'user2', 'user3'])
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

### 带参数的路由

```typescript
import { Server, defineRoutes, createHandler, serve } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/users/:id',
    handler: createHandler(({ params }) => {
      return `User ID: ${params.id}`
    })
  },
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(async ({ body }) => {
      return { success: true, user: body }
    })
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

### 使用 Schema 验证

```typescript
import { Server, defineRoutes, createHandler, serve, Type } from 'vafast'

const UserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0 }))
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(
      { body: UserSchema },
      ({ body }) => {
        // body 已验证并自动推导类型
        return { success: true, user: body }
      }
    )
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

## 下一步

现在你已经成功创建了一个 Vafast 应用！接下来你可以：

- 查看 [核心概念](/key-concept) 了解 Vafast 的基本原理
- 阅读 [路由指南](/routing) 学习如何定义路由
- 探索 [中间件系统](/middleware) 了解如何扩展功能
