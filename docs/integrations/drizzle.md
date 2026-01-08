---
title: Drizzle 集成 - Vafast
---

# Drizzle 集成

Vafast 可以与 Drizzle ORM 无缝集成，为您提供类型安全的数据库操作和优秀的开发体验。

## 安装依赖

::: code-group

```bash [SQLite]
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

```bash [PostgreSQL]
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

```bash [MySQL]
npm install drizzle-orm mysql2
npm install -D drizzle-kit
```

:::

## 数据库配置

::: code-group

```typescript [SQLite]
// src/db/config.ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'

// 创建数据库连接
const sqlite = new Database('sqlite.db')
export const db = drizzle(sqlite)
```

```typescript [PostgreSQL]
// src/db/config.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { max: 10 })
export const db = drizzle(client)
```

```typescript [MySQL]
// src/db/config.ts
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydb',
  connectionLimit: 10
})

export const db = drizzle(pool)
```

:::

## 定义数据库模式

::: code-group

```typescript [SQLite]
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// 文章表
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// 标签表
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
})

// 文章标签关联表
export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id),
  tagId: text('tag_id').notNull().references(() => tags.id)
}, (table) => ({
  pk: sql`primary key(${table.postId}, ${table.tagId})`
}))
```

```typescript [PostgreSQL]
// src/db/schema.ts
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'

// 用户表
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// 文章表
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// 标签表
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
```

```typescript [MySQL]
// src/db/schema.ts
import { mysqlTable, varchar, text, boolean, timestamp } from 'drizzle-orm/mysql-core'

// 用户表
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
})

// 文章表
export const posts = mysqlTable('posts', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: varchar('author_id', { length: 36 }).notNull().references(() => users.id),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
})

// 标签表
export const tags = mysqlTable('tags', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
```

:::

```typescript
// 导出类型（所有数据库通用）
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
```

## 数据库查询函数

```typescript
// src/db/queries.ts
import { eq, and, like, desc, asc, count } from 'drizzle-orm'
import { db } from './config'
import { users, posts, tags, postTags } from './schema'
import type { NewUser, NewPost, NewTag } from './schema'

// 用户相关查询
export const userQueries = {
  // 根据邮箱查找用户
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return result[0] || null
  },

  // 根据ID查找用户
  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] || null
  },

  // 创建用户
  async create(userData: NewUser) {
    const result = await db.insert(users).values(userData).returning()
    return result[0]
  },

  // 更新用户
  async update(id: string, userData: Partial<NewUser>) {
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .returning()
    return result[0]
  },

  // 删除用户
  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id))
  },

  // 获取用户列表（分页）
  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit
    
    const [usersList, totalCount] = await Promise.all([
      db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
      db.select({ count: count() }).from(users)
    ])
    
    return {
      users: usersList,
      total: totalCount[0].count,
      page,
      limit,
      totalPages: Math.ceil(totalCount[0].count / limit)
    }
  }
}

// 文章相关查询
export const postQueries = {
  // 获取所有已发布的文章
  async findPublished(page = 1, limit = 10) {
    const offset = (page - 1) * limit
    
    const [postsList, totalCount] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          published: posts.published,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.published, true))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(posts.createdAt)),
      
      db.select({ count: count() }).from(posts).where(eq(posts.published, true))
    ])
    
    return {
      posts: postsList,
      total: totalCount[0].count,
      page,
      limit,
      totalPages: Math.ceil(totalCount[0].count / limit)
    }
  },

  // 根据ID获取文章
  async findById(id: string) {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id))
      .limit(1)
    
    return result[0] || null
  },

  // 创建文章
  async create(postData: NewPost) {
    const result = await db.insert(posts).values(postData).returning()
    return result[0]
  },

  // 更新文章
  async update(id: string, postData: Partial<NewPost>) {
    const result = await db
      .update(posts)
      .set({ ...postData, updatedAt: new Date().toISOString() })
      .where(eq(posts.id, id))
      .returning()
    return result[0]
  },

  // 删除文章
  async delete(id: string) {
    await db.delete(posts).where(eq(posts.id, id))
  },

  // 搜索文章
  async search(query: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit
    const searchTerm = `%${query}%`
    
    const [postsList, totalCount] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          published: posts.published,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(posts.published, true),
            like(posts.title, searchTerm)
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(desc(posts.createdAt)),
      
      db
        .select({ count: count() })
        .from(posts)
        .where(
          and(
            eq(posts.published, true),
            like(posts.title, searchTerm)
          )
        )
    ])
    
    return {
      posts: postsList,
      total: totalCount[0].count,
      page,
      limit,
      totalPages: Math.ceil(totalCount[0].count / limit)
    }
  }
}

// 标签相关查询
export const tagQueries = {
  // 获取所有标签
  async findAll() {
    return await db.select().from(tags).orderBy(asc(tags.name))
  },

  // 根据ID获取标签
  async findById(id: string) {
    const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1)
    return result[0] || null
  },

  // 创建标签
  async create(tagData: NewTag) {
    const result = await db.insert(tags).values(tagData).returning()
    return result[0]
  },

  // 删除标签
  async delete(id: string) {
    await db.delete(tags).where(eq(tags.id, id))
  }
}
```

