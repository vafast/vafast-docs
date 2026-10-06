---
title: Deploying to Production - Vafast
description: 'Deploy Vafast to production: Node.js and Bun servers, Docker images, Cloudflare Workers, PM2, graceful shutdown, timeouts and environment configuration.'
---

# Deploying to Production

This page is a guide to deploying Vafast to production. Vafast supports both the **Node.js** and **Bun** runtimes.

## Node.js Deployment

### Compile to JavaScript

Compile your code to JavaScript with the TypeScript compiler or a bundler:

```bash
# compile with tsc
npx tsc

# or use tsup (recommended: faster and smaller)
npm install -D tsup
npx tsup src/index.ts --format esm --dts
```

Run the compiled code:

```bash
node dist/index.js
```

### Docker Deployment (Node.js)

```dockerfile
# use the official Node.js image
FROM node:20-alpine AS base
WORKDIR /app

# install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# build the app
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# copy the necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vafast
USER vafast

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Process Management with PM2

We recommend managing Node.js processes with PM2:

```bash
npm install -g pm2
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'vafast-app',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Start the app:

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Bun Deployment

### Compile to a Binary

Bun can compile your app into a single executable:

```bash
bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts
```

Flags:
- `--compile` - compile to a binary
- `--minify-whitespace` - remove unnecessary whitespace
- `--minify-syntax` - minify JavaScript syntax
- `--target bun` - optimize for the Bun platform
- `--outfile server` - output file name

Run the compiled binary:

```bash
./server
```

::: tip Benefits
The compiled binary:
- doesn't need the Bun runtime installed
- uses 2-3x less memory
- is easy to distribute and deploy
:::

::: warning AVX2 requirement
Bun requires a CPU that supports the AVX2 instruction set. If you see errors full of random garbled (often CJK) characters, the machine doesn't support AVX2.
:::

### Compile to JavaScript

If you can't compile to a binary, bundle to JavaScript instead:

```bash
bun build \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile ./dist/index.js \
	./src/index.ts
```

### Docker Deployment (Bun)

```dockerfile
# use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN npm install --frozen-lockfile --production

# build the app
FROM base AS builder
COPY package.json bun.lockb ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# production image
FROM oven/bun:1-slim AS runner
WORKDIR /app

# copy the necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["bun", "dist/index.js"]
```

### Why Not Use --minify

If you use [OpenTelemetry](/en/integrations/opentelemetry), `--minify` shortens function names to single characters, which hurts trace readability.

If you don't use OpenTelemetry, you can use:

```bash
bun build \
  --compile \
  --minify \
  --target bun \
  --outfile server \
  ./src/index.ts
```

---

## Common Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key
```

Use them in code:

```typescript
// src/config.ts
export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development'
}
```

### Graceful Shutdown

In container environments like Kubernetes, handling the SIGTERM signal correctly is important. Vafast has built-in graceful shutdown support:

```typescript
import { Server, serve } from 'vafast'

const server = new Server(routes)

serve({
  fetch: server.fetch,
  port: 3000,
  // enable graceful shutdown
  gracefulShutdown: {
    timeout: 30000,  // wait at most 30 seconds
    onShutdown: () => {
      console.log('🔄 Shutdown signal received, waiting for in-flight requests...')
    },
    onShutdownComplete: () => {
      console.log('👋 Server shut down gracefully')
    }
  }
})
```

::: tip K8s recommendations
- Set `terminationGracePeriodSeconds` greater than `gracefulShutdown.timeout`
- Use a `preStop` hook to add a short delay so the service is removed from the load balancer before shutting down
:::

### Request Timeouts

To keep slow requests from tying up resources, configure a request timeout in production:

```typescript
serve({
  fetch: server.fetch,
  port: 3000,
  // request timeout config
  timeout: {
    requestTimeout: 30000,  // at most 30 seconds per request
    // Node.js defaults are fine for headersTimeout and keepAliveTimeout
  },
  gracefulShutdown: true
})
```

**Timeout options:**

| Option | Default | Description |
|------|--------|------|
| `requestTimeout` | `0` (unlimited) | Maximum processing time per request |
| `headersTimeout` | Node default 60s | Timeout for receiving request headers |
| `keepAliveTimeout` | Node default 5s | Keep-Alive idle timeout |

::: warning When do you need requestTimeout?
- **Behind a reverse proxy (Nginx/K8s Ingress)**: the proxy usually has timeouts configured, so you can skip it
- **No reverse proxy**: you must set it (30-120s recommended) to prevent slow DoS attacks
:::

### Health Check Endpoints

Kubernetes distinguishes liveness and readiness probes:

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  // Liveness: is the process alive
  defineRoute({
    method: 'GET',
    path: '/health/live',
    handler: () => ({ status: 'ok' })
  }),
  
  // Readiness: is the service ready to receive traffic
  defineRoute({
    method: 'GET',
    path: '/health/ready',
    handler: async () => {
      // check the health of dependent services
      const dbHealthy = await checkDatabaseConnection()
      
      if (!dbHealthy) {
        return new Response(
          JSON.stringify({ status: 'unhealthy', db: 'disconnected' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    }
  })
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

**Example K8s probe config:**

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Structured Logging

```typescript
import { Server, defineMiddleware } from 'vafast'

