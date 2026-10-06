---
title: SvelteKit Integration - Vafast
description: 'Guide to integrating Vafast with SvelteKit: project structure, creating a Vafast API server and SvelteKit API routes, type definitions and frontend integration.'
---

# SvelteKit Integration

Vafast integrates seamlessly with SvelteKit, giving you a powerful backend API and a modern frontend development experience.

## Project Structure

```
my-vafast-sveltekit-app/
├── src/
│   ├── lib/                 # shared libraries
│   ├── routes/              # SvelteKit routes
│   ├── api/                 # Vafast API routes
│   │   ├── routes.ts        # route definitions
│   │   ├── server.ts        # Vafast server
│   │   └── types.ts         # type definitions
│   └── app.html             # HTML template
├── package.json
├── svelte.config.js
├── vite.config.ts
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
    ? ['http://localhost:5173'] 
    : [process.env.PUBLIC_APP_URL],
  credentials: true
}))
server.use(helmet())

export const handler = server.fetch
```

## Defining API Routes

```typescript
// src/api/routes.ts
import { defineRoute, defineRoutes, Type } from 'vafast'

export const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/todos',
    handler: async () => {
      // simulate a database query
      const todos = [
        { id: 1, title: 'Learn Vafast', completed: false },
        { id: 2, title: 'Build SvelteKit app', completed: true }
      ]
      
      return { todos }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/todos',
    schema: {
      body: Type.Object({
        title: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String())
      })
    },
    handler: async ({ body }) => {
      // create a new todo
      const newTodo = {
        id: Date.now(),
        ...body,
        completed: false,
        createdAt: new Date().toISOString()
      }
      
      return { todo: newTodo }
    }
  }),
  
  defineRoute({
    method: 'PUT',
    path: '/api/todos/:id',
    schema: {
      params: Type.Object({
        id: Type.String({ pattern: '^\\d+$' })
      }),
      body: Type.Object({
        title: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        completed: Type.Optional(Type.Boolean())
      })
    },
    handler: async ({ params, body }) => {
      const todoId = parseInt(params.id)
      
      // simulate a database update
      const updatedTodo = {
        id: todoId,
        ...body,
        updatedAt: new Date().toISOString()
      }
      
      return { todo: updatedTodo }
    }
  }),
  
  defineRoute({
    method: 'DELETE',
    path: '/api/todos/:id',
    schema: {
      params: Type.Object({
        id: Type.String({ pattern: '^\\d+$' })
    })
  }
])
```

## Creating SvelteKit API Routes

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

## Type Definitions

```typescript
// src/api/types.ts
import { Type } from 'vafast'

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

## Frontend Integration

### Using the API Routes

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
      error = err.message || 'Failed to fetch todos'
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
      console.error('Failed to create todo:', err)
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
      console.error('Failed to update todo:', err)
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
      console.error('Failed to delete todo:', err)
    }
  }
  
  onMount(() => {
    fetchTodos()
  })
</script>

<svelte:head>
  <title>Todos</title>
</svelte:head>

<main class="container">
  <h1>Todos</h1>
  
  <!-- create a new todo -->
  <div class="create-form">
    <input 
      type="text" 
      placeholder="Todo title" 
      id="newTodo"
      on:keydown={(e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          createTodo(e.target.value.trim())
          e.target.value = ''
        }
      }}
    />
  </div>
  
  <!-- error display -->
  {#if error}
    <div class="error">{error}</div>
  {/if}
  
  <!-- loading state -->
  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <!-- todo list -->
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
            Delete
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

### Create Todo Page

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
        // go to the list page after creating
        goto('/todos')
      } else {
        const error = await response.json()
        alert(error.message || 'Creation failed')
      }
    } catch (err) {
      alert('Creation failed')
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Create Todo</title>
</svelte:head>

<main class="container">
  <h1>Create a New Todo</h1>
  
  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-group">
      <label for="title">Title *</label>
      <input 
        type="text" 
        id="title"
        bind:value={title}
        required
        placeholder="Todo title"
      />
    </div>
    
    <div class="form-group">
      <label for="description">Description</label>
      <textarea 
        id="description"
        bind:value={description}
        rows="4"
        placeholder="Todo description (optional)"
      ></textarea>
    </div>
    
    <div class="form-actions">
      <button type="button" on:click={() => goto('/todos')} class="btn-secondary">
        Cancel
      </button>
      <button type="submit" disabled={loading || !title.trim()} class="btn-primary">
        {loading ? 'Creating...' : 'Create'}
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

## Middleware Integration

### Auth Middleware

::: tip Recommended for production
For full user authentication, use [@vafast/auth-middleware](/en/middleware/auth-middleware) (`authWithApp`, `requireUser`). Below is how to integrate it in SvelteKit API routes.
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

## SvelteKit Configuration

```typescript
// svelte.config.js
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/kit/vite'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    
    // configure API routes
    routes: {
      'api/[...path]': 'src/routes/api/[...path]/+server.ts'
    }
  },
  
  preprocess: vitePreprocess()
}

export default config
```

## Environment Configuration

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

## Testing

### API Tests

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

## Deployment

### Node.js Deployment

```typescript
// build/server/entry.js
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

ENV NODE_ENV=production

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "build"]
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

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
RUN npm install --production --frozen-lockfile

EXPOSE 3000

CMD ["bun", "build"]
```

## Best Practices

1. **Type safety**: use TypeScript to keep frontend and backend types consistent
2. **Error handling**: implement a unified error handling mechanism
3. **Middleware order**: pay attention to middleware execution order
4. **Environment config**: use different settings per environment
5. **Test coverage**: write thorough tests for API routes
6. **Performance**: use appropriate caching and compression strategies
7. **SSR optimization**: take advantage of SvelteKit's SSR capabilities

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [SvelteKit docs](https://kit.svelte.dev) - official SvelteKit documentation
- [Middleware system](/en/middleware) - explore available middleware
- [Type validation](/en/patterns/type) - learn about the type validation system
- [Deployment guide](/en/patterns/deploy) - production deployment advice
