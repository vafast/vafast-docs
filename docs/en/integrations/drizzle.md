---
title: Drizzle Integration - Vafast
description: 'Guide to integrating Vafast with Drizzle ORM: database config, schema definitions, type-safe queries, usage in Vafast routes, migrations, transactions and connection pool management.'
---

# Drizzle Integration

Vafast integrates seamlessly with Drizzle ORM, giving you type-safe database operations and a great developer experience.

## Installing Dependencies

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

## Database Configuration

::: code-group

```typescript [SQLite]
// src/db/config.ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'

// create the database connection
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

## Defining the Database Schema

::: code-group

```typescript [SQLite]
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// posts table
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// tags table
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
})

// post-tag join table
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

// users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// posts table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// tags table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
```

```typescript [MySQL]
// src/db/schema.ts
import { mysqlTable, varchar, text, boolean, timestamp } from 'drizzle-orm/mysql-core'

// users table
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
})

// posts table
export const posts = mysqlTable('posts', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: varchar('author_id', { length: 36 }).notNull().references(() => users.id),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
})

// tags table
export const tags = mysqlTable('tags', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
```

:::

```typescript
// export types (shared by all databases)
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
```

## Database Query Functions

```typescript
// src/db/queries.ts
import { eq, and, like, desc, asc, count } from 'drizzle-orm'
import { db } from './config'
import { users, posts, tags, postTags } from './schema'
import type { NewUser, NewPost, NewTag } from './schema'

// user queries
export const userQueries = {
  // find a user by email
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return result[0] || null
  },

  // find a user by ID
  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] || null
  },

  // create a user
  async create(userData: NewUser) {
    const result = await db.insert(users).values(userData).returning()
    return result[0]
  },

  // update a user
  async update(id: string, userData: Partial<NewUser>) {
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .returning()
    return result[0]
  },

  // delete a user
  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id))
  },

  // list users (paginated)
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

// post queries
export const postQueries = {
  // get all published posts
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

  // get a post by ID
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

  // create a post
  async create(postData: NewPost) {
    const result = await db.insert(posts).values(postData).returning()
    return result[0]
  },

  // update a post
  async update(id: string, postData: Partial<NewPost>) {
    const result = await db
      .update(posts)
      .set({ ...postData, updatedAt: new Date().toISOString() })
      .where(eq(posts.id, id))
      .returning()
    return result[0]
  },

  // delete a post
  async delete(id: string) {
    await db.delete(posts).where(eq(posts.id, id))
  },

  // search posts
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

// tag queries
export const tagQueries = {
  // get all tags
  async findAll() {
    return await db.select().from(tags).orderBy(asc(tags.name))
  },

  // get a tag by ID
  async findById(id: string) {
    const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1)
    return result[0] || null
  },

  // create a tag
  async create(tagData: NewTag) {
    const result = await db.insert(tags).values(tagData).returning()
    return result[0]
  },

  // delete a tag
  async delete(id: string) {
    await db.delete(tags).where(eq(tags.id, id))
  }
}
```

## Using It in Vafast Routes

```typescript
// src/routes.ts
import { defineRoute, defineRoutes, err, Type } from 'vafast'
import { userQueries, postQueries, tagQueries } from './db/queries'
import { hashPassword, verifyPassword } from './utils/auth'

