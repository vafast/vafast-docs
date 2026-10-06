---
title: Prisma Integration - Vafast
description: 'Guide to integrating Vafast with Prisma ORM: initializing Prisma, defining the schema, client setup, a service layer, usage in Vafast routes, migrations and seed data.'
---

# Prisma Integration

Vafast integrates seamlessly with Prisma ORM, giving you type-safe database operations and a great developer experience.

## Installing Dependencies

```bash
# npm
npm install @prisma/client
npm install -D prisma

# or with bun
npm install @prisma/client
npm install -D prisma
```

## Initializing Prisma

```bash
# initialize a Prisma project
npx prisma init

# choose a database (e.g. PostgreSQL, MySQL, SQLite)
```

## Defining the Database Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]

  @@map("tags")
}

enum Role {
  USER
  ADMIN
}
```

## Database Client Setup

```typescript
// src/db/client.ts
import { PrismaClient } from '@prisma/client'

// create the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
```

## Database Service Layer

```typescript
// src/services/userService.ts
import { prisma } from '../db/client'
import type { User, Prisma } from '@prisma/client'
import { hashPassword, verifyPassword } from '../utils/auth'

export class UserService {
  // find a user by email
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    })
  }

  // find a user by ID
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  // create a user
  async create(userData: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await hashPassword(userData.password)
    
    return await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    })
  }

  // update a user
  async update(id: string, userData: Prisma.UserUpdateInput): Promise<User> {
    if (userData.password) {
      userData.password = await hashPassword(userData.password as string)
    }
    
    return await prisma.user.update({
      where: { id },
      data: userData
    })
  }

  // delete a user
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id }
    })
  }

  // list users (paginated)
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count()
    ])
    
    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const userService = new UserService()
```

```typescript
// src/services/postService.ts
import { prisma } from '../db/client'
import type { Post, Prisma } from '@prisma/client'

export class PostService {
  // get all published posts
  async findPublished(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({
        where: { published: true }
      })
    ])
    
    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  // get a post by ID
  async findById(id: string) {
    return await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // create a post
  async create(postData: Prisma.PostCreateInput): Promise<Post> {
    return await prisma.post.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // update a post
  async update(id: string, postData: Prisma.PostUpdateInput): Promise<Post> {
    return await prisma.post.update({
      where: { id },
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // delete a post
  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id }
    })
  }

  // search posts
  async search(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          AND: [
            { published: true },
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({
        where: {
          AND: [
            { published: true },
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        }
      })
    ])
    
    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const postService = new PostService()
```

```typescript
// src/services/tagService.ts
import { prisma } from '../db/client'
import type { Tag, Prisma } from '@prisma/client'

export class TagService {
  // get all tags
  async findAll(): Promise<Tag[]> {
    return await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })
  }

  // get a tag by ID
  async findById(id: string): Promise<Tag | null> {
    return await prisma.tag.findUnique({
      where: { id }
    })
  }

  // create a tag
  async create(tagData: Prisma.TagCreateInput): Promise<Tag> {
    return await prisma.tag.create({
      data: tagData
    })
  }

  // delete a tag
  async delete(id: string): Promise<void> {
    await prisma.tag.delete({
      where: { id }
    })
  }
}

export const tagService = new TagService()
```

## Using It in Vafast Routes

::: tip Authentication
Protected routes use `authWithApp` + `requireUser` from [@vafast/auth-middleware](/en/middleware/auth-middleware). Public routes such as sign-up and sign-in don't need the auth middleware.
:::

```typescript
// src/routes.ts
import { defineRoute, defineRoutes, err, Type } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'
import { userService, postService, tagService } from './services'

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
      const existingUser = await userService.findByEmail(email)
      if (existingUser) {
        throw err.conflict('User already exists')
      }
      
      // create the new user
      const newUser = await userService.create({
        email,
        name,
        password,
        role: 'USER'
      })
      
      return { 
        user: { 
          id: newUser.id, 
          email: newUser.email, 
          name: newUser.name,
          role: newUser.role
        },
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
      const user = await userService.findByEmail(email)
      if (!user) {
        throw err.unauthorized('User not found')
      }
      
      // verify the password
      const isValidPassword = await verifyPassword(password, user.password)
      if (!isValidPassword) {
        throw err.unauthorized('Incorrect password')
      }
      
      return { 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role
        },
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
      
      const result = await postService.findPublished(page, limit)
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
      const post = await postService.findById(params.id)
      
      if (!post) {
        throw err.notFound('Post not found')
      }
      
      return { post }
    }
  }),
  
  defineAuthRouteWithApp({
    method: 'POST',
    path: '/api/posts',
    middleware: [authWithApp, requireUser],
    handler: async ({ body, userInfo }) => {
      const newPost = await postService.create({
        ...body,
        authorId: userInfo.id,
      })
      
      return { post: newPost }
    },
    schema: {
      body: Type.Object({
        title: Type.String({ minLength: 1 }),
        content: Type.String({ minLength: 1 }),
        published: Type.Optional(Type.Boolean()),
        tagIds: Type.Optional(Type.Array(Type.String()))
      })
    },
  }),
  
  defineAuthRouteWithApp({
    method: 'PUT',
    path: '/api/posts/:id',
    middleware: [authWithApp, requireUser],
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: Type.Object({
        title: Type.Optional(Type.String({ minLength: 1 })),
        content: Type.Optional(Type.String({ minLength: 1 })),
        published: Type.Optional(Type.Boolean()),
        tagIds: Type.Optional(Type.Array(Type.String()))
      })
    },
    handler: async ({ params, body }) => {
      const post = await postService.update(params.id, body)
      return { post }
    },
  }),
  
  defineAuthRouteWithApp({
    method: 'DELETE',
    path: '/api/posts/:id',
    middleware: [authWithApp, requireUser],
    schema: {
      params: Type.Object({
        id: Type.String()
      })
    },
    handler: async ({ params }) => {
      await postService.delete(params.id)
      return { message: 'Post deleted successfully' }
    },
  }),
  
  // tag routes
  defineRoute({
    method: 'GET',
    path: '/api/tags',
    handler: async () => {
      const tags = await tagService.findAll()
      return { tags }
    }
  }),
  
  defineAuthRouteWithApp({
    method: 'POST',
    path: '/api/tags',
    middleware: [authWithApp, requireUser],
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 })
      })
    },
    handler: async ({ body }) => {
      const newTag = await tagService.create(body)
      return { tag: newTag }
    },
  })
])
```

## Database Migrations

```bash
# generate migration files
bunx prisma migrate dev --name init

