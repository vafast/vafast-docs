---
title: Node.js 框架的 10 个写法痛点，以及更优雅的解决方案
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../components/blog/Layout.vue'
</script>

<Blog
title="Node.js 框架的 10 个写法痛点，以及更优雅的解决方案"
src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80"
alt="Node.js 框架痛点分析"
author="vafast"
date="2025 年 1 月"
>

> Express、Koa、Fastify、Hono、Elysia... 用了这么多框架，总有些地方让人难受。这篇文章整理了 Node.js 框架开发中常见的 10 个写法痛点，以及如何用声明式的方式优雅解决。

## 痛点一：路由分散，找个接口像大海捞针

### Express / Koa / Hono 的写法

```typescript
// Express
app.get('/users', getUsers)
app.post('/users', createUser)
app.get('/users/:id', getUser)
// 50 行后...
app.get('/posts', getPosts)
// 100 行后...
app.get('/comments', getComments)
// 想知道项目有哪些接口？慢慢翻吧...
```

### Vafast 的写法

```typescript
const routes = defineRoutes([
  { method: 'GET',    path: '/users',     handler: getUsers },
  { method: 'POST',   path: '/users',     handler: createUser },
  { method: 'GET',    path: '/users/:id', handler: getUser },
  { method: 'GET',    path: '/posts',     handler: getPosts },
  { method: 'GET',    path: '/comments',  handler: getComments },
])
```

**路由就是数组，所有接口一目了然。**

## 痛点二：中间件作用域混乱

### Express 的写法

```typescript
app.use(cors())  // 全局？
app.use('/api', authMiddleware)  // /api/* 都生效
app.get('/api/users', getUsers)  // 有 auth
app.get('/api/public', getPublic)  // 也有 auth？不想要啊！
```

### Vafast 的写法

```typescript
const routes = defineRoutes([
  { method: 'GET', path: '/public', handler: publicHandler },
  { method: 'GET', path: '/api/users', middleware: [authMiddleware], handler: getUsers },
])
```

**中间件直接声明在路由上，一眼就能看出来。**

## 痛点三：类型推断跨文件就丢失

### Hono 的类型问题

```typescript
// app.ts
type Env = { Variables: { user: { id: string } } }
const app = new Hono<Env>()

// routes.ts - 类型丢失
export function setupRoutes(app: Hono) {
  app.get('/profile', (c) => {
    const user = c.get('user')  // ❌ 类型是 unknown
  })
}
```

### Vafast 的写法

```typescript
// handlers/profile.ts
export const getProfile = createHandlerWithExtra<AuthContext>(
  (ctx) => {
    const user = ctx.user  // ✅ 类型完整
    return { profile: user }
  }
)
```

**类型跟着 Handler 走，不跟着 App 实例走。**

## 痛点四：错误处理各写各的

### 问题

团队每个人的错误响应格式都不一样：`{ message }` / `{ error }` / `{ code, msg }`

### Vafast 的写法

```typescript
throw err.notFound('用户不存在')
// 统一响应: { "error": "NOT_FOUND", "message": "用户不存在" }
```

**语义化的错误 API，统一的响应格式。**

## 痛点五：参数验证和类型两套逻辑

### Express + Zod

```typescript
const schema = z.object({ name: z.string() })
app.post('/users', (req, res) => {
  const result = schema.safeParse(req.body)  // 手动验证
  if (!result.success) return res.status(400).json(...)
})
```

### Vafast 的写法

```typescript
const createUser = createHandler(
  { body: Type.Object({ name: Type.String() }) },
  ({ body }) => {
    // 自动验证 + 自动推断类型
    return { id: crypto.randomUUID(), ...body }
  }
)
```

**Schema 定义一次，验证和类型推断自动完成。**

## 痛点六：响应处理繁琐

### Express

```typescript
res.json(users)  // 要手动调用
res.status(201).json(user)  // 要手动设置状态码
```

### Vafast

```typescript
return users  // 自动转 JSON
return json(user, 201)  // 自定义状态码
```

**直接 return，框架自动处理。**

## 痛点七：切换运行时要改代码

Express 只能跑 Node.js，Elysia 只能跑 Bun。

### Vafast

```typescript
// 同一份代码
export default { fetch: server.fetch }  // Bun / Workers
serve({ fetch: server.fetch })  // Node.js
```

**基于 Web 标准，一套代码到处运行。**

## 痛点八：嵌套路由写起来很啰嗦

### Express

```typescript
const userRouter = express.Router()
const postRouter = express.Router()
userRouter.use('/:id/posts', postRouter)
app.use('/api/users', userRouter)
```

### Vafast

```typescript
const routes = defineRoutes([
  {
    path: '/api/users',
    children: [
      { method: 'GET', path: '/', handler: getUsers },
      { path: '/:id/posts', children: [...] }
    ]
  }
])
```

**声明式嵌套，层级清晰。**

## 痛点九：Format 验证要自己写

### Zod

```typescript
const phone = z.string().regex(/^1[3-9]\d{9}$/)  // 每次都要写
```

### Vafast

```typescript
Type.String({ format: 'phone' })  // 内置 30+ 格式
```

## 痛点十：前端调用接口没有类型提示

### 传统方式

前后端各维护一套类型，容易不同步。

### Vafast + @vafast/api-client

```typescript
type Api = InferEden<typeof routes>
const api = eden<Api>('http://localhost:3000')
const { data } = await api.login.post({ email, password })
// 完整类型提示，自动同步
```

## 完整对比表

| 痛点 | Express | Hono | Elysia | Vafast |
|------|---------|------|--------|--------|
| 路由可读性 | ❌ | ❌ | ❌ | ✅ |
| 中间件控制 | ❌ | ❌ | ⚠️ | ✅ |
| 跨文件类型 | ❌ | ❌ | ⚠️ | ✅ |
| 错误格式 | ❌ | ❌ | ⚠️ | ✅ |
| 跨运行时 | ❌ | ✅ | ❌ | ✅ |
| 内置 Format | ❌ | ❌ | ⚠️ | ✅ |
| 前后端类型同步 | ❌ | ❌ | ⚠️ | ✅ |

## 快速体验

```bash
npx create-vafast-app my-app
cd my-app
npm run dev
```

**如果你也被这些痛点困扰过，欢迎试试 Vafast。**

</Blog>
