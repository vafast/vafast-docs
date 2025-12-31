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
        title: '用 Vafast 加速你的下一个 Prisma 服务器',
        href: '/blog/with-prisma',
        cover: 'prism.webp',
        detail: '借助 Prisma、Bun 和 Vafast 的支持，我们进入了开发者体验的新纪元。对于 Prisma，我们可以加速与数据库的交互，而 Vafast 则加速了我们在开发者体验和性能方面创建后端 Web 服务器的过程。'
      }
  ]"
/>
