---
title: 用 Vafast 加速你的下一个 Prisma 服务器
sidebar: false
editLink: false
search: false
---

<script setup>
    import Blog from '../components/blog/Layout.vue'
</script>

<Blog
title="用 Vafast 加速你的下一个 Prisma 服务器"
src="/blog/with-prisma/prism.webp"
alt="中心放置的三角棱镜"
author="vafast"
date="2023 年 6 月 4 日"
>
Prisma 是一个著名的 TypeScript ORM，以其优秀的开发者体验而闻名。

它提供了类型安全和直观的 API，使我们能够使用流畅自然的语法与数据库进行交互。

编写数据库查询就像使用 TypeScript 的自动补全编写数据结构一样简单，随后 Prisma 会生成高效的 SQL 查询并在后台处理数据库连接。

Prisma 的一个突出特点是它与流行数据库的无缝集成，例如：
- PostgreSQL
- MySQL
- SQLite
- SQL Server
- MongoDB
- CockroachDB

因此，我们可以灵活地选择最适合我们项目需求的数据库，而不必妥协于 Prisma 带来的强大性能。

这意味着你可以专注于真正重要的事情：构建应用程序逻辑。

Prisma 是 Vafast 的灵感之一，其声明性 API 和流畅的开发体验让人愉悦。

## Vafast

当你问应该使用什么框架时，Vafast 是一个优秀的选择。

Vafast 是一个高性能的 TypeScript Web 框架，支持 Node.js 和 Bun 等多种运行时。

Vafast 的性能远超传统框架，结合了声明性 API，能够创建统一的类型系统和端到端的类型安全。

Vafast 以其流畅的开发者体验而闻名，其设计非常适合与 Prisma 一起使用。

凭借 Vafast 的严格类型验证，我们可以轻松地使用声明性 API 集成 Vafast 和 Prisma。

换句话说，Vafast 确保运行时类型与 TypeScript 的类型始终同步，使其表现得像一种类型严格的语言，你可以完全信任类型系统，提前发现任何类型错误，减少与类型相关的调试错误。

## 设置

我们开始的第一步是创建一个 Vafast 项目。

```bash
npx create-vafast-app vafast-prisma
cd vafast-prisma
```

其中 `vafast-prisma` 是我们的项目名称，可以自由更改为你喜欢的名称。

现在安装 Prisma CLI 作为开发依赖。
```bash
npm add -D prisma
```

然后我们可以使用 `prisma init` 设置 Prisma 项目。
```bash
npx prisma init
```

设置完成后，我们可以看到 Prisma 会更新 `.env` 文件，并生成一个名为 **prisma** 的文件夹，文件夹内有 **schema.prisma** 文件。

**schema.prisma** 是使用 Prisma 的 schema 语言定义的数据库模型。

让我们将 **schema.prisma** 文件更新如下作为演示：
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

这段代码告诉 Prisma 我们想创建一个名为 **User** 的表，包含以下列：
| 列名 | 类型 | 约束 |
| --- | --- | --- |
| id  | 数字 | 主键并自动增值 |
| username | 字符串 | 唯一 |
| password | 字符串 | - |

然后 Prisma 会读取模式，并根据 `.env` 文件中的 DATABASE_URL，因此在同步我们的数据库之前，我们需要先定义 `DATABASE_URL`。

由于我们没有正在运行的数据库，可以使用 Docker 设置一个：
```bash
docker run -p 5432:5432 -e POSTGRES_PASSWORD=12345678 -d postgres
```

现在进入项目根目录下的 `.env` 文件并编辑：
```
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/db?schema=public"
```

然后我们可以运行 `prisma migrate` 来同步数据库与 Prisma 模式：
```bash
npx prisma migrate dev --name init
```

之后 Prisma 将根据我们的模式生成强类型的 Prisma Client 代码。

这意味着我们可以在代码编辑器中获得自动补全和类型检查，在编译时捕获潜在错误，而不是在运行时。

## 进入代码

在我们的 **src/index.ts** 中，更新 Vafast 服务器以创建一个简单的用户注册接口。

```ts
import { Server, defineRoutes, createHandler, serve } from 'vafast'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/sign-up',
    handler: createHandler(async ({ body }) => {
      return await db.user.create({
        data: body as { username: string; password: string }
      })
    })
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('🚀 Vafast 正在运行于 http://localhost:3000')
})
```

我们刚刚创建了一个简单的接口，用于使用 Vafast 和 Prisma 向数据库插入新用户。

