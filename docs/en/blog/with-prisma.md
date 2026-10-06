---
title: Accelerate Your Next Prisma Server with Vafast
description: 'Build a high-performance Prisma server with Vafast: combine Prisma ORM type-safe database access with Vafast declarative routing to build TypeScript backend APIs fast.'
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../../components/blog/Layout.vue'
</script>

<Blog
title="Accelerate Your Next Prisma Server with Vafast"
src="/blog/with-prisma/prism.webp"
alt="A triangular prism placed at the center"
author="vafast"
date="June 4, 2023"
>
Prisma is a well-known TypeScript ORM, famous for its excellent developer experience.

It provides type safety and an intuitive API that lets us interact with the database using fluent, natural syntax.

Writing a database query is as simple as writing a data structure with TypeScript auto-completion; Prisma then generates efficient SQL queries and handles database connections in the background.

One of Prisma's standout features is its seamless integration with popular databases such as:
- PostgreSQL
- MySQL
- SQLite
- SQL Server
- MongoDB
- CockroachDB

So we can flexibly choose the database that best fits our project's needs, without compromising on the power Prisma brings.

That means you can focus on what really matters: building your application logic.

Prisma is one of Vafast's inspirations; its declarative API and smooth developer experience are a joy to use.

## Vafast

When you ask which framework to use, Vafast is an excellent choice.

Vafast is a high-performance TypeScript web framework that supports multiple runtimes such as Node.js and Bun.

Vafast far outperforms traditional frameworks and, combined with a declarative API, creates a unified type system with end-to-end type safety.

Vafast is known for its smooth developer experience, and its design is a great fit for use with Prisma.

With Vafast's strict type validation, we can easily integrate Vafast and Prisma using a declarative API.

In other words, Vafast keeps runtime types and TypeScript types in sync at all times, so it behaves like a strictly typed language: you can fully trust the type system, catch type errors early and spend less time debugging type-related bugs.

## Setup

The first step is to create a Vafast project.

```bash
npx create-vafast-app vafast-prisma
cd vafast-prisma
```

Here `vafast-prisma` is our project name; feel free to change it to anything you like.

Now install the Prisma CLI as a dev dependency.
```bash
npm add -D prisma
```

Then we can set up the Prisma project with `prisma init`.
```bash
npx prisma init
```

Once that's done, Prisma updates the `.env` file and generates a folder named **prisma** containing a **schema.prisma** file.

**schema.prisma** defines the database models in Prisma's schema language.

For this demo, let's update **schema.prisma** as follows:
```ts
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int     @id @default(autoincrement())
  username  String  @unique
  password  String
}
```

This tells Prisma we want to create a table named **User** with these columns:
| Column | Type | Constraints |
| --- | --- | --- |
| id  | Number | Primary key, auto-increment |
| username | String | Unique |
| password | String | - |

Prisma then reads the schema and uses DATABASE_URL from the `.env` file, so before syncing our database we need to define `DATABASE_URL`.

Since we don't have a running database, we can set one up with Docker:
```bash
docker run -p 5432:5432 -e POSTGRES_PASSWORD=12345678 -d postgres
```

Now open the `.env` file in the project root and edit it:
```
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/db?schema=public"
```

Then we can run `prisma migrate` to sync the database with the Prisma schema:
```bash
npx prisma migrate dev --name init
```

Prisma then generates strongly typed Prisma Client code based on our schema.

That means we get auto-completion and type checking in the editor, catching potential errors at compile time instead of runtime.

## Into the Code

In **src/index.ts**, let's update the Vafast server to create a simple user sign-up endpoint.

```ts
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/sign-up',
    handler: async ({ body }) => {
      return await db.user.create({
        data: body as { username: string; password: string }
      })
    }
  })
])

const server = new Server(routes)
```

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Vafast is running at http://localhost:3000')
})
```

We've just created a simple endpoint that inserts a new user into the database using Vafast and Prisma.

The problem now is that the body could be anything, not just the type we expect.

We can improve this with Vafast's type system.
```ts
import { Server, defineRoute, defineRoutes, serve, Type } from 'vafast'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// define the validation schema
const SignUpBody = Type.Object({
  username: Type.String(),
  password: Type.String({ minLength: 8 })
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/sign-up',
    schema: { body: SignUpBody },
    handler: async ({ body }) => {
      return await db.user.create({ data: body })
    }
  })
])

