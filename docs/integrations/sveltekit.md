---
title: SvelteKit 集成 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: SvelteKit 集成 - Vafast

  - - meta
    - name: 'description'
      content: 在 SvelteKit 应用中集成 Vafast 框架，实现现代化的全栈开发体验。

  - - meta
    - property: 'og:description'
      content: 在 SvelteKit 应用中集成 Vafast 框架，实现现代化的全栈开发体验。
---

# SvelteKit 集成

Vafast 可以与 SvelteKit 无缝集成，为您提供强大的后端 API 和现代化的前端开发体验。

## 项目结构

```
my-vafast-sveltekit-app/
├── src/
│   ├── lib/                 # 共享库
│   ├── routes/              # SvelteKit 路由
│   ├── api/                 # Vafast API 路由
│   │   ├── routes.ts        # 路由定义
│   │   ├── server.ts        # Vafast 服务器
│   │   └── types.ts         # 类型定义
│   └── app.html             # HTML 模板
├── package.json
├── svelte.config.js
├── vite.config.ts
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
      ? ['http://localhost:5173'] 
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
    path: '/api/todos',
    handler: createRouteHandler(async () => {
      // 模拟数据库查询
      const todos = [
        { id: 1, title: 'Learn Vafast', completed: false },
        { id: 2, title: 'Build SvelteKit app', completed: true }
      ]
      
      return { todos }
    })
  },
  
  {
    method: 'POST',
    path: '/api/todos',
    handler: createRouteHandler(async ({ body }) => {
      // 创建新待办事项
      const newTodo = {
        id: Date.now(),
        ...body,
        completed: false,
        createdAt: new Date().toISOString()
      }
      
      return { todo: newTodo }, { status: 201 }
    }),
    body: Type.Object({
      title: Type.String({ minLength: 1 }),
      description: Type.Optional(Type.String())
    })
  },
  
  {
    method: 'PUT',
    path: '/api/todos/:id',
    handler: createRouteHandler(async ({ params, body }) => {
      const todoId = parseInt(params.id)
      
      // 模拟数据库更新
      const updatedTodo = {
        id: todoId,
        ...body,
        updatedAt: new Date().toISOString()
      }
      
      return { todo: updatedTodo }
    }),
    params: Type.Object({
      id: Type.String({ pattern: '^\\d+$' })
    }),
    body: Type.Object({
      title: Type.Optional(Type.String({ minLength: 1 })),
      description: Type.Optional(Type.String()),
      completed: Type.Optional(Type.Boolean())
    })
  },
  
  {
    method: 'DELETE',
    path: '/api/todos/:id',
    handler: createRouteHandler(async ({ params }) => {
      const todoId = parseInt(params.id)
      
      // 模拟数据库删除
      console.log(`Deleting todo ${todoId}`)
      
      return { success: true }
    }),
    params: Type.Object({
      id: Type.String({ pattern: '^\\d+$' })
    })
  }
])
```

## 创建 SvelteKit API 路由

```typescript
// src/routes/api/[...path]/+server.ts
import { handler } from '../../../api/server'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ request }) => {
  return handler(request)
}

export const POST: RequestHandler = async ({ request }) => {
  return handler(request)
}

export const PUT: RequestHandler = async ({ request }) => {
  return handler(request)
}

export const DELETE: RequestHandler = async ({ request }) => {
  return handler(request)
}

export const PATCH: RequestHandler = async ({ request }) => {
  return handler(request)
}
```

## 类型定义

```typescript
// src/api/types.ts
import { Type } from '@sinclair/typebox'

export const TodoSchema = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  completed: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
})

export const CreateTodoSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String())
})

export const UpdateTodoSchema = Type.Partial(CreateTodoSchema)

export type Todo = typeof TodoSchema.T
export type CreateTodo = typeof CreateTodoSchema.T
export type UpdateTodo = typeof UpdateTodoSchema.T
```

## 前端集成

### 使用 API 路由