现在问题是，body 可能是任何内容，而不仅限于我们预期定义的类型。

我们可以通过使用 Vafast 的类型系统来改进这一点。
```ts
import { Server, defineRoutes, createHandler, serve, Type } from 'vafast'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// 定义验证 Schema
const SignUpBody = Type.Object({
  username: Type.String(),
  password: Type.String({ minLength: 8 })
})

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/sign-up',
    handler: createHandler(
      { body: SignUpBody },
      async ({ body }) => {
        return await db.user.create({ data: body })
      }
    )
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('🚀 Vafast 正在运行于 http://localhost:3000')
})
```

这告诉 Vafast 验证传入请求的 body 是否匹配指定的形状，并将回调中 `body` 的 TypeScript 类型更新为匹配相同类型：
```ts
// 'body' 现在的类型如下：
{
    username: string
    password: string
}
```

这意味着如果这个形状与数据库表不匹配，它会立即给你警告。

这在你需要编辑表格或执行迁移时非常有效，Vafast 可以逐行记录错误，因为类型冲突在达到生产环境之前。

## 错误处理
由于我们的 `username` 字段是唯一的，有时 Prisma 可能会抛出错误，可能会在尝试注册时意外重复 `username`，如：
```ts
Invalid `prisma.user.create()` invocation:

Unique constraint failed on the fields: (`username`)
```

我们可以使用中间件来处理 Prisma 错误：
```ts
import { Server, defineRoutes, createHandler, serve, Type, json } from 'vafast'
import { PrismaClient, Prisma } from '@prisma/client'

const db = new PrismaClient()

const SignUpBody = Type.Object({
  username: Type.String(),
  password: Type.String({ minLength: 8 })
})

// Prisma 错误处理中间件
const prismaErrorHandler = async (req: Request, next: () => Promise<Response>) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        // P2002: "Unique constraint failed on the {constraint}"
        case 'P2002':
          return json({ error: '用户名必须是唯一的' }, 400)
        default:
          return json({ error: '数据库错误' }, 500)
      }
    }
    throw error
  }
}

const routes = defineRoutes([
  {
    method: 'POST',
    path: '/sign-up',
    middleware: [prismaErrorHandler],
    handler: createHandler(
      { body: SignUpBody },
      async ({ body }) => {
        return await db.user.create({ data: body })
      }
    )
        }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('🚀 Vafast 正在运行于 http://localhost:3000')
})
```

使用中间件，回调内部抛出的任何错误都会被捕获，允许我们定义自定义错误处理。

根据 [Prisma 文档](https://www.prisma.io/docs/reference/api-reference/error-reference#p2002)，错误代码 'P2002' 意味着执行查询时违反了唯一约束。

由于此表只有一个 `username` 字段是唯一的，我们可以推断该错误是由于用户名不唯一引起，因此我们返回自定义错误消息。

## 组织代码

当我们的服务器变得复杂时，建议将代码分离到不同的模块中：

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
import { defineRoutes, createHandler } from 'vafast'
import { PrismaClient } from '@prisma/client'
import { UserModel } from '../models/user'
import { prismaErrorHandler } from '../middleware/prisma'

const db = new PrismaClient()

export const userRoutes = defineRoutes([
  {
    method: 'POST',
    path: '/sign-up',
    middleware: [prismaErrorHandler],
    handler: createHandler(
      { body: UserModel.signUp },
      async ({ body }) => {
        const user = await db.user.create({
          data: body,
          select: { id: true, username: true }
        })
        return user
      }
    )
  }
])
```

```ts
// index.ts
import { Server, serve } from 'vafast'
import { userRoutes } from './routes/user'

const server = new Server([...userRoutes])

serve({ fetch: server.fetch, port: 3000 }, () => {
  console.log('🚀 Vafast 正在运行于 http://localhost:3000')
})
```

这种结构使代码更易于维护和测试。

## 接下来是什么
Vafast 进入了一个全新的开发者体验时代。

通过 Prisma，我们可以加速与数据库的交互，Vafast 则加速了我们在开发者体验和性能方面创建后台 Web 服务器的过程。

> 与之工作是一种绝对的乐趣。

Vafast 正在努力创建一个更好的开发者体验的新标准，构建高性能的 TypeScript 服务器。

如果你对 Vafast 感兴趣，欢迎查看我们的 [GitHub](https://github.com/vafast/vafast)
</Blog>