const server = new Server(routes)
```

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Vafast is running at http://localhost:3000')
})
```

This tells Vafast to validate that the incoming request body matches the specified shape, and updates the TypeScript type of `body` in the callback to match:
```ts
// 'body' now has the following type:
{
    username: string
    password: string
}
```

This means if the shape doesn't match the database table, you'll get a warning immediately.

This is especially effective when you need to edit a table or run a migration: Vafast surfaces the errors line by line as type conflicts before they reach production.

## Error Handling
Since our `username` field is unique, Prisma may sometimes throw an error when a sign-up accidentally reuses a `username`, such as:
```ts
Invalid `prisma.user.create()` invocation:

Unique constraint failed on the fields: (`username`)
```

We can use middleware to handle Prisma errors:
```ts
import { Server, defineRoute, defineRoutes, defineMiddleware, serve, Type, json } from 'vafast'
import { PrismaClient, Prisma } from '@prisma/client'

const db = new PrismaClient()

const SignUpBody = Type.Object({
  username: Type.String(),
  password: Type.String({ minLength: 8 })
})

// Prisma error handling middleware
const prismaErrorHandler = defineMiddleware(async (req, next) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        // P2002: "Unique constraint failed on the {constraint}"
        case 'P2002':
          return json({ error: 'Username must be unique' }, 400)
        default:
          return json({ error: 'Database error' }, 500)
      }
    }
    throw error
  }
})

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/sign-up',
    middleware: [prismaErrorHandler],
    schema: { body: SignUpBody },
    handler: async ({ body }) => {
      return await db.user.create({ data: body })
    }
  })
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Vafast is running at http://localhost:3000')
})
```

With the middleware, any error thrown inside the callback is caught, letting us define custom error handling.

According to the [Prisma docs](https://www.prisma.io/docs/reference/api-reference/error-reference#p2002), error code 'P2002' means a unique constraint was violated while executing the query.

Since `username` is the only unique field in this table, we can infer the error was caused by a non-unique username, so we return a custom error message.

## Organizing the Code

As the server grows more complex, it's a good idea to split the code into separate modules:

```ts
// models/user.ts
import { Type } from 'vafast'

export const UserModel = {
  signUp: Type.Object({
    username: Type.String(),
    password: Type.String({ minLength: 8 })
  }),
  
  response: Type.Object({
    id: Type.Number(),
    username: Type.String()
  })
}
```

```ts
// routes/user.ts
import { defineRoute, defineRoutes } from 'vafast'
import { PrismaClient } from '@prisma/client'
import { UserModel } from '../models/user'
import { prismaErrorHandler } from '../middleware/prisma'

const db = new PrismaClient()

export const userRoutes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/sign-up',
    middleware: [prismaErrorHandler],
    schema: { body: UserModel.signUp },
    handler: async ({ body }) => {
      const user = await db.user.create({
        data: body,
        select: { id: true, username: true }
      })
      return user
    }
  })
])
```

```ts
// index.ts
import { Server, serve } from 'vafast'
import { userRoutes } from './routes/user'

const server = new Server([...userRoutes])

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('Vafast is running at http://localhost:3000')
})
```

This structure makes the code easier to maintain and test.

## What's Next
Vafast ushers in a whole new era of developer experience.

With Prisma we can speed up how we interact with the database, and Vafast speeds up how we build backend web servers, both in developer experience and in performance.

> It's an absolute joy to work with.

Vafast is working to set a new standard for developer experience in building high-performance TypeScript servers.

If you're interested in Vafast, check out our [GitHub](https://github.com/vafast/vafast)
</Blog>
