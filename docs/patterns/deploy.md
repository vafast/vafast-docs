---
title: 部署到生产环境 - Vafast
---

# 部署到生产环境

本页面是关于如何将 Vafast 部署到生产环境的指南。Vafast 支持 **Node.js** 和 **Bun** 两种运行时。

## Node.js 部署

### 编译为 JavaScript

使用 TypeScript 编译器或打包工具将代码编译为 JavaScript：

```bash
# 使用 tsc 编译
npx tsc

# 或使用 tsup（推荐，更快更小）
npm install -D tsup
npx tsup src/index.ts --format esm --dts
```

运行编译后的代码：

```bash
node dist/index.js
```

### Docker 部署（Node.js）

```dockerfile
# 使用 Node.js 官方镜像
FROM node:20-alpine AS base
WORKDIR /app

# 安装依赖
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 构建应用
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 复制必要文件
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vafast
USER vafast

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### PM2 进程管理

推荐使用 PM2 管理 Node.js 进程：

```bash
npm install -g pm2
```

创建 `ecosystem.config.js`：

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

启动应用：

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Bun 部署

### 编译为二进制

Bun 支持将应用编译为单个可执行文件：

```bash
bun build \
  --compile \
  --minify-whitespace \
  --minify-syntax \
  --target bun \
  --outfile server \
  ./src/index.ts
```

参数说明：
- `--compile` - 编译为二进制文件
- `--minify-whitespace` - 删除不必要的空白
- `--minify-syntax` - 压缩 JavaScript 语法
- `--target bun` - 针对 Bun 平台优化
- `--outfile server` - 输出文件名

运行编译后的二进制：

```bash
./server
```

::: tip 优势
编译后的二进制文件：
- 不需要安装 Bun 运行时
- 内存占用降低 2-3 倍
- 便于分发和部署
:::

::: warning AVX2 要求
Bun 要求机器支持 AVX2 指令集。如果遇到随机中文字符错误，说明机器不支持 AVX2。
:::

### 编译为 JavaScript

如果无法编译为二进制，可以打包为 JavaScript：

```bash
bun build \
  --minify-whitespace \
  --minify-syntax \
  --target bun \
  --outfile ./dist/index.js \
  ./src/index.ts
```

### Docker 部署（Bun）

```dockerfile
# 使用 Bun 官方镜像
FROM oven/bun:1 AS base
WORKDIR /app

# 安装依赖
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# 构建应用
FROM base AS builder
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# 生产镜像
FROM oven/bun:1-slim AS runner
WORKDIR /app

# 复制必要文件
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["bun", "dist/index.js"]
```

### 为什么不使用 --minify

如果使用 [OpenTelemetry](/integrations/opentelemetry)，`--minify` 会将函数名缩减为单个字符，影响跟踪可读性。

不使用 OpenTelemetry 时可以使用：

```bash
bun build \
  --compile \
  --minify \
  --target bun \
  --outfile server \
  ./src/index.ts
```

---

## 通用配置

### 环境变量配置

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key
```

在代码中使用：

```typescript
// src/config.ts
export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development'
}
```

### 健康检查端点

```typescript
import { Server, defineRoutes, createHandler, serve } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/health',
    handler: createHandler(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }))
  }
])

const server = new Server(routes)

serve({ fetch: server.fetch, port: 3000 })
```

### 结构化日志

```typescript
const loggingMiddleware = async (req: Request, next: () => Promise<Response>) => {
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
}

const server = new Server(routes)
server.use(loggingMiddleware)
```

---

## 负载均衡

### Nginx 反向代理

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

## 安全配置

### 安全头

```typescript
import { helmet } from '@vafast/helmet'

const server = new Server(routes)
server.use(helmet())
```

### 速率限制

```typescript
import { rateLimit } from '@vafast/rate-limit'

const server = new Server(routes)
server.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个 IP 最多 100 次请求
}))
```

### HTTPS 配置

**Node.js:**

```typescript
import { createServer } from 'node:https'
import { readFileSync } from 'node:fs'

const server = new Server(routes)

createServer({
  cert: readFileSync('path/to/cert.pem'),
  key: readFileSync('path/to/key.pem')
}, (req, res) => {
  // 适配 fetch
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

## 性能优化

### 启用压缩

```typescript
import { compress } from '@vafast/compress'

const server = new Server(routes)
server.use(compress())
```

### 缓存策略

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/static/:file',
    handler: createHandler(({ params }) => {
      const file = getStaticFile(params.file)
      return new Response(file, {
        headers: {
          'Cache-Control': 'public, max-age=31536000',
          'ETag': generateETag(file)
        }
      })
    })
  }
])
```

---

## 部署检查清单

在部署到生产环境之前，请确保：

- [ ] 所有环境变量已正确配置
- [ ] 数据库连接已测试
- [ ] 日志记录已启用
- [ ] 监控已配置
- [ ] 健康检查端点已实现
- [ ] 错误处理已完善
- [ ] 安全头已配置
- [ ] 速率限制已启用
- [ ] HTTPS 已配置（如果适用）
- [ ] 备份策略已制定

---

## 运行时对比

| 特性 | Node.js | Bun |
|------|---------|-----|
| 启动速度 | 较慢 | 快 |
| 内存占用 | 较高 | 较低 |
| 二进制编译 | ❌ | ✅ |
| 生态兼容 | ✅ 完全兼容 | ✅ 大部分兼容 |
| 生产稳定性 | ✅ 成熟稳定 | ✅ 快速发展 |
| PM2 支持 | ✅ | ✅ |
| Docker 支持 | ✅ | ✅ |

---

## 下一步

- 查看 [路由系统](/routing) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强功能
- 探索 [验证系统](/essential/validation) 了解类型安全
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议
