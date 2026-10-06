---
title: Astro Integration - Vafast
description: 'Guide to integrating Vafast with Astro: project structure, creating a Vafast API server, defining type-safe API routes and calling them from the Astro frontend.'
---

# Astro Integration

Vafast integrates seamlessly with Astro, giving you a powerful backend API and a modern frontend development experience.

## Project Structure

```
my-vafast-astro-app/
├── src/
│   ├── pages/               # Astro pages
│   ├── components/          # Astro components
│   ├── layouts/             # Astro layouts
│   ├── api/                 # Vafast API routes
│   │   ├── routes.ts        # route definitions
│   │   ├── server.ts        # Vafast server
│   │   └── types.ts         # type definitions
│   └── lib/                 # shared libraries
├── package.json
├── astro.config.mjs
└── tsconfig.json
```

## Installing Dependencies

```bash
npm install vafast @vafast/cors @vafast/helmet
npm install -D @types/node
```

## Creating the Vafast API Server

```typescript
// src/api/server.ts
import { Server } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'
import { routes } from './routes'

const server = new Server(routes)
server.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:4321'] 
    : [process.env.PUBLIC_APP_URL],
  credentials: true
}))
server.use(helmet())

export const handler = server.fetch
```

## Defining API Routes

```typescript
// src/api/routes.ts
import { defineRoute, defineRoutes, err, Type } from 'vafast'

export const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/posts',
    handler: async () => {
      // simulate a database query
      const posts = [
        { id: 1, title: 'First Post', content: 'Hello World!' },
        { id: 2, title: 'Second Post', content: 'Another post' }
      ]
      
      return { posts }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/posts',
    schema: {
      body: Type.Object({
        title: Type.String({ minLength: 1 }),
        content: Type.String({ minLength: 1 })
      })
    },
    handler: async ({ body }) => {
      // create a new post
      const newPost = {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
      
      return { post: newPost }
    }
  }),
  
  defineRoute({
    method: 'GET',
    path: '/api/posts/:id',
    handler: async ({ params }) => {
      const postId = parseInt(params.id)
      
      // simulate a database query
      const post = { id: postId, title: 'Sample Post', content: 'Sample content' }
      
      if (!post) {
        throw err.notFound('Post not found')
      }
      
      return { post }
    },
    schema: {
      params: Type.Object({
        id: Type.String({ pattern: '^\\d+$' })
      })
    }
  })
])
```

## Creating API Endpoints

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

## Type Definitions

```typescript
// src/api/types.ts
import { Type } from 'vafast'

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

## Frontend Integration

### Using the API Endpoints

```astro
---
// src/pages/posts.astro
import Layout from '../layouts/Layout.astro'

// fetch the post list
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

### Creating a Post Form

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
        // redirect to the post list
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

## Middleware Integration

### Auth Middleware

::: tip Recommended for production
For full user authentication, use [@vafast/auth-middleware](/en/middleware/auth-middleware) (`authWithApp`, `requireUser`). Below is how to integrate it in Astro API routes.
:::

```typescript
// src/api/routes.ts
import { defineRoute, defineRoutes } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'

export const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [authWithApp],
    children: [
      defineAuthRouteWithApp({
        method: 'GET',
        path: '/profile',
        middleware: [requireUser],
        handler: ({ userInfo, app }) => ({
          userId: userInfo.id,
          appId: app.id,
        }),
      }),
    ],
  }),
])
```

If you only need simple JWT verification (no separate auth service), see [@vafast/jwt](/en/middleware/jwt) or write your own `defineMiddleware`.

## Astro Configuration

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

## Environment Configuration

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

## Testing

### API Tests

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

## Deployment

### Node.js Deployment

```typescript
// dist/server/entry.mjs
import { handler } from './api/server.js'
import { createServer } from 'http'

const server = createServer(async (req, res) => {
  try {
    const response = await handler(req)
    
    // copy the response headers
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

### Docker Deployment

**Node.js version:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/server/entry.mjs"]
```

**Bun version:**

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["bun", "run", "start"]
```

## Best Practices

1. **Type safety**: use TypeBox to keep frontend and backend types consistent
2. **Error handling**: implement a unified error handling mechanism
3. **Middleware order**: pay attention to middleware execution order
4. **Environment config**: use different settings per environment
5. **Test coverage**: write thorough tests for API routes
6. **Performance**: use appropriate caching and compression strategies
7. **SSR optimization**: take advantage of Astro's SSR capabilities

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [Astro docs](https://docs.astro.build) - official Astro documentation
- [Middleware system](/en/middleware) - explore available middleware
- [Type validation](/en/patterns/type) - learn about the type validation system
- [Deployment guide](/en/patterns/deploy) - production deployment advice
