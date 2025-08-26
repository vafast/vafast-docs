---
title: Astro 集成 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Astro 集成 - Vafast

  - - meta
    - name: 'description'
      content: 在 Astro 应用中集成 Vafast 框架，实现现代化的全栈开发体验。

  - - meta
    - property: 'og:description'
      content: 在 Astro 应用中集成 Vafast 框架，实现现代化的全栈开发体验。
---

# Astro 集成

Vafast 可以与 Astro 无缝集成，为您提供强大的后端 API 和现代化的前端开发体验。

## 项目结构

```
my-vafast-astro-app/
├── src/
│   ├── pages/               # Astro 页面
│   ├── components/          # Astro 组件
│   ├── layouts/             # Astro 布局
│   ├── api/                 # Vafast API 路由
│   │   ├── routes.ts        # 路由定义
│   │   ├── server.ts        # Vafast 服务器
│   │   └── types.ts         # 类型定义
│   └── lib/                 # 共享库
├── package.json
├── astro.config.mjs
└── tsconfig.json
```

## 安装依赖

```bash
bun add vafast @vafast/cors @vafast/helmet
bun add -D @types/node
```

## 创建 Vafast API 服务器

```typescript
// src/api/server.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'
import { routes } from './routes'

export const app = createRouteHandler(routes)
  .use(cors({
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:4321'] 
      : [process.env.PUBLIC_APP_URL],
    credentials: true
  }))
  .use(helmet())

export const handler = app.handler
```

## 定义 API 路由

```typescript
// src/api/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

export const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/posts',
    handler: createRouteHandler(async () => {
      // 模拟数据库查询
      const posts = [
        { id: 1, title: 'First Post', content: 'Hello World!' },
        { id: 2, title: 'Second Post', content: 'Another post' }
      ]
      
      return { posts }
    })
  },
  
  {
    method: 'POST',
    path: '/api/posts',
    handler: createRouteHandler(async ({ body }) => {
      // 创建新文章
      const newPost = {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
      
      return { post: newPost }, { status: 201 }
    }),
    body: Type.Object({
      title: Type.String({ minLength: 1 }),
      content: Type.String({ minLength: 1 })
    })
  },
  
  {
    method: 'GET',
    path: '/api/posts/:id',
    handler: createRouteHandler(async ({ params }) => {
      const postId = parseInt(params.id)
      
      // 模拟数据库查询
      const post = { id: postId, title: 'Sample Post', content: 'Sample content' }
      
      if (!post) {
        return { error: 'Post not found' }, { status: 404 }
      }
      
      return { post }
    }),
    params: Type.Object({
      id: Type.String({ pattern: '^\\d+$' })
    })
  }
])
```

## 创建 API 端点

```typescript
// src/pages/api/[...path].ts
import type { APIRoute } from 'astro'
import { handler } from '../../api/server'

export const GET: APIRoute = async ({ request }) => {
  return handler(request)
}

export const POST: APIRoute = async ({ request }) => {
  return handler(request)
}

export const PUT: APIRoute = async ({ request }) => {
  return handler(request)
}

export const DELETE: APIRoute = async ({ request }) => {
  return handler(request)
}

export const PATCH: APIRoute = async ({ request }) => {
  return handler(request)
}
```

## 类型定义

```typescript
// src/api/types.ts
import { Type } from '@sinclair/typebox'

export const PostSchema = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  content: Type.String(),
  createdAt: Type.String({ format: 'date-time' })
})

export const CreatePostSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  content: Type.String({ minLength: 1 })
})

export type Post = typeof PostSchema.T
export type CreatePost = typeof CreatePostSchema.T
```

## 前端集成

### 使用 API 端点

```astro
---
// src/pages/posts.astro
import Layout from '../layouts/Layout.astro'

// 获取文章列表
const response = await fetch(`${import.meta.env.SITE}/api/posts`)
const data = await response.json()
const posts = data.posts
---

<Layout title="Posts">
  <main>
    <h1>Blog Posts</h1>
    <div class="posts-grid">
      {posts.map((post: Post) => (
        <article class="post-card">
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <time datetime={post.createdAt}>
            {new Date(post.createdAt).toLocaleDateString()}
          </time>
        </article>
      ))}
    </div>
  </main>
</Layout>

<style>
  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }
  
  .post-card {
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
  }
  
  .post-card h2 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }
  
  .post-card p {
    color: #6b7280;
    margin-bottom: 1rem;
  }
  
  .post-card time {
    color: #9ca3af;
    font-size: 0.875rem;
  }
</style>
```

