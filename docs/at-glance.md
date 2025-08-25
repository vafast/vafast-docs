---
title: 简介 - Vafast
head:
    - - meta
      - property: 'og:title'
        content: 简介 - Vafast

    - - meta
      - name: 'description'
        content: 设计注重高性能，广泛支持 TypeScript，现代 JavaScript API，优化用于 Bun。提供完整的类型安全和灵活的中间件系统，同时保持出色的性能。

    - - meta
      - property: 'og:description'
        content: 设计注重高性能，广泛支持 TypeScript，现代 JavaScript API，优化用于 Bun。提供完整的类型安全和灵活的中间件系统，同时保持出色的性能。
---

<script setup>
import Card from './components/nearl/card.vue'
import Deck from './components/nearl/card-deck.vue'
import Playground from './components/nearl/playground.vue'
</script>

# 简介
Vafast 是一个用于构建后端服务器的高性能 Web 框架，旨在与 Bun 配合使用。

Vafast 以简单性和类型安全为设计理念，拥有清晰的 API，并广泛支持 TypeScript，针对 Bun 进行了优化。

以下是在 Vafast 中的简单 hello world 示例。

```typescript twoslash
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: () => new Response('你好 Vafast')
  },
  {
    method: 'GET',
    path: '/user/:id',
    handler: (req: Request, params?: Record<string, string>) => new Response(params?.id)
  },
  {
    method: 'POST',
    path: '/form',
    handler: async (req: Request) => {
      const body = await req.json()
      return new Response(JSON.stringify(body))
    }
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

打开 [localhost:3000](http://localhost:3000/)，结果应该显示 '你好 Vafast'。

::: tip
这是一个简单的示例，展示了 Vafast 的基本用法。在实际项目中，你可以根据需要添加更多的路由和中间件。
:::

## 性能

基于 Bun 及诸多优化（如路由匹配优化），Vafast 能够提供高性能的 Web 服务。

Vafast 的性能优于当今大多数 Web 框架，专注于：

- 快速的路由匹配
- 高效的中间件执行
- 优化的内存使用
- 快速的响应时间

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

### 中间件系统
- 可组合的中间件
- 支持异步操作
- 错误处理机制

### 组件路由
- Vue 组件支持
- SSR 友好
- 类型安全

### 类型安全
- 完整的 TypeScript 支持
- 自动类型推断
- 编译时错误检查

## 下一步

现在您已经了解了 Vafast 的基本概念，建议您：

1. 查看 [快速入门](/quick-start) 开始构建您的第一个应用
2. 阅读 [关键概念](/key-concept) 深入了解 Vafast 的核心特性
3. 探索 [教程](/tutorial) 学习更多高级功能

如果您有任何问题，欢迎在我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 社区询问。
