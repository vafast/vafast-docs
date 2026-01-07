---
title: 简介 - Vafast
---

<script setup>
import Card from './components/nearl/card.vue'
import Deck from './components/nearl/card-deck.vue'
import Playground from './components/nearl/playground.vue'
</script>

# 简介

Vafast 不只是一个框架，更是一种 **结构、清晰、可控** 的开发哲学。

## 🎯 Vafast 哲学

<div class="philosophy-grid">

### 结构即真相 <span class="tag">Structure is Truth</span>
API 用代码定义，而非行为。没有装饰器，没有魔法。

```typescript
// 所见即所得
const routes = [
  { method: 'GET', path: '/users/:id', handler: getUser }
]
```

### 错误即数据 <span class="tag">Errors are Data</span>
错误包含状态、类型和可见性。不是混乱，而是契约。

```typescript
return { data: { error: 'Not Found' }, status: 404 }
```

### 组合优于约定 <span class="tag">Composition Matters</span>
中间件显式组合，执行顺序清晰可控，无全局污染。

```typescript
{ path: '/admin', middleware: [auth, log], handler }
```

### 边缘原生 <span class="tag">Edge-Native</span>
原生运行于 Bun、Workers、Deno —— 冷启动无忧。

```typescript
export default { port: 3000, fetch: server.fetch }
```

### 零样板代码 <span class="tag">No Boilerplate</span>
无 CLI，无配置文件夹。一个文件，即刻运行。

</div>

<style>
.philosophy-grid h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.philosophy-grid .tag {
  font-size: 0.75rem;
  font-weight: normal;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
</style>

## ✨ 核心特性

- ✅ **结构优先的路由** — 用声明式对象定义整个 API，所见即所得
- ✅ **可组合的中间件** — 显式组合，无装饰器，无全局污染
- ✅ **结构化响应** — `{ data, status }` 统一格式，错误也是数据
- ✅ **内置响应工具** — `json()`、`html()`、`text()` 等，简洁统一
- ✅ **边缘原生** — Bun、Workers、Deno 即时冷启动，亚毫秒响应
- ✅ **零样板代码** — 无 CLI，无配置文件，一个文件即可运行
- ✅ **类型安全** — 路由、处理器、响应，全部 TypeScript 类型推断

## 🚀 技术特性

- **超高性能**: 比 Express/Hono 快约 **1.8x**，达到 ~101K reqs/s
- **JIT 编译验证器**: Schema 验证器编译缓存，10000 次验证仅需 ~5ms
- **中间件链预编译**: 路由注册时预编译处理链，运行时零开销
- **快速请求解析**: 优化的 Query/Cookie 解析，比标准方法快 2x
- **类型安全**: 完整的 TypeScript 支持和自动类型推断
- **灵活中间件**: 可组合的中间件架构，支持全局和路由级
- **零配置**: 开箱即用，无需复杂配置

以下是在 Vafast 中的简单 hello world 示例。

```typescript
import { Server, defineRoutes } from 'vafast'

interface TypedRequest extends Request {
  params: Record<string, string>
}

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast'
  },
  {
    method: 'GET',
    path: '/user/:id',
    handler: (req) => {
      const { id } = (req as TypedRequest).params
      return `User ID: ${id}`
    }
  },
  {
    method: 'POST',
    path: '/form',
    handler: async (req) => {
      const body = await req.json()
      return { success: true, data: body }
    }
  }
])

const server = new Server(routes)
export default { fetch: server.fetch }
```

打开 [localhost:3000](http://localhost:3000/)，结果应该显示 'Hello Vafast'。

::: tip
这是一个简单的示例，展示了 Vafast 的基本用法。在实际项目中，你可以根据需要添加更多的路由和中间件。
:::

## 性能

基于多项核心优化，Vafast 提供卓越的性能表现：

| 框架 | RPS | 相对性能 |
|------|-----|----------|
| **Vafast** | **~101K** | **100%** |
| Fastify | ~66K | 65% |
| Hono | ~56K | 55% |
| Express | ~56K | 55% |

> 测试环境：Bun 1.2.20, macOS, wrk 基准测试 (4线程, 100连接, 30s)

### 性能优化技术

- **JIT 编译验证器**: TypeBox Schema 编译后缓存，避免重复编译开销
- **中间件链预编译**: 路由注册时预编译完整处理链，每次请求仅需 0.004ms
- **快速请求解析**: `parseQueryFast`、`getCookie` 等优化函数，比标准方法快 2x
- **Radix Tree 路由**: O(k) 时间复杂度的高效路由匹配

## TypeScript

Vafast 旨在帮助你编写更少的 TypeScript。

通过提供完整的类型定义和类型推断，Vafast 让你能够：

- 获得完整的类型安全
- 减少类型注解的需求
- 享受更好的开发体验
- 避免运行时类型错误

## 架构特点

Vafast 采用现代化的架构设计：

### 路由驱动
- 清晰的路由配置
- 支持嵌套路由
- 灵活的参数处理
- 自动路由冲突检测

### 中间件系统
- 可组合的中间件
- 支持异步操作
- 错误处理机制
- 全局和路由级中间件

### 类型安全
- 完整的 TypeScript 支持
- 自动类型推断
- 编译时错误检查
- Schema 验证支持

### 高性能路由
- 智能路径匹配算法
- 路由特异性排序
- 扁平化嵌套路由
- 优化的中间件链

## 下一步

现在您已经了解了 Vafast 的基本概念，建议您：

1. 查看 [快速入门](/quick-start) 开始构建您的第一个应用
2. 阅读 [关键概念](/key-concept) 深入了解 Vafast 的核心特性
3. 探索 [教程](/tutorial) 学习更多高级功能

如果您有任何问题，欢迎在我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 社区询问。