# apply migrations to the database
bunx prisma migrate deploy

# reset the database (development)
bunx prisma migrate reset

# inspect the database
bunx prisma studio
```

## Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // create users
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'hashed_password_here',
      role: 'ADMIN'
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: 'hashed_password_here',
      role: 'USER'
    }
  })

  // create tags
  const tag1 = await prisma.tag.upsert({
    where: { name: 'Technology' },
    update: {},
    create: { name: 'Technology' }
  })

  const tag2 = await prisma.tag.upsert({
    where: { name: 'Programming' },
    update: {},
    create: { name: 'Programming' }
  })

  // create posts
  const post1 = await prisma.post.upsert({
    where: { id: 'post-1' },
    update: {},
    create: {
      id: 'post-1',
      title: 'Getting Started with Vafast',
      content: 'Vafast is a modern, type-safe web framework...',
      published: true,
      authorId: user1.id,
      tags: {
        connect: [{ id: tag1.id }, { id: tag2.id }]
      }
    }
  })

  console.log({ user1, user2, tag1, tag2, post1 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Transactions

```typescript
// src/services/transactionService.ts
import { prisma } from '../db/client'

export class TransactionService {
  // a transaction that creates a user and a post
  async createUserWithPost(userData: any, postData: any) {
    return await prisma.$transaction(async (tx) => {
      // create the user
      const user = await tx.user.create({
        data: userData
      })
      
      // create the post
      const post = await tx.post.create({
        data: {
          ...postData,
          authorId: user.id
        }
      })
      
      return { user, post }
    })
  }

  // a batch operation transaction
  async batchCreatePosts(postsData: any[], authorId: string) {
    return await prisma.$transaction(async (tx) => {
      const posts = []
      
      for (const postData of postsData) {
        const post = await tx.post.create({
          data: {
            ...postData,
            authorId
          }
        })
        posts.push(post)
      }
      
      return posts
    })
  }
}

export const transactionService = new TransactionService()
```

## Performance Optimization

```typescript
// src/services/optimizedPostService.ts
import { prisma } from '../db/client'

export class OptimizedPostService {
  // optimize queries with select
  async findPostsOptimized(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: {
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({
        where: { published: true }
      })
    ])
    
    return { posts, total, page, limit }
  }

  // use include for relation queries
  async findPostWithRelations(id: string) {
    return await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }
}

export const optimizedPostService = new OptimizedPostService()
```

## Testing

```typescript
// src/services/__tests__/userService.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { prisma } from '../../db/client'
import { userService } from '../userService'

describe('UserService', () => {
  beforeEach(async () => {
    // clean up test data
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()
  })
  
  afterEach(async () => {
    // clean up test data
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()
  })
  
  it('should create and find user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      role: 'USER' as const
    }
    
    const newUser = await userService.create(userData)
    expect(newUser).toBeDefined()
    expect(newUser.email).toBe(userData.email)
    
    const foundUser = await userService.findByEmail(userData.email)
    expect(foundUser).toBeDefined()
    expect(foundUser?.id).toBe(newUser.id)
  })
  
  it('should update user', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      role: 'USER'
    })
    
    const updatedUser = await userService.update(user.id, {
      name: 'Updated Name'
    })
    
    expect(updatedUser.name).toBe('Updated Name')
  })
})
```

## Best Practices

1. **Type safety**: make full use of Prisma's type inference
2. **Query optimization**: use select and include to optimize query performance
3. **Transaction management**: use transactions for operations that must be atomic
4. **Connection management**: use connection pooling in production
5. **Migration management**: manage schema changes with Prisma Migrate
6. **Test coverage**: write thorough tests for database operations
7. **Performance monitoring**: monitor query performance and optimize slow queries

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [Prisma docs](https://www.prisma.io/docs) - official Prisma ORM documentation
- [Middleware system](/en/middleware) - explore available middleware
- [Type validation](/en/patterns/type) - learn about the type validation system
- [Deployment guide](/en/patterns/deploy) - production deployment advice