## 在 Vafast 路由中使用

```typescript
// src/routes.ts
import { defineRoutes, createHandler, VafastError, Type } from 'vafast'
import { userQueries, postQueries, tagQueries } from './db/queries'
import { hashPassword, verifyPassword } from './utils/auth'

export const routes = defineRoutes([
  // 用户认证路由
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: createHandler(async ({ body }) => {
      const { email, name, password } = body
      
      // 检查用户是否已存在
      const existingUser = await userQueries.findByEmail(email)
      if (existingUser) {
        throw err.conflict('用户已存在')
      }
      
      // 创建新用户
      const hashedPassword = await hashPassword(password)
      const newUser = await userQueries.create({
        email,
        name,
        passwordHash: hashedPassword
      })
      
      return { 
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        message: '注册成功'
      }
    }),
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      name: Type.String({ minLength: 1 }),
      password: Type.String({ minLength: 6 })
    })
  },
  
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: createHandler(async ({ body }) => {
      const { email, password } = body
      
      // 查找用户
      const user = await userQueries.findByEmail(email)
      if (!user) {
        throw err.unauthorized('用户不存在')
      }
      
      // 验证密码
      const isValidPassword = await verifyPassword(password, user.passwordHash)
      if (!isValidPassword) {
        throw err.unauthorized('密码错误')
      }
      
      return { 
        user: { id: user.id, email: user.email, name: user.name },
        message: '登录成功'
      }
    }),
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      password: Type.String({ minLength: 1 })
    })
  },
  
  // 文章路由
  {
    method: 'GET',
    path: '/api/posts',
    handler: createHandler(async ({ query }) => {
      const page = parseInt(query.page || '1')
      const limit = parseInt(query.limit || '10')
      
      const result = await postQueries.findPublished(page, limit)
      return result
    }),
    query: Type.Object({
      page: Type.Optional(Type.String({ pattern: '^\\d+$' })),
      limit: Type.Optional(Type.String({ pattern: '^\\d+$' }))
    })
  },
  
  {
    method: 'GET',
    path: '/api/posts/:id',
    handler: createHandler(async ({ params }) => {
      const post = await postQueries.findById(params.id)
      
      if (!post) {
        throw err.notFound('文章不存在')
      }
      
      return { post }
    }),
    params: Type.Object({
      id: Type.String()
    })
  },
  
  {
    method: 'POST',
    path: '/api/posts',
    handler: createHandler(async ({ body, request }) => {
      // 这里应该验证用户身份
      const authorId = 'user-id-from-auth' // 从认证中间件获取
      
      const newPost = await postQueries.create({
        ...body,
        authorId
      })
      
      return { post: newPost }
    }),
    body: Type.Object({
      title: Type.String({ minLength: 1 }),
      content: Type.String({ minLength: 1 }),
      published: Type.Optional(Type.Boolean())
    })
  },
  
  {
    method: 'PUT',
    path: '/api/posts/:id',
    handler: createHandler(async ({ params, body }) => {
      // 这里应该验证用户身份和权限
      
      const updatedPost = await postQueries.update(params.id, body)
      
      if (!updatedPost) {
        throw err.notFound('文章不存在')
      }
      
      return { post: updatedPost }
    }),
    params: Type.Object({
      id: Type.String()
    }),
    body: Type.Object({
      title: Type.Optional(Type.String({ minLength: 1 })),
      content: Type.Optional(Type.String({ minLength: 1 })),
      published: Type.Optional(Type.Boolean())
    })
  },
  
  {
    method: 'DELETE',
    path: '/api/posts/:id',
    handler: createHandler(async ({ params }) => {
      // 这里应该验证用户身份和权限
      
      await postQueries.delete(params.id)
      return { message: '文章删除成功' }
    }),
    params: Type.Object({
      id: Type.String()
    })
  },
  
  // 标签路由
  {
    method: 'GET',
    path: '/api/tags',
    handler: createHandler(async () => {
      const tags = await tagQueries.findAll()
      return { tags }
    })
  },
  
  {
    method: 'POST',
    path: '/api/tags',
    handler: createHandler(async ({ body }) => {
      const newTag = await tagQueries.create(body)
      return { tag: newTag }
    }),
    body: Type.Object({
      name: Type.String({ minLength: 1 })
    })
  }
])
```

## 数据库迁移

::: code-group

