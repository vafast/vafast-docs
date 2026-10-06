---
title: Integration Cheat Sheet - Vafast
description: 'Vafast integration cheat sheet: quick integration examples for common libraries covering databases, auth, middleware, monitoring and logging, file handling, caching, scheduling, compression and more.'
---

# Integration Cheat Sheet

A quick reference showing how to integrate common libraries and tools with Vafast.

## Databases

### Prisma

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: async () => {
      const users = await prisma.user.findMany()
      return { users }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/users',
    schema: {
      body: Type.Object({
        name: Type.String(),
        email: Type.String({ format: 'email' })
      })
    },
    handler: async ({ body }) => {
      const user = await prisma.user.create({
        data: body
      })
      return { user }
    }
  })
])
```

### Drizzle

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { users } from './schema'

const db = drizzle(new Database('sqlite.db'))

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: async () => {
      const allUsers = await db.select().from(users)
      return { users: allUsers }
    }
  })
])
```

### MongoDB

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://localhost:27017')
const db = client.db('myapp')

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: async () => {
      const users = await db.collection('users').find({}).toArray()
      return { users }
    }
  })
])
```

## Authentication

This is a cheat sheet, not a beginner tutorial. Learn `defineMiddleware` from the [Tutorial](/en/tutorial) first, then pick what you need.

### Auth Middleware (connecting to a separate auth service)

Use `@vafast/auth-middleware` when multi-tenant business services connect to a separate auth service. See [Auth Middleware](/en/middleware/auth-middleware) for details.

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'

const routes = defineRoutes([
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

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 })
```

### JWT (issuing / verifying tokens)

`@vafast/jwt` fits **self-built auth** scenarios (issuing tokens, verifying signatures), which is a different purpose from `@vafast/auth-middleware` (connecting to a separate auth service).

```typescript
import { Server, defineRoute, defineRoutes, Type } from 'vafast'
import { jwt } from '@vafast/jwt'

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/login',
    schema: {
      body: Type.Object({
        username: Type.String(),
        password: Type.String()
      })
    },
    handler: async ({ body }) => {
      const token = await jwt.sign(body, { expiresIn: '1h' })
      return { token }
    }
  })
])

const server = new Server(routes)
server.use(jwt({
  secret: process.env.JWT_SECRET
}))
```

### Better Auth

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { BetterAuth } from 'better-auth'
import { VafastAdapter } from 'better-auth/adapters/vafast'

const auth = new BetterAuth({
  adapter: VafastAdapter({
    // options
  })
})

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/profile',
    handler: async ({ request }) => {
      const session = await auth.api.getSession(request)
      return { user: session?.user }
    }
  })
])
```

## Middleware

### CORS

```typescript
import { Server, defineRoute, defineRoutes } from 'vafast'
import { cors } from '@vafast/cors'

const routes = defineRoutes([
  // route definitions
])

const server = new Server(routes)
server.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}))
```

### Helmet

```typescript
import { Server } from 'vafast'
import { helmet } from '@vafast/helmet'

const server = new Server(routes)
server.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}))
```

### Rate Limiting

```typescript
import { Server } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const server = new Server(routes)
server.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per 15 minutes
}))
```

## Monitoring and Logging

### OpenTelemetry

```typescript
import { Server } from 'vafast'
import { opentelemetry } from '@vafast/opentelemetry'

const server = new Server(routes)
server.use(opentelemetry({
  serviceName: 'my-vafast-app',
  tracing: {
    enabled: true,
    exporter: {
      type: 'otlp',
      endpoint: 'http://localhost:4317'
    }
  }
}))
```

### Server Timing

```typescript
import { Server } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const server = new Server(routes)
server.use(serverTiming())
```

## File Handling

### File Uploads

For file uploads, use **POST** (create a new resource) or **PUT** (replace a specific resource).

```typescript
import { defineRoute, defineRoutes, parseFile, parseFormData, err } from 'vafast'
import { writeFile } from 'node:fs/promises'

const routes = defineRoutes([
  // Option 1: POST a new file (most common)
  // the server decides where to store it and returns a file ID
  defineRoute({
    method: 'POST',
    path: '/files',
    handler: async ({ req }) => {
      const file = await parseFile(req)
      const fileId = crypto.randomUUID()
      
      await writeFile(`./uploads/${fileId}-${file.name}`, file.data)
      
      return { 
        id: fileId, 
        filename: file.name,
        size: file.size 
      }
    }
  }),

  // Option 2: PUT to a specific location (replace/overwrite)
  // the client specifies the file ID; idempotent
  defineRoute({
    method: 'PUT',
    path: '/files/:fileId',
    handler: async ({ req, params }) => {
      const file = await parseFile(req)
      
      await writeFile(`./uploads/${params.fileId}`, file.data)
      
      return { 
        id: params.fileId,
        filename: file.name,
        replaced: true 
      }
    }
  }),

  // Option 3: use the native formData API
  defineRoute({
    method: 'POST',
    path: '/upload',
    handler: async ({ req }) => {
      const formData = await req.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        throw err.badRequest('No file uploaded')
      }
      
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(`./uploads/${file.name}`, buffer)
      
      return { success: true, filename: file.name }
    }
  })
])
```

### Static File Serving

```typescript
import { Server } from 'vafast'
import { staticFiles } from '@vafast/static'

