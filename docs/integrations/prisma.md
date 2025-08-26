---
title: Prisma 集成 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Prisma 集成 - Vafast

  - - meta
    - name: 'description'
      content: 在 Vafast 应用中集成 Prisma ORM，实现类型安全的数据库操作。

  - - meta
    - property: 'og:description'
      content: 在 Vafast 应用中集成 Prisma ORM，实现类型安全的数据库操作。
---

# Prisma 集成

Vafast 可以与 Prisma ORM 无缝集成，为您提供类型安全的数据库操作和优秀的开发体验。

## 安装依赖

```bash
bun add @prisma/client
bun add -D prisma
```

## 初始化 Prisma

```bash
# 初始化 Prisma 项目
bunx prisma init

# 选择数据库类型（例如：PostgreSQL, MySQL, SQLite）
```

## 数据库模式定义

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

## 数据库客户端配置

```typescript
// src/db/client.ts
import { PrismaClient } from '@prisma/client'

// 创建 Prisma 客户端实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
```

## 数据库服务层

```typescript
// src/services/userService.ts
import { prisma } from '../db/client'
import type { User, Prisma } from '@prisma/client'
import { hashPassword, verifyPassword } from '../utils/auth'

export class UserService {
  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    })
  }

  // 根据ID查找用户
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  // 创建用户
  async create(userData: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await hashPassword(userData.password)
    
    return await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    })
  }

  // 更新用户
  async update(id: string, userData: Prisma.UserUpdateInput): Promise<User> {
    if (userData.password) {
      userData.password = await hashPassword(userData.password as string)
    }
    
    return await prisma.user.update({
      where: { id },
      data: userData
    })
  }

  // 删除用户
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id }
    })
  }

  // 获取用户列表（分页）
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
  // 获取所有已发布的文章
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

  // 根据ID获取文章
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

  // 创建文章
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

  // 更新文章
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

  // 删除文章
  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id }
    })
  }

  // 搜索文章
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
  // 获取所有标签
  async findAll(): Promise<Tag[]> {
    return await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })
  }

  // 根据ID获取标签
  async findById(id: string): Promise<Tag | null> {
    return await prisma.tag.findUnique({
      where: { id }
    })
  }

  // 创建标签
  async create(tagData: Prisma.TagCreateInput): Promise<Tag> {
    return await prisma.tag.create({
      data: tagData
    })
  }

  // 删除标签
  async delete(id: string): Promise<void> {
    await prisma.tag.delete({
      where: { id }
    })
  }
}

export const tagService = new TagService()
```

## 在 Vafast 路由中使用

