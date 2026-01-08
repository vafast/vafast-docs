---
title: Vafast 博客
layout: page
sidebar: false
editLink: false
search: false
gitChangelog: false
authors: []
---

<script setup>
    import Blogs from './components/blog/Landing.vue'
</script>

<Blogs
  :blogs="[
      {
        title: 'Vafast：一个让我放弃 Express 和 Hono 的 TypeScript Web 框架',
        href: '/blog/why-vafast',
        cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
        detail: '声明式路由 + 端到端类型安全 + 比 Express 快 1.8 倍，这就是我想要的 Node.js 框架。'
      },
      {
        title: 'Node.js 框架的 10 个写法痛点，以及更优雅的解决方案',
        href: '/blog/nodejs-framework-pain-points',
        cover: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
        detail: 'Express、Koa、Fastify、Hono、Elysia... 用了这么多框架，总有些地方让人难受。这篇文章整理了常见的 10 个写法痛点。'
      },
      {
        title: '用了半年 Hono 和 Elysia，我总结了这些坑',
        href: '/blog/hono-elysia-pitfalls',
        cover: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
        detail: 'Hono 和 Elysia 是目前最火的两个 TypeScript Web 框架。用了半年后，我来聊聊实际开发中遇到的坑。'
      },
      {
        title: 'Vafast + Drizzle：轻量高效的全栈类型安全方案',
        href: '/blog/with-drizzle',
        cover: 'drizzle.webp',
        detail: 'Drizzle ORM 与 Vafast 的组合为 TypeScript 开发者提供了一套轻量、高效、类型安全的全栈解决方案。'
      },
      {
        title: 'Vafast 中间件设计模式与最佳实践',
        href: '/blog/middleware-patterns',
        cover: 'cover.webp',
        detail: '中间件是 Web 框架中最强大的概念之一。本文介绍认证、限流、日志、错误处理、CORS、缓存等 7 种常用中间件设计模式。'
      },
      {
        title: '用 Vafast 加速你的下一个 Prisma 服务器',
        href: '/blog/with-prisma',
        cover: 'prism.webp',
        detail: '借助 Prisma、Bun 和 Vafast 的支持，我们进入了开发者体验的新纪元。'
      }
  ]"
/>