const server = new Server(routes)
server.use(staticFiles({
  root: './public',
  prefix: '/static'
}))
```

## Caching

### Redis

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { Redis } from 'ioredis'

const redis = new Redis()

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users/:id',
    handler: async ({ params }) => {
      // try the cache first
      const cached = await redis.get(`user:${params.id}`)
      if (cached) {
        return JSON.parse(cached)
      }
      
      // fetch from the database
      const user = await getUserFromDB(params.id)
      
      // cache the result
      await redis.setex(`user:${params.id}`, 3600, JSON.stringify(user))
      
      return { user }
    }
  })
])
```

### In-Memory Cache

```typescript
import { defineRoute, defineRoutes } from 'vafast'

const cache = new Map()

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/data/:key',
    handler: async ({ params }) => {
      if (cache.has(params.key)) {
        return { data: cache.get(params.key), cached: true }
      }
      
      const data = await fetchData(params.key)
      cache.set(params.key, data)
      
      return { data, cached: false }
    }
  })
])
```

## Task Scheduling

### Cron Jobs

```typescript
import { Server } from 'vafast'
import { cron } from '@vafast/cron'

const server = new Server(routes)
server.use(cron({
  jobs: [
    {
      name: 'cleanup',
      schedule: '0 2 * * *', // every day at 2 AM
      task: async () => {
        console.log('Running cleanup task...')
        // run the cleanup job
      }
    }
  ]
}))
```

## Compression

### Gzip/Brotli

```typescript
import { Server } from 'vafast'
import { compress } from '@vafast/compress'

const server = new Server(routes)
server.use(compress({
  algorithms: ['gzip', 'brotli'],
  threshold: 1024
}))
```

## Template Engines

### HTML Rendering

```typescript
import { defineRoute, defineRoutes } from 'vafast'
import { html } from '@vafast/html'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => {
      return html`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Vafast App</title>
          </head>
          <body>
            <h1>Welcome to Vafast!</h1>
          </body>
        </html>
      `
    }
  })
])
```

## Testing

### Unit Tests

```typescript
import { describe, expect, it } from 'vitest'
import { Server, defineRoute, defineRoutes } from 'vafast'

describe('User Routes', () => {
  it('should create a user', async () => {
    const routes = defineRoutes([
      defineRoute({
        method: 'POST',
        path: '/users',
        handler: ({ body }) => {
          return { id: '123', ...body }
        }
      })
    ])
    
    const server = new Server(routes)
    
    const request = new Request('http://localhost/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    })
    
    const response = await server.fetch(request)
    const data = await response.json()
    
    expect(data.id).toBe('123')
    expect(data.name).toBe('John')
  })
})
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

### Environment Variables

```env
# database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# JWT
JWT_SECRET="your-secret-key"

# Redis
REDIS_URL="redis://localhost:6379"

# monitoring
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
```

## SSE Streaming

### AI Chat Streaming

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'
import OpenAI from 'openai'

const openai = new OpenAI()

const routes = defineRoutes([
  defineRoute({
    method: 'POST',
    path: '/chat/stream',
    sse: true,  // explicitly declare an SSE endpoint
    schema: {
      body: Type.Object({ message: Type.String() })
    },
    handler: async function* ({ body }) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: body.message }],
        stream: true,
      })
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield { type: 'text_delta', data: { content } }
        }
      }
      
      yield { type: 'done', data: { message: 'Stream completed' } }
    },
  })
])
```

### Progress Updates

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/tasks/:taskId/progress',
    sse: true,
    schema: { params: Type.Object({ taskId: Type.String() }) },
    handler: async function* ({ params }) {
      const { taskId } = params
      
      while (true) {
        const task = await getTaskStatus(taskId) // your business logic
        
        yield { status: task.status, progress: task.progress }
        
        if (task.status === 'completed' || task.status === 'failed') {
          return
        }
        
        await new Promise(r => setTimeout(r, 2000))
      }
    },
  })
])
```

> 📖 See [SSE Streaming](/en/essential/sse) for full documentation

## Best Practices

1. **Error handling**: always wrap async operations in try-catch
2. **Type safety**: use TypeBox for runtime type validation
3. **Middleware order**: pay attention to middleware execution order
4. **Performance monitoring**: monitor app performance with OpenTelemetry
5. **Security**: use Helmet and other security middleware
6. **Testing**: write test cases for all routes

## Related Links

- [Middleware system](/en/middleware) - explore available middleware
- [Routing guide](/en/routing) - learn how to define routes
- [SSE Streaming](/en/essential/sse) - detailed Server-Sent Events documentation
- [Type validation](/en/patterns/type) - learn about the type validation system
- [Deployment guide](/en/patterns/deploy) - production deployment advice