```svelte
<!-- src/routes/todos/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import type { Todo } from '$lib/api/types'
  
  let todos: Todo[] = []
  let loading = true
  let error: string | null = null
  
  async function fetchTodos() {
    try {
      loading = true
      error = null
      const response = await fetch('/api/todos')
      const data = await response.json()
      todos = data.todos
    } catch (err: any) {
      error = err.message || '获取待办事项失败'
    } finally {
      loading = false
    }
  }
  
  async function createTodo(title: string, description?: string) {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description })
      })
      
      if (response.ok) {
        const result = await response.json()
        todos = [...todos, result.todo]
      }
    } catch (err) {
      console.error('创建待办事项失败:', err)
    }
  }
  
  async function toggleTodo(todo: Todo) {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: !todo.completed })
      })
      
      if (response.ok) {
        const result = await response.json()
        todos = todos.map(t => t.id === todo.id ? result.todo : t)
      }
    } catch (err) {
      console.error('更新待办事项失败:', err)
    }
  }
  
  async function deleteTodo(id: number) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        todos = todos.filter(t => t.id !== id)
      }
    } catch (err) {
      console.error('删除待办事项失败:', err)
    }
  }
  
  onMount(() => {
    fetchTodos()
  })
</script>

<svelte:head>
  <title>待办事项</title>
</svelte:head>

<main class="container">
  <h1>待办事项</h1>
  
  <!-- 创建新待办事项 -->
  <div class="create-form">
    <input 
      type="text" 
      placeholder="输入待办事项标题" 
      id="newTodo"
      on:keydown={(e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          createTodo(e.target.value.trim())
          e.target.value = ''
        }
      }}
    />
  </div>
  
  <!-- 错误显示 -->
  {#if error}
    <div class="error">{error}</div>
  {/if}
  
  <!-- 加载状态 -->
  {#if loading}
    <div class="loading">加载中...</div>
  {:else}
    <!-- 待办事项列表 -->
    <div class="todos">
      {#each todos as todo (todo.id)}
        <div class="todo-item {todo.completed ? 'completed' : ''}">
          <input 
            type="checkbox" 
            checked={todo.completed}
            on:change={() => toggleTodo(todo)}
          />
          <div class="todo-content">
            <h3>{todo.title}</h3>
            {#if todo.description}
              <p>{todo.description}</p>
            {/if}
          </div>
          <button 
            class="delete-btn"
            on:click={() => deleteTodo(todo.id)}
          >
            删除
          </button>
        </div>
      {/each}
    </div>
  {/if}
</main>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }
  
  .create-form {
    margin-bottom: 2rem;
  }
  
  .create-form input {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    outline: none;
  }
  
  .create-form input:focus {
    border-color: #007bff;
  }
  
  .error {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .loading {
    text-align: center;
    color: #666;
    font-size: 1.1rem;
  }
  
  .todo-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 1rem;
    background: white;
  }
  
  .todo-item.completed {
    opacity: 0.6;
  }
  
  .todo-item.completed .todo-content h3 {
    text-decoration: line-through;
  }
  
  .todo-content {
    flex: 1;
    margin: 0 1rem;
  }
  
  .todo-content h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .todo-content p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .delete-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .delete-btn:hover {
    background: #c82333;
  }
</style>
```

### 创建待办事项页面

```svelte
<!-- src/routes/todos/create/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation'
  import type { CreateTodo } from '$lib/api/types'
  
  let title = ''
  let description = ''
  let loading = false
  
  async function handleSubmit() {
    if (!title.trim()) return
    
    try {
      loading = true
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined })
      })
      
      if (response.ok) {
        // 创建成功后跳转到列表页面
        goto('/todos')
      } else {
        const error = await response.json()
        alert(error.message || '创建失败')
      }
    } catch (err) {
      alert('创建失败')
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>创建待办事项</title>
</svelte:head>

<main class="container">
  <h1>创建新待办事项</h1>
  
  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-group">
      <label for="title">标题 *</label>
      <input 
        type="text" 
        id="title"
        bind:value={title}
        required
        placeholder="输入待办事项标题"
      />
    </div>
    
    <div class="form-group">
      <label for="description">描述</label>
      <textarea 
        id="description"
        bind:value={description}
        rows="4"
        placeholder="输入待办事项描述（可选）"
      ></textarea>
    </div>
    
    <div class="form-actions">
      <button type="button" on:click={() => goto('/todos')} class="btn-secondary">
        取消
      </button>
      <button type="submit" disabled={loading || !title.trim()} class="btn-primary">
        {loading ? '创建中...' : '创建'}
      </button>
    </div>
  </form>
</main>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }
  
  .form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }
  
  .btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
  
  .btn-secondary:hover {
    background: #545b62;
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

## SvelteKit 配置

```typescript
// svelte.config.js
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/kit/vite'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    
    // 配置 API 路由
    routes: {
      'api/[...path]': 'src/routes/api/[...path]/+server.ts'
    }
  },
  
  preprocess: vitePreprocess()
}

export default config
```

## 环境配置

```typescript
// src/api/config.ts
export const config = {
  development: {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000']
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
  const env = process.env.NODE_ENV || 'development'
  return config[env as keyof typeof config]
}
```

## 测试

### API 测试

```typescript
// src/api/__tests__/todos.test.ts
import { describe, expect, it } from 'bun:test'
import { handler } from '../server'

describe('Todos API', () => {
  it('should get todos', async () => {
    const request = new Request('http://localhost/api/todos')
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.todos).toBeDefined()
    expect(Array.isArray(data.todos)).toBe(true)
  })
  
  it('should create todo', async () => {
    const todoData = {
      title: 'Test Todo',
      description: 'Test description'
    }
    
    const request = new Request('http://localhost/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todoData)
    })
    
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.todo.title).toBe(todoData.title)
    expect(data.todo.description).toBe(todoData.description)
  })
})
```

## 部署

### Node.js 部署

```typescript
// build/server/entry.js
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

1. **类型安全**：使用 TypeScript 确保前后端类型一致
2. **错误处理**：实现统一的错误处理机制
3. **中间件顺序**：注意中间件的执行顺序
4. **环境配置**：根据环境配置不同的设置
5. **测试覆盖**：为 API 路由编写完整的测试
6. **性能优化**：使用适当的缓存和压缩策略
7. **SSR 优化**：利用 SvelteKit 的 SSR 能力优化性能

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [SvelteKit 文档](https://kit.svelte.dev) - SvelteKit 官方文档
- [中间件系统](/middleware) - 探索可用的中间件
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
