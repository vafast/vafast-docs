---
title: 用了半年 Hono 和 Elysia，我总结了这些坑
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../components/blog/Layout.vue'
</script>

<Blog
title="用了半年 Hono 和 Elysia，我总结了这些坑"
src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80"
alt="Hono 和 Elysia 框架踩坑总结"
author="vafast"
date="2025 年 1 月"
>

> Hono 和 Elysia 是目前最火的两个 TypeScript Web 框架，一个主打轻量跨平台，一个主打极致性能。用了半年后，我来聊聊实际开发中遇到的坑。

## 前言

先说结论：**Hono 和 Elysia 都是优秀的框架**，性能好、类型支持强。但「优秀」不代表「完美」，在实际项目中，有些设计会让你踩坑。

这篇文章不是要黑这两个框架，而是帮你**提前避坑**。

## Part 1: Hono 的坑

### 坑 1：路由通配符匹配规则不直观

```typescript
app.get('/api/*', handler)
// ✅ 匹配 /api/users
// ❌ 不匹配 /api

// 想同时匹配？要写两遍
app.get('/api', handler)
app.get('/api/*', handler)
```

### 坑 2：c.set() 的类型要提前声明

```typescript
// 必须在泛型里声明
type Env = { Variables: { user: User } }
const app = new Hono<Env>()

// 跨文件就麻烦了...
```

### 坑 3：路径参数永远是 string

```typescript
const id = c.req.param('id')  // 永远是 string
const numId = parseInt(id)     // 每次都要转
```

### 坑 4：验证要额外安装，写法繁琐

```typescript
import { zValidator } from '@hono/zod-validator'

app.post('/users',
  zValidator('json', schema),
  (c) => {
    const body = c.req.valid('json')  // 要用 .valid()
  }
)
```

### 坑 5：RPC 客户端类型推断有坑

```typescript
const res = await client.users.$get()
const data = await res.json()  // 还要手动 .json()
// POST 的 body 类型推断不准
```

### 坑 6：错误处理不统一

HTTPException 和直接返回的响应格式不一样，团队没标准。

## Part 2: Elysia 的坑

### 坑 1：链式调用太长

```typescript
const app = new Elysia()
  .state('version', '1.0.0')
  .decorate('logger', new Logger())
  .derive(({ headers }) => ({ auth: headers.authorization }))
  .onBeforeHandle(...)
  .onAfterHandle(...)
  .get('/users', ...)
  .post('/users', ...)
  .listen(3000)

// 50 行链式调用，找路由要翻半天
```

### 坑 2：概念太多

- `state` - 全局状态
- `decorate` - 注入工具
- `derive` - 每次请求派生
- `resolve` - 验证后派生

新人要花很长时间理解。

### 坑 3：guard 嵌套地狱

```typescript
.guard({}, app => app
  .guard({}, app => app
    .guard({}, app => app
      .post('/resource', handler)
    )
  )
)
// 缩进层级恐怖
```

### 坑 4：插件类型必须在链上 use

不能把插件配置抽到单独文件复用。

### 坑 5：拆分文件后类型推断断裂

```typescript
// routes/users.ts
export const userRoutes = new Elysia()
  .get('/users', ({ db }) => {
    // ❌ db 不存在，因为是在主 app 上 decorate 的
  })
```

### 坑 6：只能跑在 Bun

- ❌ Node.js
- ❌ Cloudflare Workers
- ❌ Vercel Edge
- ❌ AWS Lambda

选择 Elysia 就被运行时锁定了。

### 坑 7：错误处理要理解生命周期

7 个生命周期钩子，要看文档才能搞清楚行为。

## Part 3: 解决方案

### Hono 的应对

1. 路由通配符：写两遍或用正则
2. 类型声明：定义全局 Env 类型
3. 验证：用 @hono/zod-validator

### Elysia 的应对

1. 链式调用：拆分文件用 .use() 组合
2. 概念多：花时间学习
3. 运行时锁定：确保团队支持 Bun

### 或者，考虑其他方案

**声明式路由**：

```typescript
const routes = defineRoutes([
  defineRoute({ method: 'GET', path: '/users', handler: getUsers }),
  defineRoute({ method: 'POST', path: '/users', handler: createUser, middleware: [auth] }),
])
```

**优点**：
- 路由一目了然
- 中间件显式声明
- 类型跨文件不丢失
- 不绑定运行时

## 总结

| 框架 | 优点 | 坑 |
|------|------|-----|
| **Hono** | 轻量、跨平台 | 通配符规则、类型声明繁琐 |
| **Elysia** | 性能极致 | 链式地狱、Bun 锁定 |

**选型建议**：

- 小项目 → Hono
- 极致性能 + Bun → Elysia
- 大型项目 + 清晰结构 → 声明式框架
- 跨运行时 → Hono 或声明式框架

**你在用 Hono 或 Elysia 吗？遇到过什么坑？欢迎交流！**

</Blog>
