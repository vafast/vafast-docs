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
        title: 'Vafast + Drizzle：轻量高效的全栈类型安全方案',
        href: '/blog/with-drizzle',
        cover: 'drizzle.webp',
        detail: 'Drizzle ORM 与 Vafast 的组合为 TypeScript 开发者提供了一套轻量、高效、类型安全的全栈解决方案。零代码生成、边缘运行时友好、类 SQL 语法。'
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
        detail: '借助 Prisma、Bun 和 Vafast 的支持，我们进入了开发者体验的新纪元。对于 Prisma，我们可以加速与数据库的交互，而 Vafast 则加速了我们在开发者体验和性能方面创建后端 Web 服务器的过程。'
      }
  ]"
/>