```typescript [SQLite]
// drizzle.config.ts
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

```typescript [PostgreSQL]
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
```

```typescript [MySQL]
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mydb'
  }
})
```

:::

```bash
# 生成迁移文件
npx drizzle-kit generate

# 运行迁移
npx drizzle-kit migrate

# 查看数据库状态（可视化界面）
npx drizzle-kit studio
```

## 事务处理

```typescript
// src/db/transactions.ts
import { db } from './config'
import { users, posts } from './schema'

export async function createUserWithPost(userData: any, postData: any) {
  return await db.transaction(async (tx) => {
    // 创建用户
    const [newUser] = await tx.insert(users).values(userData).returning()
    
    // 创建文章
    const [newPost] = await tx.insert(posts).values({
      ...postData,
      authorId: newUser.id
    }).returning()
    
    return { user: newUser, post: newPost }
  })
}
```

## 连接池管理

::: code-group

```typescript [PostgreSQL]
// src/db/pool.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

// PostgreSQL 连接池
const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { 
  max: 10,              // 最大连接数
  idle_timeout: 20,     // 空闲超时（秒）
  connect_timeout: 10   // 连接超时（秒）
})
export const db = drizzle(client)

// 运行迁移
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' })
}

// 关闭连接池
export async function closePool() {
  await client.end()
}
```

```typescript [MySQL]
// src/db/pool.ts
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

// MySQL 连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydb',
  connectionLimit: 10,      // 最大连接数
  waitForConnections: true, // 等待可用连接
  queueLimit: 0             // 队列限制（0=无限制）
})

export const db = drizzle(pool)

// 关闭连接池
export async function closePool() {
  await pool.end()
}
```

:::

## 性能优化

```typescript
// src/db/optimizations.ts
import { eq, and, like, desc, asc, count, sql } from 'drizzle-orm'
import { db } from './config'
import { posts, users } from './schema'

// 使用索引优化查询
export async function findPostsWithAuthorOptimized(page = 1, limit = 10) {
  const offset = (page - 1) * limit
  
  // 使用子查询优化
  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      published: posts.published,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorEmail: users.email
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.published, true))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(posts.createdAt))
  
  return result
}

// 批量操作
export async function batchCreatePosts(postsData: any[]) {
  return await db.insert(posts).values(postsData).returning()
}

// 使用原生 SQL 进行复杂查询
export async function findPostsByTag(tagName: string) {
  const result = await db.execute(sql`
    SELECT p.*, u.name as author_name
    FROM posts p
    INNER JOIN users u ON p.author_id = u.id
    INNER JOIN post_tags pt ON p.id = pt.post_id
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE t.name = ${tagName} AND p.published = true
    ORDER BY p.created_at DESC
  `)
  
  return result
}
```

## 测试

```typescript
// src/db/__tests__/queries.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { db } from '../config'
import { userQueries, postQueries } from '../queries'
import { users, posts } from '../schema'

describe('Database Queries', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.delete(posts)
    await db.delete(users)
  })
  
  afterEach(async () => {
    // 清理测试数据
    await db.delete(posts)
    await db.delete(users)
  })
  
  describe('User Queries', () => {
    it('should create and find user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password'
      }
      
      const newUser = await userQueries.create(userData)
      expect(newUser).toBeDefined()
      expect(newUser.email).toBe(userData.email)
      
      const foundUser = await userQueries.findByEmail(userData.email)
      expect(foundUser).toBeDefined()
      expect(foundUser?.id).toBe(newUser.id)
    })
  })
  
  describe('Post Queries', () => {
    it('should create and find post', async () => {
      // 先创建用户
      const user = await userQueries.create({
        email: 'author@example.com',
        name: 'Author',
        passwordHash: 'hashed_password'
      })
      
      const postData = {
        title: 'Test Post',
        content: 'Test content',
        authorId: user.id,
        published: true
      }
      
      const newPost = await postQueries.create(postData)
      expect(newPost).toBeDefined()
      expect(newPost.title).toBe(postData.title)
      
      const foundPost = await postQueries.findById(newPost.id)
      expect(foundPost).toBeDefined()
      expect(foundPost?.title).toBe(postData.title)
    })
  })
})
```

## 最佳实践

1. **类型安全**：充分利用 Drizzle 的类型推断功能
2. **查询优化**：使用适当的索引和查询策略
3. **事务管理**：在需要原子性的操作中使用事务
4. **连接池**：在生产环境中使用连接池管理数据库连接
5. **迁移管理**：使用 Drizzle Kit 管理数据库模式变更
6. **测试覆盖**：为数据库操作编写完整的测试
7. **性能监控**：监控查询性能并优化慢查询

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [Drizzle 文档](https://orm.drizzle.team) - Drizzle ORM 官方文档
- [中间件系统](/middleware) - 探索可用的中间件
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
