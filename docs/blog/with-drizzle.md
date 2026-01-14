---
title: Vafast + Drizzle：轻量高效的全栈类型安全方案
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../components/blog/Layout.vue'
</script>

<Blog
title="Vafast + Drizzle：轻量高效的全栈类型安全方案"
src="/blog/with-drizzle/drizzle.webp"
alt="Drizzle ORM"
author="vafast"
date="2024 年 1 月 8 日"
>

Drizzle ORM 是近年来备受关注的 TypeScript ORM，以其轻量、高性能和类 SQL 语法而著称。

与 Prisma 不同，Drizzle 没有代码生成步骤，类型直接从 schema 定义中推断，这使得它与 Vafast 的类型系统完美契合。

## 为什么选择 Drizzle

**轻量级**：Drizzle 的包体积非常小，没有复杂的运行时依赖。

**类 SQL 语法**：如果你熟悉 SQL，Drizzle 的 API 会让你感到非常自然。

**零代码生成**：不需要额外的 generate 步骤，类型直接可用。

**边缘运行时友好**：Drizzle 可以在 Cloudflare Workers、Vercel Edge 等边缘环境中运行。

## 快速开始

首先创建一个 Vafast 项目：

```bash
npx create-vafast-app vafast-drizzle
cd vafast-drizzle
```

安装 Drizzle 相关依赖：

```bash
npm add drizzle-orm better-sqlite3
npm add -D drizzle-kit @types/better-sqlite3
```

这里我们使用 SQLite 作为演示，Drizzle 同样支持 PostgreSQL、MySQL 等数据库。

## 定义 Schema

创建 `src/db/schema.ts`：

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
})

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
})
```

创建 `src/db/index.ts`：

```ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('sqlite.db')
export const db = drizzle(sqlite, { schema })
```

## 配置 Drizzle Kit

创建 `drizzle.config.ts`：

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'sqlite.db'
  }
})
```

生成并推送数据库：

```bash
npx drizzle-kit push
```

## 创建 API

现在让我们用 Vafast 创建 CRUD API：

```ts
import { Server, defineRoute, defineRoutes, serve, Type, err } from 'vafast'
import { db } from './db'
import { users, posts } from './db/schema'
import { eq } from 'drizzle-orm'

// 定义 Schema
const CreateUserBody = Type.Object({
  username: Type.String({ minLength: 3 }),
  email: Type.String({ format: 'email' })
})

const CreatePostBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String(),
  authorId: Type.Number()
})

const routes = defineRoutes([
  // 用户相关
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: async () => {
      return await db.select().from(users)
    }
  }),
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async ({ params }) => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(params.id)))
        .get()
      
      if (!user) {
        throw err.notFound('用户不存在')
      }
      return user
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: { body: CreateUserBody },
    handler: async ({ body }) => {
      const result = await db.insert(users).values(body).returning()
      return result[0]
    }
  }),
  
  // 文章相关
  defineRoute({
    method: 'GET',
    path: '/posts',
    handler: async () => {
      return await db.select().from(posts)
    }
  }),
  defineRoute({
    method: 'POST',
    path: '/posts',
    schema: { body: CreatePostBody },
    handler: async ({ body }) => {
      const result = await db.insert(posts).values(body).returning()
      return result[0]
    }
  }),
  
  // 获取用户的所有文章
  defineRoute({
    method: 'GET',
    path: '/users/:id/posts',
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async ({ params }) => {
      return await db
        .select()
        .from(posts)
        .where(eq(posts.authorId, Number(params.id)))
    }
  })
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('服务器运行在 http://localhost:3000')
})
```

## 关联查询

Drizzle 支持强大的关联查询。让我们添加一个获取文章详情（包含作者信息）的接口：

```ts
import { db } from './db'
import { users, posts } from './db/schema'
import { eq } from 'drizzle-orm'

// 获取文章及作者信息
defineRoute({
  method: 'GET',
  path: '/posts/:id/detail',
  schema: { params: Type.Object({ id: Type.String() }) },
  handler: async ({ params }) => {
      const result = await db
        .select({
          post: posts,
          author: {
            id: users.id,
            username: users.username
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, Number(params.id)))
        .get()
      
      if (!result) {
        throw err.notFound('文章不存在')
      }
      
      return {
        ...result.post,
        author: result.author
      }
    }
  })
```

## 事务处理

Drizzle 支持事务，确保数据一致性：

```ts
const TransferBody = Type.Object({
  fromUserId: Type.Number(),
  toUserId: Type.Number(),
  postId: Type.Number()
})

defineRoute({
  method: 'POST',
  path: '/posts/transfer',
  schema: { body: TransferBody },
  handler: async ({ body }) => {
      return await db.transaction(async (tx) => {
        // 检查文章是否属于原作者
        const post = await tx
          .select()
          .from(posts)
          .where(eq(posts.id, body.postId))
          .get()
        
        if (!post || post.authorId !== body.fromUserId) {
          throw err.badRequest('无权转让此文章')
        }
        
        // 更新文章作者
        const result = await tx
          .update(posts)
          .set({ authorId: body.toUserId })
          .where(eq(posts.id, body.postId))
          .returning()
        
        return result[0]
      })
    }
  })
```

## 边缘部署

Drizzle 的一大优势是支持边缘运行时。使用 D1（Cloudflare 的 SQLite）：

```ts
// 在 Cloudflare Workers 中使用
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'

export default {
  async fetch(request: Request, env: Env) {
    const db = drizzle(env.DB, { schema })
    
    const server = new Server(routes)
    return server.fetch(request)
  }
}
```

## Vafast + Drizzle 的优势

**类型一致性**：Drizzle 的 schema 类型与 Vafast 的 Type schema 可以完美配合，实现从数据库到 API 的完整类型安全。

**零生成步骤**：不需要运行 `prisma generate`，修改 schema 后类型立即可用。

**边缘友好**：两者都支持各种边缘运行时，可以轻松部署到 Cloudflare Workers、Vercel Edge 等平台。

**高性能**：Vafast 的高性能路由 + Drizzle 的轻量查询，带来极致的性能体验。

## 总结

Drizzle ORM 与 Vafast 的组合为 TypeScript 开发者提供了一套轻量、高效、类型安全的全栈解决方案。

如果你追求更小的包体积、更快的启动速度、更接近 SQL 的开发体验，Drizzle + Vafast 是一个值得尝试的选择。

查看更多：
- [Drizzle ORM 文档](https://orm.drizzle.team)
- [Vafast GitHub](https://github.com/vafast/vafast)

</Blog>