export const routes = defineRoutes([
  // user auth routes
  defineRoute({
    method: 'POST',
    path: '/api/auth/register',
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        name: Type.String({ minLength: 1 }),
        password: Type.String({ minLength: 6 })
      })
    },
    handler: async ({ body }) => {
      const { email, name, password } = body
      
      // check whether the user already exists
      const existingUser = await userQueries.findByEmail(email)
      if (existingUser) {
        throw err.conflict('User already exists')
      }
      
      // create the new user
      const hashedPassword = await hashPassword(password)
      const newUser = await userQueries.create({
        email,
        name,
        passwordHash: hashedPassword
      })
      
      return { 
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        message: 'Registration successful'
      }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/auth/login',
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 1 })
      })
    },
    handler: async ({ body }) => {
      const { email, password } = body
      
      // find the user
      const user = await userQueries.findByEmail(email)
      if (!user) {
        throw err.unauthorized('User not found')
      }
      
      // verify the password
      const isValidPassword = await verifyPassword(password, user.passwordHash)
      if (!isValidPassword) {
        throw err.unauthorized('Incorrect password')
      }
      
      return { 
        user: { id: user.id, email: user.email, name: user.name },
        message: 'Login successful'
      }
    }
  }),
  
  // post routes
  defineRoute({
    method: 'GET',
    path: '/api/posts',
    schema: {
      query: Type.Object({
        page: Type.Optional(Type.String({ pattern: '^\\d+$' })),
        limit: Type.Optional(Type.String({ pattern: '^\\d+$' }))
      })
    },
    handler: async ({ query }) => {
      const page = parseInt(query.page || '1')
      const limit = parseInt(query.limit || '10')
      
      const result = await postQueries.findPublished(page, limit)
      return result
    }
  }),
  
  defineRoute({
    method: 'GET',
    path: '/api/posts/:id',
    schema: {
      params: Type.Object({
        id: Type.String()
      })
    },
    handler: async ({ params }) => {
      const post = await postQueries.findById(params.id)
      
      if (!post) {
        throw err.notFound('Post not found')
      }
      
      return { post }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/posts',
    schema: {
      body: Type.Object({
        title: Type.String({ minLength: 1 }),
        content: Type.String({ minLength: 1 }),
        published: Type.Optional(Type.Boolean())
      })
    },
    handler: async ({ body, request }) => {
      // the user's identity should be verified here
      const authorId = 'user-id-from-auth' // obtained from the auth middleware
      
      const newPost = await postQueries.create({
        ...body,
        authorId
      })
      
      return { post: newPost }
    }
  }),
  
  defineRoute({
    method: 'PUT',
    path: '/api/posts/:id',
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: Type.Object({
        title: Type.Optional(Type.String({ minLength: 1 })),
        content: Type.Optional(Type.String({ minLength: 1 })),
        published: Type.Optional(Type.Boolean())
      })
    },
    handler: async ({ params, body }) => {
      // the user's identity and permissions should be verified here
      
      const updatedPost = await postQueries.update(params.id, body)
      
      if (!updatedPost) {
        throw err.notFound('Post not found')
      }
      
      return { post: updatedPost }
    }
  }),
  
  defineRoute({
    method: 'DELETE',
    path: '/api/posts/:id',
    schema: {
      params: Type.Object({
        id: Type.String()
      })
    },
    handler: async ({ params }) => {
      // the user's identity and permissions should be verified here
      
      await postQueries.delete(params.id)
      return { message: 'Post deleted successfully' }
    }
  }),
  
  // tag routes
  defineRoute({
    method: 'GET',
    path: '/api/tags',
    handler: async () => {
      const tags = await tagQueries.findAll()
      return { tags }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/tags',
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 })
      })
    },
    handler: async ({ body }) => {
      const newTag = await tagQueries.create(body)
      return { tag: newTag }
    }
  })
])
```

## Database Migrations

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
# generate migration files
npx drizzle-kit generate

# run migrations
npx drizzle-kit migrate

# inspect the database (visual UI)
npx drizzle-kit studio
```

## Transactions

```typescript
// src/db/transactions.ts
import { db } from './config'
import { users, posts } from './schema'

export async function createUserWithPost(userData: any, postData: any) {
  return await db.transaction(async (tx) => {
    // create the user
    const [newUser] = await tx.insert(users).values(userData).returning()
    
    // create the post
    const [newPost] = await tx.insert(posts).values({
      ...postData,
      authorId: newUser.id
    }).returning()
    
    return { user: newUser, post: newPost }
  })
}
```

## Connection Pool Management

::: code-group

```typescript [PostgreSQL]
// src/db/pool.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

// PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { 
  max: 10,              // max connections
  idle_timeout: 20,     // idle timeout (seconds)
  connect_timeout: 10   // connection timeout (seconds)
})
export const db = drizzle(client)

// run migrations
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' })
}

// close the connection pool
export async function closePool() {
  await client.end()
}
```

```typescript [MySQL]
// src/db/pool.ts
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydb',
  connectionLimit: 10,      // max connections
  waitForConnections: true, // wait for an available connection
  queueLimit: 0             // queue limit (0 = unlimited)
})

export const db = drizzle(pool)

// close the connection pool
export async function closePool() {
  await pool.end()
}
```

:::

## Performance Optimization

```typescript
// src/db/optimizations.ts
import { eq, and, like, desc, asc, count, sql } from 'drizzle-orm'
import { db } from './config'
import { posts, users } from './schema'

// use indexes to optimize queries
export async function findPostsWithAuthorOptimized(page = 1, limit = 10) {
  const offset = (page - 1) * limit
  
  // optimize with a subquery
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

// batch operations
export async function batchCreatePosts(postsData: any[]) {
  return await db.insert(posts).values(postsData).returning()
}

// use raw SQL for complex queries
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

## Testing

```typescript
// src/db/__tests__/queries.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { db } from '../config'
import { userQueries, postQueries } from '../queries'
import { users, posts } from '../schema'

describe('Database Queries', () => {
  beforeEach(async () => {
    // clean up test data
    await db.delete(posts)
    await db.delete(users)
  })
  
  afterEach(async () => {
    // clean up test data
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
      // create a user first
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

## Best Practices

1. **Type safety**: make full use of Drizzle's type inference
2. **Query optimization**: use appropriate indexes and query strategies
3. **Transaction management**: use transactions for operations that must be atomic
4. **Connection pooling**: manage database connections with a pool in production
5. **Migration management**: manage schema changes with Drizzle Kit
6. **Test coverage**: write thorough tests for database operations
7. **Performance monitoring**: monitor query performance and optimize slow queries

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [Drizzle docs](https://orm.drizzle.team) - official Drizzle ORM documentation
- [Middleware system](/en/middleware) - explore available middleware
- [Type validation](/en/patterns/type) - learn about the type validation system
- [Deployment guide](/en/patterns/deploy) - production deployment advice