### 创建文章表单

```astro
---
// src/pages/posts/create.astro
import Layout from '../../layouts/Layout.astro
---

<Layout title="Create Post">
  <main>
    <h1>Create New Post</h1>
    <form id="createPostForm" class="create-form">
      <div class="form-group">
        <label for="title">Title</label>
        <input type="text" id="title" name="title" required />
      </div>
      
      <div class="form-group">
        <label for="content">Content</label>
        <textarea id="content" name="content" rows="6" required></textarea>
      </div>
      
      <button type="submit" class="submit-btn">Create Post</button>
    </form>
  </main>
</Layout>

<script>
  document.getElementById('createPostForm')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const formData = new FormData(e.target as HTMLFormElement)
    const postData = {
      title: formData.get('title'),
      content: formData.get('content')
    }
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Post created:', result.post)
        // 重定向到文章列表
        window.location.href = '/posts'
      } else {
        const error = await response.json()
        console.error('Error creating post:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  })
</script>

<style>
  .create-form {
    max-width: 600px;
    margin: 2rem auto;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
  }
  
  .submit-btn {
    background: #3b82f6;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .submit-btn:hover {
    background: #2563eb;
  }
</style>
```

## 中间件集成

### 认证中间件

```typescript
// src/api/middleware/auth.ts
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authMiddleware = async (
  request: Request,
  next: () => Promise<Response>
) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    // 验证 JWT token
    const user = await verifyToken(token)
    ;(request as AuthenticatedRequest).user = user
    return next()
  } catch (error) {
    return new Response('Invalid token', { status: 401 })
  }
}

async function verifyToken(token: string) {
  // 实现 JWT 验证逻辑
  // 这里应该使用 @vafast/jwt 中间件
  return { id: '123', email: 'user@example.com', role: 'user' }
}
```

### 使用认证中间件

```typescript
// src/api/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { authMiddleware } from './middleware/auth'

export const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/profile',
    handler: createRouteHandler(async ({ request }) => {
      const user = (request as AuthenticatedRequest).user
      return { user }
    }),
    middleware: [authMiddleware]
  }
])
```

## Astro 配置

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'server',
  adapter: 'node',
  
  vite: {
    ssr: {
      external: ['vafast']
    }
  },
  
  server: {
    port: 4321,
    host: true
  }
})
```

## 环境配置

```typescript
// src/api/config.ts
export const config = {
  development: {
    cors: {
      origin: ['http://localhost:4321', 'http://localhost:3000']
    },
    logging: true
  },
  
  production: {
    cors: {
      origin: [process.env.PUBLIC_APP_URL]
    },
    logging: false
  }
}

export const getConfig = () => {
  const env = import.meta.env.MODE || 'development'
  return config[env as keyof typeof config]
}
```

## 测试

### API 测试

```typescript
// src/api/__tests__/posts.test.ts
import { describe, expect, it } from 'bun:test'
import { handler } from '../server'

describe('Posts API', () => {
  it('should get posts', async () => {
    const request = new Request('http://localhost/api/posts')
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.posts).toBeDefined()
    expect(Array.isArray(data.posts)).toBe(true)
  })
  
  it('should create post', async () => {
    const postData = {
      title: 'Test Post',
      content: 'Test content'
    }
    
    const request = new Request('http://localhost/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    })
    
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.post.title).toBe(postData.title)
    expect(data.post.content).toBe(postData.content)
  })
})
```

## 部署

### Node.js 部署

```typescript
// dist/server/entry.mjs
import { handler } from './api/server.js'
import { createServer } from 'http'

const server = createServer(async (req, res) => {
  try {
    const response = await handler(req)
    
    // 复制响应头
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value)
    }
    
    res.statusCode = response.status
    res.end(await response.text())
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
```

### Docker 部署

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

## 最佳实践

1. **类型安全**：使用 TypeBox 确保前后端类型一致
2. **错误处理**：实现统一的错误处理机制
3. **中间件顺序**：注意中间件的执行顺序
4. **环境配置**：根据环境配置不同的设置
5. **测试覆盖**：为 API 路由编写完整的测试
6. **性能优化**：使用适当的缓存和压缩策略
7. **SSR 优化**：利用 Astro 的 SSR 能力优化性能

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [Astro 文档](https://docs.astro.build) - Astro 官方文档
- [中间件系统](/middleware) - 探索可用的中间件
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
