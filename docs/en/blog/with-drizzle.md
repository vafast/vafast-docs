---
title: 'Vafast + Drizzle: A Lightweight, Efficient Full-Stack Type-Safe Stack'
description: 'Full-stack type safety with Vafast + Drizzle ORM: no code generation, types inferred directly from your schema, a lightweight and efficient way to build TypeScript APIs and data access layers.'
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../../components/blog/Layout.vue'
</script>

<Blog
title="Vafast + Drizzle: A Lightweight, Efficient Full-Stack Type-Safe Stack"
src="/blog/with-drizzle/drizzle.webp"
alt="Drizzle ORM"
author="vafast"
date="January 8, 2024"
>

Drizzle ORM is a TypeScript ORM that has drawn a lot of attention in recent years, known for being lightweight, fast and SQL-like.

Unlike Prisma, Drizzle has no code generation step; types are inferred directly from the schema definition, which makes it a perfect fit for Vafast's type system.

## Why Drizzle

**Lightweight**: Drizzle's package is tiny, with no complex runtime dependencies.

**SQL-like syntax**: if you know SQL, Drizzle's API will feel very natural.

**Zero code generation**: no extra generate step; types are available immediately.

**Edge-runtime friendly**: Drizzle runs on edge environments such as Cloudflare Workers and Vercel Edge.

## Quick Start

First, create a Vafast project:

```bash
npx create-vafast-app vafast-drizzle
cd vafast-drizzle
```

Install the Drizzle dependencies:

```bash
npm add drizzle-orm better-sqlite3
npm add -D drizzle-kit @types/better-sqlite3
```

We use SQLite for this demo; Drizzle also supports PostgreSQL, MySQL and other databases.

## Defining the Schema

Create `src/db/schema.ts`:

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

Create `src/db/index.ts`:

```ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('sqlite.db')
export const db = drizzle(sqlite, { schema })
```

## Configuring Drizzle Kit

Create `drizzle.config.ts`:

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

Generate and push the database:

```bash
npx drizzle-kit push
```

## Building the API

Now let's build a CRUD API with Vafast:

```ts
import { Server, defineRoute, defineRoutes, serve, Type, err } from 'vafast'
import { db } from './db'
import { users, posts } from './db/schema'
import { eq } from 'drizzle-orm'

// define the schemas
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
  // user routes
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
        throw err.notFound('User not found')
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
  
  // post routes
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
  
  // get all posts by a user
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
  console.log('Server running at http://localhost:3000')
})
```

## Relational Queries

Drizzle supports powerful relational queries. Let's add an endpoint that returns a post with its author:

```ts
import { db } from './db'
import { users, posts } from './db/schema'
import { eq } from 'drizzle-orm'

// get a post with its author
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
        throw err.notFound('Post not found')
      }
      
      return {
        ...result.post,
        author: result.author
      }
    }
  })
```

## Transactions

Drizzle supports transactions to keep data consistent:

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
        // check that the post belongs to the original author
        const post = await tx
          .select()
          .from(posts)
          .where(eq(posts.id, body.postId))
          .get()
        
        if (!post || post.authorId !== body.fromUserId) {
          throw err.badRequest('Not allowed to transfer this post')
        }
        
        // update the post's author
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

## Edge Deployment

A big advantage of Drizzle is edge runtime support. Using D1 (Cloudflare's SQLite):

```ts
// using it in Cloudflare Workers
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

## Why Vafast + Drizzle

**Type consistency**: Drizzle's schema types work perfectly with Vafast's Type schemas, giving full type safety from the database to the API.

**No generate step**: no need to run `prisma generate`; types are available as soon as you change the schema.

**Edge friendly**: both support a range of edge runtimes, so you can deploy easily to Cloudflare Workers, Vercel Edge and more.

**High performance**: Vafast's fast routing + Drizzle's lightweight queries deliver top-notch performance.

## Summary

Drizzle ORM and Vafast together give TypeScript developers a lightweight, efficient and type-safe full-stack solution.

If you want a smaller bundle, faster startup and a development experience closer to SQL, Drizzle + Vafast is well worth trying.

See more:
- [Drizzle ORM docs](https://orm.drizzle.team)
- [Vafast GitHub](https://github.com/vafast/vafast)

</Blog>
