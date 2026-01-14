---
title: 脚手架工具 - Vafast
---

# 脚手架工具

`create-vafast-app` 是 Vafast 官方提供的项目脚手架工具，可以快速创建一个开箱即用的 Vafast 项目。

## 快速开始

```bash
npx create-vafast-app
```

或者使用 npm/pnpm/yarn：

```bash
npm create vafast-app
pnpm create vafast-app
yarn create vafast-app
```

按照提示输入项目名称，然后：

```bash
cd my-vafast-app
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可看到 "Hello Vafast!"。

## 生成的项目结构

脚手架会生成一个完整的、开箱即用的 Vafast 项目：

```
my-vafast-app/
├── .cursor/
│   └── rules/
│       ├── vafast.mdc        # Cursor AI 规则
│       └── typescript.mdc    # TypeScript 规范
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot 指令
├── src/
│   └── index.ts              # 应用入口
├── AGENTS.md                 # AI 开发指南（OpenAI Codex）
├── CLAUDE.md                 # Claude 项目规则
├── package.json              # 依赖和脚本配置
└── tsconfig.json             # TypeScript 配置
```

## 核心特性

### 1. 开箱即用

生成的项目包含：

- ✅ **完整的 TypeScript 配置** - 开箱即用的 tsconfig.json
- ✅ **开发脚本** - `npm run dev` 启动开发服务器
- ✅ **构建脚本** - `npm run build` 构建生产版本
- ✅ **示例路由** - 包含一个简单的 Hello World 路由

### 2. AI 开发支持

脚手架内置了多个 AI 工具的配置文件，让 Cursor、GitHub Copilot、Claude 等 AI 工具更懂 Vafast：

| 文件 | 支持的 AI 工具 |
|------|---------------|
| `.cursor/rules/*.mdc` | Cursor |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `AGENTS.md` | OpenAI Codex, GitHub Copilot Agent |
| `CLAUDE.md` | Claude |

AI 将自动学习：

- ✅ Vafast 路由定义模式（`defineRoute` + `defineRoutes`）
- ✅ TypeBox schema 用法
- ✅ 中间件编写规范（`defineMiddleware`）
- ✅ SSE 流式响应（`createSSEHandler`）
- ✅ 错误处理最佳实践（`err` 函数）
- ✅ API 客户端使用（`@vafast/api-client`）

### 3. 零配置

生成的项目无需额外配置即可运行：

```typescript
// src/index.ts
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  })
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 }, (info) => {
  console.log(`🚀 Server running at http://localhost:${info.port}`)
})
```

### 4. 类型安全

项目配置了完整的 TypeScript 支持：

- ✅ 严格的类型检查
- ✅ 自动类型推断
- ✅ 端到端类型安全（配合 `@vafast/api-client`）

## 使用场景

### 快速原型开发

```bash
npx create-vafast-app my-prototype
cd my-prototype
npm run dev
```

### 学习 Vafast

脚手架生成的项目包含最佳实践示例，是学习 Vafast 的绝佳起点。

### 团队协作

内置的 AI 配置文件确保团队成员使用 AI 工具时都能获得一致的代码风格和最佳实践。

## 全局安装（可选）

如果你想全局安装：

```bash
npm install -g create-vafast-app
```

然后运行：

```bash
create-vafast-app
```

## 项目脚本

生成的项目包含以下脚本：

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc",
    "serve": "node dist/index.js"
  }
}
```

- `npm run dev` - 开发模式，支持热重载
- `npm start` - 生产模式运行
- `npm run build` - 编译 TypeScript
- `npm run serve` - 运行编译后的代码

## 下一步

创建项目后，你可以：

1. **添加路由** - 在 `src/index.ts` 中添加更多路由
2. **添加中间件** - 使用 `defineMiddleware` 创建中间件
3. **添加 Schema 验证** - 使用 TypeBox 定义验证规则
4. **集成数据库** - 查看 [Prisma 集成](/integrations/prisma) 或 [Drizzle 集成](/integrations/drizzle)
5. **使用 API 客户端** - 查看 [API 客户端文档](/api-client/overview)

## 相关链接

- [快速开始](/quick-start) - 了解如何开始使用 Vafast
- [路由指南](/routing) - 学习如何定义路由
- [中间件系统](/middleware) - 了解中间件用法
- [GitHub 仓库](https://github.com/vafast/create-vafast-app) - 查看源码和问题反馈