```typescript
// src/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'
import { userService, postService, tagService } from './services'
import { authMiddleware } from './middleware/auth'

export const routes = defineRoutes([
  // 用户认证路由
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: createRouteHandler(async ({ body }) => {
      const { email, name, password } = body
      
      // 检查用户是否已存在
      const existingUser = await userService.findByEmail(email)
      if (existingUser) {
        return { error: '用户已存在' }, { status: 400 }
      }
      
      // 创建新用户
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
    handler: createRouteHandler(async ({ body }) => {
      const { email, password } = body
      
      // 查找用户
      const user = await userService.findByEmail(email)
      if (!user) {
        return { error: '用户不存在' }, { status: 401 }
      }
      
      // 验证密码
      const isValidPassword = await verifyPassword(password, user.password)
      if (!isValidPassword) {
        return { error: '密码错误' }, { status: 401 }
      }
      
      return { 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role
        },
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
    handler: createRouteHandler(async ({ query }) => {
      const page = parseInt(query.page || '1')
      const limit = parseInt(query.limit || '10')
      
      const result = await postService.findPublished(page, limit)
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
    handler: createRouteHandler(async ({ params }) => {
      const post = await postService.findById(params.id)
      
      if (!post) {
        return { error: '文章不存在' }, { status: 404 }
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
    handler: createRouteHandler(async ({ body, request }) => {
      // 这里应该验证用户身份
      const authorId = 'user-id-from-auth' // 从认证中间件获取
      
      const newPost = await postService.create({
        ...body,
        authorId
      })
      
      return { post: newPost }, { status: 201 }
    }),
    body: Type.Object({
      title: Type.String({ minLength: 1 }),
      content: Type.String({ minLength: 1 }),
      published: Type.Optional(Type.Boolean()),
      tagIds: Type.Optional(Type.Array(Type.String()))
    }),
    middleware: [authMiddleware]
  },
  
  {
    method: 'PUT',
    path: '/api/posts/:id',
    handler: createRouteHandler(async ({ params, body }) => {
      // 这里应该验证用户身份和权限
      
      const updatedPost = await postService.update(params.id, body)
      
      if (!updatedPost) {
        return { error: '文章不存在' }, { status: 404 }
      }
      
      return { post: updatedPost }
    }),
    params: Type.Object({
      id: Type.String()
    }),
    body: Type.Object({
      title: Type.Optional(Type.String({ minLength: 1 })),
      content: Type.Optional(Type.String({ minLength: 1 })),
      published: Type.Optional(Type.Boolean()),
      tagIds: Type.Optional(Type.Array(Type.String()))
    }),
    middleware: [authMiddleware]
  },
  
  {
    method: 'DELETE',
    path: '/api/posts/:id',
    handler: createRouteHandler(async ({ params }) => {
      // 这里应该验证用户身份和权限
      
      await postService.delete(params.id)
      return { message: '文章删除成功' }
    }),
    params: Type.Object({
      id: Type.String()
    }),
    middleware: [authMiddleware]
  },
  
  // 标签路由
  {
    method: 'GET',
    path: '/api/tags',
    handler: createRouteHandler(async () => {
      const tags = await tagService.findAll()
      return { tags }
    })
  },
  
  {
    method: 'POST',
    path: '/api/tags',
    handler: createRouteHandler(async ({ body }) => {
      const newTag = await tagService.create(body)
      return { tag: newTag }, { status: 201 }
    }),
    body: Type.Object({
      name: Type.String({ minLength: 1 })
    }),
    middleware: [authMiddleware]
  }
])
```

## 数据库迁移

```bash
# 生成迁移文件
bunx prisma migrate dev --name init

# 应用迁移到数据库
bunx prisma migrate deploy

# 重置数据库（开发环境）
bunx prisma migrate reset

# 查看数据库状态
bunx prisma studio
```

## 种子数据

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建用户
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

  // 创建标签
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

  // 创建文章
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

## 事务处理

```typescript
// src/services/transactionService.ts
import { prisma } from '../db/client'

export class TransactionService {
  // 创建用户和文章的事务
  async createUserWithPost(userData: any, postData: any) {
    return await prisma.$transaction(async (tx) => {
      // 创建用户
      const user = await tx.user.create({
        data: userData
      })
      
      // 创建文章
      const post = await tx.post.create({
        data: {
          ...postData,
          authorId: user.id
        }
      })
      
      return { user, post }
    })
  }

  // 批量操作事务
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

## 性能优化

```typescript
// src/services/optimizedPostService.ts
import { prisma } from '../db/client'

export class OptimizedPostService {
  // 使用 select 优化查询
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

  // 使用 include 进行关联查询
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

## 测试

```typescript
// src/services/__tests__/userService.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { prisma } from '../../db/client'
import { userService } from '../userService'

describe('UserService', () => {
  beforeEach(async () => {
    // 清理测试数据
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()
  })
  
  afterEach(async () => {
    // 清理测试数据
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

## 最佳实践

1. **类型安全**：充分利用 Prisma 的类型推断功能
2. **查询优化**：使用 select 和 include 优化查询性能
3. **事务管理**：在需要原子性的操作中使用事务
4. **连接管理**：在生产环境中使用连接池
5. **迁移管理**：使用 Prisma Migrate 管理数据库模式变更
6. **测试覆盖**：为数据库操作编写完整的测试
7. **性能监控**：监控查询性能并优化慢查询

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [Prisma 文档](https://www.prisma.io/docs) - Prisma ORM 官方文档
- [中间件系统](/middleware) - 探索可用的中间件
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
