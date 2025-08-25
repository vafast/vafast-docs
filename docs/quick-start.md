---
title: 快速入门 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: 快速入门 - Vafast
  - - meta
    - name: 'description'
      content: Vafast 是一个高性能、类型安全的 TypeScript Web 框架。要开始，请使用 "bun create vafast my-app" 启动一个新项目，并使用 "bun dev" 启动开发服务器。
  - - meta
    - property: 'og:description'
      content: Vafast 是一个高性能、类型安全的 TypeScript Web 框架。要开始，请使用 "bun create vafast my-app" 启动一个新项目，并使用 "bun dev" 启动开发服务器。
---

<script setup>
import Card from './components/nearl/card.vue'
import Deck from './components/nearl/card-deck.vue'
import Tab from './components/fern/tab.vue'
</script>

# 快速入门

Vafast 是一个高性能、类型安全的 TypeScript Web 框架，专为现代 Web 应用设计。

<Tab
	id="quickstart"
	:names="['Bun', 'Node.js', 'Web Standard']"
	:tabs="['bun', 'node', 'web-standard']"
>

<template v-slot:bun>

Vafast 针对 Bun 进行了优化，Bun 是一种旨在作为 Node.js 的直接替代品的 JavaScript 运行时。

你可以使用下面的命令安装 Bun：

::: code-group

```bash [MacOS/Linux]
curl -fsSL https://bun.sh/install | bash
```

```bash [Windows]
powershell -c "irm bun.sh/install.ps1 | iex"
```

:::

<Tab
	id="quickstart"
	:names="['自动安装', '手动安装']"
	:tabs="['auto', 'manual']"
>

<template v-slot:auto>

我们建议使用 `bun create vafast` 启动一个新的 Vafast 服务器，该命令会自动设置所有内容。

```bash
bun create vafast my-app
```

完成后，你应该会在目录中看到名为 `my-app` 的文件夹。

```bash
cd my-app
```

通过以下命令启动开发服务器：

```bash
bun dev
```

访问 [localhost:3000](http://localhost:3000) 应该会显示 "Hello Vafast"。

::: tip
Vafast 提供了 `dev` 命令，能够在文件更改时自动重新加载你的服务器。
:::

</template>

<template v-slot:manual>

要手动创建一个新的 Vafast 应用，请将 Vafast 作为一个包安装：

```bash
bun add vafast
bun add -d @types/bun
```

这将安装 Vafast 和 Bun 的类型定义。

创建一个新文件 `src/index.ts`，并添加以下代码：

```typescript
import { Server } from 'vafast'

const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: () => new Response('Hello Vafast!')
  }
]

const server = new Server(routes)
export default { fetch: server.fetch }
```

保存文件后，运行以下命令启动开发服务器：

```bash
bun run --hot src/index.ts
```

</template>

</Tab>

</template>

<template v-slot:node>

Vafast 也支持 Node.js 环境。

首先安装 Node.js（推荐版本 18+），然后安装 Vafast：

```bash
npm create vafast@latest my-app
cd my-app
npm run dev
```

</template>

<template v-slot:web-standard>

Vafast 基于 Web 标准构建，可以在任何支持 Web 标准的运行时中运行。

```bash
npm create vafast@latest my-app
cd my-app
npm run dev
```

</template>

</Tab>

## 下一步

现在你已经成功创建了一个 Vafast 应用！接下来你可以：

- 查看 [核心概念](/key-concept) 了解 Vafast 的基本原理
- 阅读 [路由指南](/routing) 学习如何定义路由
- 探索 [中间件系统](/middleware) 了解如何扩展功能
- 查看 [示例项目](/examples) 获取更多灵感

如果你遇到任何问题，请查看 [故障排除](/troubleshooting) 页面或加入我们的社区。