const loggingMiddleware = defineMiddleware(async (req, next) => {
  const startTime = Date.now()
  const response = await next()
  const duration = Date.now() - startTime
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: response.status,
    duration: `${duration}ms`,
    userAgent: req.headers.get('user-agent')
  }))
  
  return response
})

const server = new Server(routes)
server.use(loggingMiddleware)
```

---

## Load Balancing

### Nginx Reverse Proxy

```nginx
upstream vafast_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://vafast_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Security

### Security Headers

```typescript
import { Server } from 'vafast'
import { helmet } from '@vafast/helmet'

const server = new Server(routes)
server.use(helmet())
```

### Rate Limiting

```typescript
import { Server } from 'vafast'
import { rateLimit } from '@vafast/rate-limit'

const server = new Server(routes)
server.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // at most 100 requests per IP
}))
```

### HTTPS

**Node.js:**

```typescript
import { createServer } from 'node:https'
import { readFileSync } from 'node:fs'

const server = new Server(routes)

createServer({
  cert: readFileSync('path/to/cert.pem'),
  key: readFileSync('path/to/key.pem')
}, (req, res) => {
  // adapt to fetch
}).listen(443)
```

**Bun:**

```typescript
Bun.serve({
  port: 443,
  fetch: server.fetch,
  tls: {
    cert: Bun.file('path/to/cert.pem'),
    key: Bun.file('path/to/key.pem')
  }
})
```

---

## Performance

### Enable Compression

```typescript
import { Server } from 'vafast'
import { compress } from '@vafast/compress'

const server = new Server(routes)
server.use(compress())
```

### Caching Strategy

```typescript
const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/static/:file',
    handler: ({ params }) => {
      const file = getStaticFile(params.file)
      return new Response(file, {
        headers: {
          'Cache-Control': 'public, max-age=31536000',
          'ETag': generateETag(file)
        }
      })
    }
  })
])
```

---

## Deployment Checklist

Before deploying to production, make sure:

- [ ] All environment variables are configured correctly
- [ ] The database connection has been tested
- [ ] Logging is enabled
- [ ] Monitoring is configured
- [ ] Health check endpoints are implemented
- [ ] Error handling is complete
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is configured (if applicable)
- [ ] A backup strategy is in place

---

## Runtime Comparison

| Feature | Node.js | Bun |
|------|---------|-----|
| Startup speed | Slower | Fast |
| Memory usage | Higher | Lower |
| Binary compilation | ❌ | ✅ |
| Ecosystem compatibility | ✅ Fully compatible | ✅ Mostly compatible |
| Production stability | ✅ Mature and stable | ✅ Evolving fast |
| PM2 support | ✅ | ✅ |
| Docker support | ✅ | ✅ |

---

## Next Steps

- Read [Routing](/en/routing) to learn how to organize routes
- Learn the [Middleware System](/en/middleware) to extend functionality
- Explore [Validation](/en/essential/validation) for type safety
- See [Best Practices](/en/essential/best-practice) for more development tips
